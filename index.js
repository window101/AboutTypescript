"use strict";
exports.__esModule = true;
var express = require("express");
var app = express();
var prod = process.env.NODE_ENV === 'production';
app.set('port', prod ? process.env.PORT : 3065);
app.get('/', function (req, res, next) {
    res.send('nodebird 정상동작');
});
app.listen(app.get('port'), function () {
    console.log("server is running on" + app.get('port'));
});
