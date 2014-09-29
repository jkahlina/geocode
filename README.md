# Geocoder Node.js

Geocoder is a Node.js server that accepts a 'csv' file of addresses and uses the Google Geocoding API to geocode them.

## Setup

#### Node Version

`v0.10.32`

#### Install and Run

```
$ npm install
$ npm start
```

#### Run Unit Tests

```
$ npm install -g mocha
$ npm test
```

## Filters

The addresses will be filtered on the following criteria:

1. Single non-partial result for address
2. Geocode is of "ROOFTOP" quality

## More TODO

1. Test inputs of all constructors and functions
2. More unit tests!
3. ...