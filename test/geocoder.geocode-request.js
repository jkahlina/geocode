var assert = require("assert")
  , GeocodeRequest = require("../controllers/geocoder").GeocodeRequest;

var fixture = {
  validReq: {
    body: {
      google_key: "1 2 3"
    },
    files: {
      addresses: {
        extension: "csv",
        path: "tmp"
      }
    }
  }
};

describe('geocoder.GeocodeRequest', function() {
  describe('constructor', function() {
    it('should initialize api key and file path with a valid request', function() {
      var request = new GeocodeRequest(fixture.validReq, {}, {});
      assert.deepEqual(request.apiKey, "1 2 3", "api key does not match");
      assert.deepEqual(request.filePath, "tmp", "file path does not match");
    });

    it('should not initialize api key and file path with an invalid request', function() {
      var request = new GeocodeRequest({}, {}, {});
      assert.deepEqual(request.apiKey, undefined, "api key does not match");
      assert.deepEqual(request.filePath, undefined, "file path does not match");
    });
  });

  describe('.process', function() {
    it('should respond with bad request with an invalid request', function(done) {
      var request = new GeocodeRequest({}, {
        writeHeader: function(status) {
          assert.deepEqual(status, 400, "status code is not bad request");
        },
        end: function(content) {
          assert(content, "there is no error message");
          done();
        }
      }, {});
      request.process();
    });
  });

  // TODO: test the private functions
});