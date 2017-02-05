# rabblerouser-event-archiver

An AWS lambda function that persists all events from a kinesis stream to an S3 bucket

## Background.
Kinesis can only keep events for up to 7 days (24 hours by default). This lambda function pipes everything to a bucket
so that we have a permanent record of all events.

## Install and run the tests
```sh
npm install
npm test
```

## Deployment
There is a build pipeline for this project, it publishes the zipped code to an s3 bucket.

Actual deployment of this lambda function requires a few moving parts, such as IAM roles, a kinesis stream to subscribe
to, and a bucket where events should be forwarded to.

With that in mind, the easiest way to deploy this right now is as part of a whole Rabble Rouser stack. See
[rabblerouser-infra](https://github.com/rabblerouser/rabblerouser-infra) for how to do that.

## API Reference

### Input

This lambda function receives an event object from kinesis that looks like this:

```js
{
  Records: [
    {
      kinesis: {
        kinesisSchemaVersion: '1.0',
        partitionKey: '<kinesis partition key>',
        sequenceNumber: '<sequence number of the event>',
        data: '<base64-encoded JSON string>', // This is where the real payload data is
        approximateArrivalTimestamp: 123456.78
      },
      eventSource: 'aws:kinesis',
      eventVersion: '1.0',
      eventID: '<shardID of the source shard>:<sequence number of the event>',
      eventName: 'aws:kinesis:record',
      invokeIdentityArn: '<ARN of the IAM role the lambda is running as>',
      awsRegion: '<region of the source kinesis stream>',
      eventSourceARN: '<ARN of the source kinesis stream>'
    },
  ]
}
```

### Output

This lambda function stores rows of JSON inside S3 objects, where each row contains these fields:

```json
{
  "kinesisSchemaVersion": "1.0",
  "partitionKey": "<kinesis partition key>",
  "sequenceNumber": "<sequence number of the event>",
  "data": "<base64-encoded JSON string>",
  "approximateArrivalTimestamp": 123456.78
}
```
