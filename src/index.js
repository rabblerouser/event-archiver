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

const newData = event => `${event.Records.map(record => JSON.stringify(record.kinesis)).join('\n')}\n`;

const appendEventToObject = event => existingContents => {
  return `${existingContents.Body}${newData(event)}`;
};

const createNewObject = event => s3Error => {
  if (s3Error.statusCode !== 404) {
    return Promise.reject(s3Error);
  }
  return newData(event);
};

module.exports = (bucket, date) => (event, context, callback) => {
  const s3 = new AWS.S3();
  const key = objectKey(date);
  return s3.getObject({ Bucket: bucket, Key: key }).promise()
    .then(
      appendEventToObject(event),
      createNewObject(event)
    )
    .then((newObjectContents) => {
      s3.putObject({
        Bucket: bucket,
        Key: key,
        ACL: 'private',
        Body: newObjectContents
      })
    })
    .then(() => callback(null, 'ok'))
    .catch(callback);
};
