'use strict';
const AWS = require('aws-sdk');

const objectKey = now => {
  const zeroPad = number => number.length == 2 ? number : `0${number}`;

  const year = now.getUTCFullYear();
  const month = zeroPad(String(now.getUTCMonth()));
  const date = zeroPad(String(now.getUTCDate()));
  const hours = zeroPad(String(now.getUTCHours()));

  return `${year}-${month}-${date}_${hours}`;
}

const serialiseKinesisRecords = kinesisEvent => (
  `${kinesisEvent.Records.map(record => JSON.stringify(record.kinesis)).join('\n')}\n`
);

const appendEventToExistingObject = (kinesisEvent, console) => existingContents => {
  console.log('Found current object, will appending events to it');
  return `${existingContents.Body}${serialiseKinesisRecords(kinesisEvent)}`;
};

const createNewObject = (kinesisEvent, console) => s3Error => {
  if (s3Error.statusCode !== 404) {
    console.error('Got a non-404 error, aborting!');
    throw s3Error;
  }
  console.log('Got 404 for current object, will create a new one.');
  return serialiseKinesisRecords(kinesisEvent);
};

module.exports = (bucket, date, s3Config, console) => (event, context, callback) => {
  console.log(`event-archiver lambda received ${event.Records.length} event(s)`);
  const s3 = new AWS.S3(s3Config);
  const key = objectKey(date);
  console.log(`Looking for current S3 archive object: ${bucket}/${key}`);
  return s3.getObject({ Bucket: bucket, Key: key }).promise()
    .then(
      appendEventToExistingObject(event, console),
      createNewObject(event, console)
    )
    .then((newObjectContents) => {
      console.log(`Uploading new S3 contents to ${bucket}/${key}`);
      return s3.putObject({
        Bucket: bucket,
        Key: key,
        ACL: 'private',
        Body: newObjectContents
      }).promise();
    })
    .then(
      () => {
        console.log(`Succesfully uploaded to ${bucket}/${key}`);
        callback(null, 'ok');
      },
      (e) => {
        console.error(`Failed to upload to ${bucket}/${key}. Error: ${e}`);
        throw e;
      }
    )
    .catch(callback);
};
