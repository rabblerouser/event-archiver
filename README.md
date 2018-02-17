# Rabble Rouser Event Archiver

[![Build Status](https://travis-ci.org/rabblerouser/event-archiver.svg?branch=master)](https://travis-ci.org/rabblerouser/event-archiver)

An AWS lambda function that persists all events from a kinesis stream to an S3 bucket

## Background.
Kinesis can only keep events for up to 7 days (24 hours by default). This lambda function pipes everything to a bucket
so that we have a permanent record of all events.

## Install and run the tests
```sh
yarn
yarn test
```

## Run it locally
You can either run it natively:

```sh
KINESIS_ENDPOINT'http://localhost:4567' STREAM_NAME='rabblerouser_stream' yarn start
```

Or you can build the docker image like this...
```sh
docker build -t rabblerouser/event-archiver .
```

... and then run it with docker-compose. E.g. see [core](https://github.com/rabblerouser/core).

## Deployment
There is a build pipeline for this project, it publishes the zipped code to an s3 bucket.

Actual deployment of this lambda function requires a few moving parts, such as IAM roles, a kinesis stream to subscribe
to, and a bucket where events should be forwarded to.

With that in mind, the easiest way to deploy this right now is as part of a whole Rabble Rouser stack. See
[infra](https://github.com/rabblerouser/infra) for how to do that.

## Manual testing with fakeS3

During local development with fakeS3, it can be useful to manually check that this lambda uploaded the correct data to
S3. If fakeS3 is running inside a Docker container, first make sure its port is exposed (either by changing the docker
run command, or the docker-compose file). Then you can point the S3 CLI at it with commands like this:

```sh
AWS_ACCESS_KEY_ID=fake AWS_SECRET_ACCESS_KEY=fake aws --endpoint-url='http://localhost:4569' s3api list-buckets
```

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
