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

const stringifyData = obj => Object.assign({}, obj, { data: obj.data.toString() });
const newData = event => `${event.Records.map(record => JSON.stringify(stringifyData(record.kinesis))).join('\n')}\n`;

const appendEventToExistingObject = event => existingContents => {
  return `${existingContents.Body}${newData(event)}`;
};

const createNewObject = event => s3Error => {
  if (s3Error.statusCode !== 404) {
    throw s3Error;
  }
  return newData(event);
};

module.exports = (bucket, date, s3Config={}) => (event, context, callback) => {
  const s3 = new AWS.S3(s3Config);
  const key = objectKey(date);
  return s3.getObject({ Bucket: bucket, Key: key }).promise()
    .then(
      appendEventToExistingObject(event),
      createNewObject(event)
    )
    .then((newObjectContents) => {
      return s3.putObject({
        Bucket: bucket,
        Key: key,
        ACL: 'private',
        Body: newObjectContents
      }).promise();
    })
    .then(() => callback(null, 'ok'))
    .catch(callback);
};
