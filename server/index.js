// index.js
//Require
var express = require("express");
var logfmt = require("logfmt");
var app = express(),
	builder = require('xmlbuilder'),
	fs = require('fs');

//Inputs
var butStatus;
var keyStatus;
var potStatus;


app.use(logfmt.requestLogger());

//adds CORS support to server
app.all('*', function(request, response, next) {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });


app.configure( function() {
  app.use('/js', express.static(__dirname + '/js'));
});

app.configure( function() {
  app.use('/data', express.static(__dirname + '/data'));
});

app.configure( function() {
  app.use('/css', express.static(__dirname + '/css'));
  console.log("Express configured. Listening on port 5000");
});


// respond to web GET requests with the index.html page.
// this is how you serve a file that's not in a static directory:
app.get('/', function (request, response) {
   response.sendfile('index.html');
});

// function for serving index.html, or index. anything:
app.get('/index*', function (request, response) {
   response.sendfile('index.html');
});

app.get('/data*', function (request, response) {
	response.sendfile('inputs.xml');
	//response.send("Works");
});


// REST - Inputs

app.get('/button/:button', function (request, response) {
	butStatus = request.params.button;
	response.send(butStatus);
});

app.get('/butStatus*', function (request, response) {
	response.send(butStatus);
});

app.get('/key/:key', function (request, response) {
	keyStatus = request.params.key;
	response.send(keyStatus);
});

app.get('/keyStatus*', function (request, response) {
	response.send(keyStatus);
});

app.get('/pot/:pot', function (request, response) {
	potStatus = request.params.pot;
	response.send(potStatus);
});

app.get('/potStatus*', function (request, response) {
	response.send(potStatus);
});

//------------------------------------------------------------------------------------

app.get('/ip*', function (request, response) {
	var myIP = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	//response.sendfile('data.xml');
	response.send(myIP);
});

app.get('/logdata/text/:text/times/:times/lat/:lat/long/:long/position/:position', function(request,response) {
	var clientText  = request.params.text;

	var clientTime  = request.params.times;
	var clientLat  = request.params.lat;
	var clientLong  = request.params.long;

	var clientLong  = request.params.long;
	var clientLong  = request.params.long;

	var myIP = request.headers['x-forwarded-for'] || request.connection.remoteAddress;

	var deviceStatus = request.params.device;

	var xml = builder.create('connection', {version: '1.0', encoding: 'UTF-8', standalone: true});
		xml.ele('text', clientText);

		xml.ele('ip', myIP);
		xml.ele('time', clientTime);
		xml.ele('lat', clientLat);
		xml.ele('lon', clientLong);

		xml.ele('key', keyStatus);
		xml.ele('button', butStatus);
		xml.ele('speed', potStatus);
		xml.ele('position', deviceStatus);

	var xmlString = xml.end({ pretty: true, indent: '  ', newline: '\n' });

	var outputFilename = './inputs.xml';

	fs.writeFile(outputFilename, xmlString, function(err) {
    	if(err) {
      		console.log(err);
      		//response.send(err); //prints error in front end console
    	} else {
      		console.log("XML saved to " + outputFilename);
      		//response.send(data); //prints data in front end console
    	}
	});
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
