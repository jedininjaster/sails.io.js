/**
 * Module dependencies
 */

var util = require('util');
var assert = require('assert');
var lifecycle = require('./helpers/lifecycle');
var _setupRoutes = require('./helpers/setupRoutes');
var _assertResponse = function ( expectedResponses ) {
  return function (routeAddress, callbackArgs) {
    var body = callbackArgs[0];
    var jwr = callbackArgs[1];

    // Ensure JWR is valid
    assert.equal(typeof jwr, 'object');

    // Ensure body's type is correct
    assert.equal((typeof body),(typeof expectedResponses[routeAddress].body), util.format('Expecting type:%s:\n%s\n\nbut got type:%s:\n%s\n', (typeof expectedResponses[routeAddress].body), util.inspect(expectedResponses[routeAddress].body, false, null), (typeof body),util.inspect(body,false,null)));

    // Ensure body is the correct value
    assert.deepEqual(expectedResponses[routeAddress].body, body);

    // Ensure jwr's statusCode is correct
    assert.deepEqual(expectedResponses[routeAddress].statusCode || 200, jwr.statusCode);
  };
};

var EXPECTED_RESPONSES = {
  'get /hello': { body: 'ok!' },
  'get /someJSON': {
    body: { foo: 'bar' }
  },
  'get /someError': {
    body: { blah: 'blah' },
    statusCode: 501
  },
  'get /headers': {
    'req.headers.x-test-header-one': 'foo',
    'req.headers.x-test-header-two': 'bar',
  },
  'get /headersOverride': {
    'req.headers.x-test-header-one': 'baz',
    'req.headers.x-test-header-two': 'bar',
  },
  'get /headersRemove': {
    'req.headers.x-test-header-two': 'bar',
  }


};
var setupRoutes = _setupRoutes(EXPECTED_RESPONSES);
var assertResponse = _assertResponse(EXPECTED_RESPONSES);


describe('io.socket', function () {

  describe('With default settings', function() {
    before(lifecycle.setup);
    before(setupRoutes);

    it('should connect automatically', function (cb) {
      io.socket.on('connect', cb);
    });

    describe('once connected, socket', function () {

      it('should be able to send a GET request and receive the expected response', function (cb) {
        io.socket.get('/hello', function (body, jwr) {
          assertResponse('get /hello', arguments);
          return cb();
        });
      });

      it('should receive JSON as a POJO, not a string', function (cb) {
        io.socket.get('/someJSON', function (body, jwr) {
          assertResponse('get /someJSON', arguments);
          return cb();
        });
      });

      it('should receive a valid jwr response object as its second argument, with the correct error code', function (cb) {
        io.socket.get('/someError', function (body, jwr) {
          assertResponse('get /someError', arguments);
          return cb();
        });
      });
      
    });


    after(lifecycle.teardown);
    
  });

  describe('Using headers option', function() {
    before(function(done) {
      lifecycle.setup({
        headers: {
          'x-test-header-one': 'foo',
          'x-test-header-two': 'bar',
        }
      }, done);
    });
    before(setupRoutes);

    it('should connect automatically', function (cb) {
      io.socket.on('connect', cb);
    });

    describe('once connected, socket', function () {

      it('should be able to send a GET request and receive the expected response, including custom headers', function (cb) {
        io.socket.get('/headers', function (body, jwr) {
          assertResponse('get /headers', arguments);
          return cb();
        });
      });

      it('should be able to override the global headers on a per-request basis', function (cb) {
        io.socket.request({method: 'get', url: '/headersOverride', headers: {'x-test-header-one': 'baz'}}, function (body, jwr) {
          assertResponse('get /headersOverride', arguments);
          return cb();
        });
      });
      
      it('should be able to remove the global headers on a per-request basis', function (cb) {
        io.socket.request({method: 'get', url: '/headersRemove', headers: {'x-test-header-one': undefined}}, function (body, jwr) {
          assertResponse('get /headersRemove', arguments);
          return cb();
        });
      });
      
    });


    after(lifecycle.teardown);
    
  });

});
