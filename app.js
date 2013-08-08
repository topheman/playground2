
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./app/routes')
  , user = require('./app/routes/user')
  , http = require('http')
  , path = require('path');

var port = process.env.PORT || 3000;
var app = express();

// all environments
app.configure(function(){
    app.set('port', port);
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
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

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
var io = require('socket.io').listen(server);

require('./app/logic/playground.io').init(io);