var express = require('express')
  , multer = require('multer')
  , lineReader = require('line-reader')
  , limiter = require('simple-rate-limiter');

var httpsGet = limiter(require('request').get).to(10).per(1000);

var app = express();

app.use(express.static(__dirname + "/public"));
app.use(multer());

app.get('/', function(req, res){
  res.render("index.html");
});

app.post('/addresses', function(req, res){
//    console.log(req.files);

  var file = req.files.addresses;
  if(req.files.addresses) {
    if(file.extension == 'csv') {

      var countFinalized = false;
      var count = 0;
      var processed = 0;

      var responseData = [];

//        var lazy = new Lazy(fs.createReadStream(file.path));
//        lazy.lines.forEach(function(line) {
      lineReader.eachLine(file.path, function(line, last){

        var uri = "https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyBdgiVBVKpRJNSbyieMy3GTG3g_CU6OoYk&address=";
        // TODO: could do further sanitizing of each line to make sure it conforms
        uri += line.toString();

        count++;
        if(last) {
          countFinalized = true;
        }

        httpsGet({
          uri: uri,
          json: true
        }, function(error, response, body) {

          console.log("Processed: " + ++processed);

          if(error) {
            console.log(error);
          }

//            console.log(body);
//            console.log(body.results);

          if(body.hasOwnProperty("results") && body.results.length == 1) {
            var result = body.results[0];

            if(!result.hasOwnProperty("partial_match") || !result.partial_match) {

              var geometry = result.geometry;

              if(geometry &&
                geometry.hasOwnProperty("location_type") &&
                geometry.location_type === "ROOFTOP") {

                // TODO: verify these properties; handle constants for variable structure
                responseData.push({
                  address: result.formatted_address,
                  geocode: {
                    lat: geometry.location.lat,
                    lng: geometry.location.lng
                  }
                });
              }
            }
          }
//            console.log(body);
//            console.log("Processed: " + processed++);

          if(countFinalized && processed == count) {
            console.log("Acceptable geocodes: " + responseData.length);
            // TODO: add more res headers
            res.end(JSON.stringify(responseData));
          }
        });

//            https.get(request, function (res) {
//              res.on('data', function(data) {
//                console.log(data.toString());
//              });
//            }).on('error', function(e) {
//              console.error(e);
//            });

      });
//        res.end();
    }
  }
});

app.listen(8080);
