var express = require('express');
var path = require('path');


const API_PORT = 3000;

var app = express();

app.use('/public', express.static(path.join(__dirname, "../frontend/public")));

app.get('/', function (req, res) {
	res.sendFile('./index.html', { root: path.join(__dirname, "../frontend") });
});

app.listen(API_PORT, function () {
	console.log('App listening on port 3000!')
});
