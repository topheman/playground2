/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , path = require('path');

var port = process.env.PORT || 3000;
var app = express();

// all environments
app.configure(function(){
    app.set('port', port);
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon( __dirname + '/app/public/src/favicon.ico'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname,'app','public','src')));
});

// development only
app.configure('development', function(){
  app.use(express.errorHandler());
});

//declare routes
fs.readdir('./app/routes', function(err, files){
    files.forEach(function(fn) {
        if(!/\.js$/.test(fn)) return;
        console.log(fn);
        require('./app/routes/' + fn)(app);
    });
});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
var io = require('socket.io').listen(server, {log: false});

require('./app/logic/playground.io').init(io);