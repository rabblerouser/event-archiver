'use strict';

const handler = require('../');

describe('handler', () => {
  let callback;
  const event = {};

  beforeEach(() => {
    callback = sinon.spy();
  })

  it('succeeds', () => {
    handler(event, null, callback);

    expect(callback).to.have.been.calledWith(null, 'ok');
  });
});
