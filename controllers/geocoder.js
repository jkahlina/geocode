var lineReader = require('line-reader')
  , limiter = require('simple-rate-limiter')
  , requester = require('request');

var geocoder = exports;

// constants
var FORM_FILE_NAME = "addresses"
  , FORM_KEY_NAME = "google_key"
  , FILE_EXTENSION = 'csv';

/**
 * GeocodeRequest
 * Manages request and response as a GeocodeRequest with the given service,
 * pulling relevant information from the request.
 * Call 'process' on this object to begin.
 * @param req
 * @param res
 * @param service
 * @constructor
 */
geocoder.GeocodeRequest = function(req, res, service) {
  this.res = res;
  this.service = service;

  this.apiKey = this._getApiKey(req);
  this.filePath = this._getFilePath(req);

  this.geocodedAddresses = [];

  this._fileParseComplete = false;
  this._fileLineCount = 0;
  this._processedAddressCount = 0;

  this._responded = false;
};

/**
 * Process the geocode request.
 */
geocoder.GeocodeRequest.prototype.process = function() {
  if(this.apiKey && this.filePath) {
    this._processFile(this.filePath);
  } else {
    this._respondBadRequest("Ensure all form information is correctly provided.");
  }
};

geocoder.GeocodeRequest.prototype._getApiKey = function(form) {
  if(form.hasOwnProperty("body")
    && form.body.hasOwnProperty(FORM_KEY_NAME)) {
    return form.body[FORM_KEY_NAME];
  }
};

geocoder.GeocodeRequest.prototype._getFilePath = function(form) {
  if(form.hasOwnProperty("files")
    && form.files.hasOwnProperty(FORM_FILE_NAME)) {

    var file = form.files[FORM_FILE_NAME];
    if(file.extension == FILE_EXTENSION
      && file.hasOwnProperty("path")) {
      return file.path;
    }
  }
};

geocoder.GeocodeRequest.prototype._processFile = function(filePath) {
  var self = this;
  lineReader.eachLine(filePath, function(line, last){

    // TODO: sanitize each line
    var address = line.toString();

    self._fileLineCount++;
    if(last) {
      self._fileParseComplete = true;
    }

    self.service.get(self.apiKey, address, self._handleServiceResponse.bind(self));
  });
};

geocoder.GeocodeRequest.prototype._handleServiceResponse = function(error, response, body) {
  this._processedAddressCount++;

  if(error) {
    console.log(error);
  } else {
    switch(body.status) {
      case "OK":
        var self = this;
        this.service.validateGeocode(body, function(item) {
          self.geocodedAddresses.push(item);
        });
        break;
      case "REQUEST_DENIED":
        this._respondBadRequest("Unable to process geocode request. Ensure that the API key is correct.");
        break;
      case "OVER_QUERY_LIMIT":
      case "UNKNOWN_ERROR":
        this._respondServerError("Unable to send geocode request. Please try again later.");
        break;
      default:
        break;
    }
  }

  if(this._fileParseComplete
    && this._processedAddressCount == this._fileLineCount) {
    console.log("Acceptable geocodes: " + this.geocodedAddresses.length);
    this._respondSuccess({
      addresses: this.geocodedAddresses
    });
  }
};

geocoder.GeocodeRequest.prototype._respondSuccess = function(body) {
  this._respond(200, body);
};

geocoder.GeocodeRequest.prototype._respondBadRequest = function(error) {
  this._respond(400, { error: error });
};

geocoder.GeocodeRequest.prototype._respondServerError = function(error) {
  this._respond(500, { error: error });
};

geocoder.GeocodeRequest.prototype._respond = function(status, body) {
  if(!this._responded) {
    this._responded = true;
    var content = JSON.stringify(body);
    this.res.writeHeader(status, {
      'Content-Type': 'application/json',
      'Content-Length': content.length
    });
    this.res.end(content);
  }
};



var RESPONSE_ITEM_ADDRESS = "address"
  , RESPONSE_ITEM_GEOCODE = "geocode";

/**
 * GoogleGeocodeService
 * Static class that manages queries to the google maps service.
 * @constructor
 */
geocoder.GoogleGeocodeService = function() {};

geocoder.GoogleGeocodeService.service = "https://maps.googleapis.com/maps/api/geocode/json";
geocoder.GoogleGeocodeService.rateLimitedGet = limiter(requester.get).to(10).per(1000);

/**
 * GETs a geocode for a single address using the api key.
 * @param key google api key
 * @param address
 * @param cb
 */
geocoder.GoogleGeocodeService.get = function(key, address, cb) {
  var uri = this.service
    + "?key=" + key
    + "&address=" + address;

  this.rateLimitedGet({
    uri: uri,
    json: true
  }, cb);
};

/**
 * Validates response data of a geocode.
 * If geocode is satisfactory, the callback is called with relevant
 * geocode information.
 * @param geocode
 * @param cb
 */
geocoder.GoogleGeocodeService.validateGeocode = function(geocode, cb) {
  // 1. single result
  if(geocode
    && geocode.hasOwnProperty("results") && geocode.results.length == 1) {
    var result = geocode.results[0];

    // 2. must be non-partial
    if(!result.hasOwnProperty("partial_match") || !result.partial_match) {
      var geometry = result.geometry;

      // 3. 'ROOFTOP' quality
      if(geometry
        && geometry.hasOwnProperty("location_type")
        && geometry.location_type === "ROOFTOP"
        && geometry.hasOwnProperty("location")
        && geometry.location.hasOwnProperty("lat")
        && geometry.location.hasOwnProperty("lng")) {

        var item = {};
        item[RESPONSE_ITEM_ADDRESS] = result.formatted_address;
        item[RESPONSE_ITEM_GEOCODE] = {
          lat: geometry.location.lat,
          lng: geometry.location.lng
        };
        cb(item);
      }
    }
  }
};
