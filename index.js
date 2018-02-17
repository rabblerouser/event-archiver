'use strict';

const handler = require('./src');

const bucketName = process.env.ARCHIVE_BUCKET;
const s3Endpoint = process.env.S3_ENDPOINT;
const s3Config = s3Endpoint ?
  { endpoint: s3Endpoint, accessKeyId: 'FAKE', secretAccessKey: 'ALSO FAKE' } :
  {};

exports.handler = handler(bucketName, new Date(), s3Config, console);
