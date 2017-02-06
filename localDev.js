const lambda = require('.').handler;
const AWS = require('aws-sdk')

const kinesis = new AWS.Kinesis({
  endpoint: 'http://localhost:4567',
  region: 'ap-southeast-2',
  accessKeyId: 'FAKE',
  secretAccessKey: 'ALSO FAKE',
});

const callback = (err, result) => err ? console.error('Handler failed:', err) : console.log('Handler suceeded:', result);

const mapKinesisRecord = record => ({
  data: record.Data,
  sequenceNumber: record.SequenceNumber,
  approximateArrivalTimestamp: record.ApproximateArrivalTimestamp,
  partitionKey: record.PartitionKey,
});

const fetchAndProcessRecords = (shardIterator) => {
  return kinesis.getRecords({ ShardIterator: shardIterator }).promise().then((records) => {
    records.Records.forEach(kinesisRecord => {
      const event = { Records: [{ kinesis: mapKinesisRecord(kinesisRecord) }] };
      lambda(event, null, callback);
    });
    setTimeout(() => fetchAndProcessRecords(records.NextShardIterator), 500);
  });
}

kinesis.describeStream({ StreamName: 'rabblerouser_stream' }).promise()
  .then(stream => {
    console.log('Found rabblerouser_stream...');
    const shardId = stream.StreamDescription.Shards[0].ShardId

    const params = { ShardId: shardId, ShardIteratorType: 'LATEST', StreamName: 'rabblerouser_stream' };
    return kinesis.getShardIterator(params).promise();
  })
  .then(shardIterator => {
    console.log('Polling kinesis for events...');
    return shardIterator.ShardIterator;
  })
  .then(fetchAndProcessRecords)
  .catch(err => {
    console.error(err);
  });
