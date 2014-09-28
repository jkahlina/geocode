var geocoder = exports;

var FORM_FILE_NAME = "addresses"
  , FORM_KEY_NAME = "google_key"
  , FILE_EXTENSION = 'csv';

geocoder.GeocodeRequest = function(req, res) {
  this.req = req;
  this.res = res;

  this._processRequest(req);
  this._processFile(file);
};

geocoder.GeocodeRequest.prototype._processRequest = function(req, res) {
  if(req.hasOwnProperty("files")
    && req.files.hasOwnProperty(FORM_FILE_NAME)) {

  }
  if(req.hasOwnProperty("body")
    && req.body.hasOwnProperty(FORM_KEY_NAME)) {

  }
};

geocoder.GeocodeRequest.prototype._processFile = function(file) {
  if(file.extension == FILE_EXTENSION) {

  }
};