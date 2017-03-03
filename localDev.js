const run = require('@rabblerouser/local-kinesis-lambda-runner');
const lambda = require('./index').handler;

run(lambda);
