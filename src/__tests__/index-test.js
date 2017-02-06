'use strict';
const AWS = require('aws-sdk');

const handler = require('../');

describe('handler', () => {
  let sandbox;
  let callback;
  let s3;
  const date = {
    getUTCFullYear: () => 2017,
    getUTCMonth: () => 1,
    getUTCDate: () => 15,
    getUTCHours: () => 2,
  };
  const event = {
    Records: [
      { eventSource: 'aws:kinesis', kinesis: {sequenceNumber: '3', data: 'string data'} },
      { eventSource: 'aws:kinesis', kinesis: {sequenceNumber: '4', data: new Buffer('buffer data')} },
    ],
  };

  const awsResult = result => ({ promise: () => Promise.resolve(result) });
  const awsError = error => ({ promise: () => Promise.reject(error) });

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    callback = sandbox.spy();
    s3 = { getObject: sinon.stub(), putObject: sinon.stub().returns(awsResult()) };
    sandbox.stub(AWS, 'S3').returns(s3);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('fails if s3 returns a non-404 error when looking up the object', () => {
    s3.getObject.withArgs({ Bucket: 'rr-events', Key: '2017-01-15_02' }).returns(awsError({ statusCode: 500 }));

    return handler('rr-events', date)(event, null, callback).then(() => {
      expect(callback).to.have.been.calledWith({ statusCode: 500 });
    });
  });

  it('creates a new object in the bucket if one does not exist for the current hour', () => {
    s3.getObject.withArgs({ Bucket: 'rr-events', Key: '2017-01-15_02' }).returns(awsError({ statusCode: 404 }));

    return handler('rr-events', date)(event, null, callback).then(() => {
      expect(s3.putObject).to.have.been.calledWith({
        Bucket: 'rr-events',
        Key: '2017-01-15_02',
        ACL: 'private',
        Body: '{"sequenceNumber":"3","data":"string data"}\n{"sequenceNumber":"4","data":"buffer data"}\n',
      });
      expect(callback).to.have.been.calledWith(null, 'ok');
    });
  });

  it('appends to the existing object in the bucket if there is already one for the current hour', () => {
    const existingContents = 'event1\nevent2\n';
    s3.getObject.withArgs({ Bucket: 'rr-events', Key: '2017-01-15_02' }).returns(awsResult({ Body: existingContents }));

    return handler('rr-events', date)(event, null, callback).then(() => {
      expect(s3.putObject).to.have.been.calledWith({
        Bucket: 'rr-events',
        Key: '2017-01-15_02',
        ACL: 'private',
        Body: 'event1\nevent2\n{"sequenceNumber":"3","data":"string data"}\n{"sequenceNumber":"4","data":"buffer data"}\n',
      });
      expect(callback).to.have.been.calledWith(null, 'ok');
    });
  });
});
