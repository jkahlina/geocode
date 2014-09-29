var express = require('express')
  , multer = require('multer')
  , geocoder = require('./controllers/geocoder');

var app = express();

app.use(express.static(__dirname + "/public"));
app.use(multer());

app.get('/', function(req, res){
  res.render("index.html");
});

app.post('/addresses', function(req, res){
  var request = new geocoder.GeocodeRequest(req, res, geocoder.GoogleGeocodeService);
  request.process();
});

app.listen(8080);
