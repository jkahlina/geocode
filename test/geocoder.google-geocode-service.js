var assert = require("assert")
  , GoogleGeocodeService = require("../controllers/geocoder").GoogleGeocodeService;

var fixture = {
  fakeApiKey: "incorrect",
  fakeAddress: "1 2 3",
  validGeocodeData: {
    results: [{
      geometry: {
        location_type: 'ROOFTOP',
        location: {
          lat: 13,
          lng: 37
        }
      },
      formatted_address: "1337 Place Town Rd."
    }]
  },
  validJsonResponse: {
    address: "1337 Place Town Rd.",
    geocode: {
      lat: 13,
      lng: 37
    }
  },
  partialMatchGeocodeData: {
    results: [{
      geometry: {
        location_type: 'ROOFTOP',
        location: {
          lat: 13,
          lng: 37
        }
      },
      formatted_address: "1337 Place Town Rd.",
      partial_match: true
    }]
  },
  nonRooftopGeocodeData: {
    results: [{
      geometry: {
        location_type: 'APPROXIMATE',
        location: {
          lat: 13,
          lng: 37
        }
      },
      formatted_address: "1337 Place Town Rd."
    }]
  }
};

describe('geocoder.GoogleGeocodeService', function() {
  describe('.get', function() {
    it('should rate limit to 10 requests per second', function(done) {
      var now = new Date().getTime();
      for(var i=0; i<10; i++) {
        GoogleGeocodeService.get(fixture.fakeApiKey, fixture.fakeAddress);
      }
      // this one should be rate limited
      GoogleGeocodeService.get(fixture.fakeApiKey, fixture.fakeAddress, function() {
        var finished = new Date().getTime();
        var diff = finished-now;
        assert(diff>1000, "11th request happened too soon: "+diff);
        done();
      });
    });
  });

  describe('.validateGeocode', function() {
    it('should return proper json with a valid result', function(done) {
      GoogleGeocodeService.validateGeocode(fixture.validGeocodeData, function(item){
        assert.deepEqual(item, fixture.validJsonResponse, "json response did not match");
        done();
      });
    });

    it('should not return anything with null', function(done) {
      GoogleGeocodeService.validateGeocode(null, function(){
        assert.fail();
        done();
      });
      setTimeout(done, 500);
    });

    it('should not return anything with an invalid result', function(done) {
      GoogleGeocodeService.validateGeocode({}, function(){
        assert.fail();
        done();
      });
      setTimeout(done, 500);
    });

    it('should not return anything with multiple results', function(done) {
      GoogleGeocodeService.validateGeocode({
        results: [
          fixture.validGeocodeData.results[0],
          fixture.validGeocodeData.results[0]
        ]
      }, function(){
        assert.fail();
        done();
      });
      setTimeout(done, 500);
    });

    it('should not return anything with a partial_match result', function(done) {
      GoogleGeocodeService.validateGeocode(fixture.partialMatchGeocodeData, function(){
        assert.fail();
        done();
      });
      setTimeout(done, 500);
    });

    it('should not return anything with non-ROOFTOP quality result', function(done) {
      GoogleGeocodeService.validateGeocode(fixture.nonRooftopGeocodeData, function(){
        assert.fail();
        done();
      });
      setTimeout(done, 500);
    });
  });
});