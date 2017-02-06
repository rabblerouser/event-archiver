'use strict';

const handler = require('./src');

const bucketName = process.env.BUCKET_NAME || 'cam-rr-event-archive-tmp';
exports.handler = handler(bucketName, new Date());
