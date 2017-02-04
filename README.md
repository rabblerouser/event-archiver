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
