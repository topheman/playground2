exports.init = function(io) {
    
    var mobiles = {},
        desktops = {},
        mobileSockets = {},
        disconnectedMobileSocketIds = [],
        requirejs = require('requirejs'),
        cookie = require('cookie'),
        common
    ;
    
    requirejs.config({nodeRequire: require});
    common = requirejs('./app/public/src/js/custom/common.js');
    
    var connectMobile = function(){
        
    };
    
    var connectDesktop = function(){
        
    };
    
    var disconnectMobile = function(sessionId, socketId){
        socketId = socketId || mobileSockets[sessionId].id;
        //must loop through all open sockets in one sessionId - push sockets into mobileSockets[sessionId]
        if(mobileSockets[sessionId] && mobiles[socketId]){
//            var socketId = mobileSockets[sessionId].id;
            //alert the desktops to remove the mobile - passing the socket id
            io.of('/desktop').emit('desktop-remove-mobile', {id: mobileSockets[sessionId].id});
            //flush the references to this connexion
            delete mobiles[socketId];
            delete mobileSockets[sessionId];
            console.log('removed mobile socket.id : ', socketId, 'sessionId : ',sessionId);
            disconnectedMobileSocketIds.push(socketId);
        }
    };
    
    var disconnectDesktop = function(){
        
    };
    
    io.set('authorization', function (data, accept) {
        // check if there's a cookie header
        if (data.headers.cookie) {
            // if there is, parse the cookie
            data.cookie = cookie.parse(data.headers.cookie);
            data.sessionID = data.cookie['express.sid'];
            console.info(data.sessionID);
        } else {
           // if there isn't, turn down the connection with a message and leave the function.
           return accept('No cookie transmitted.', false);
        }
        // accept the incoming connection
        accept(null, true);
    });

    io.of('/mobile').on('connection',function(socket){
        //check if a mobile already has a session opened, to close its socket
        if(mobileSockets[socket.handshake.sessionID]){
            console.log('Mobile already connected on this sessionId '+socket.handshake.sessionID);
            //tell the mobile client to disconnect
            mobileSockets[socket.handshake.sessionID].emit('force-disconnect',{});
            //flush the references to this mobile socket
            disconnectMobile(socket.handshake.sessionID);
        }
        //subscribe the mobile
        mobileSockets[socket.handshake.sessionID] = socket;
        mobiles[socket.id] = {};
        var color = common.getRandomColor();
        //alert the mobile it's connected with its color
        socket.emit('mobile-connected', {color: color});
        console.log('mobile-connected', mobiles[socket.id]);
        //alert the desktops to add the mobile with this color and position
        var infos = common.getRandomPositionAndSpeedInBounds();
        infos.id = socket.id;
        infos.color = color;
        io.of('/desktop').emit('desktop-add-mobile', infos);
        
        socket.on('mobile-infos', function(data) {
            if(!mobiles[socket.id]){
                return;
            }
            mobiles[socket.id].inputX = data.inputX;
            mobiles[socket.id].inputY = data.inputY;
            //dispatch coordinates to desktops
            io.of('/desktop').emit('desktop-update-motion-infos', mobiles);
        });
        
    
        socket.on('disconnect',function(data){
            console.log('mobile trying to disconnect');
            disconnectMobile(socket.handshake.sessionID, socket.id);
        });
        
    });
    
    io.of('/desktop').on('connection',function(socket){
        desktops[socket.id] = {
            timeStamp : Date.now()
        };
        console.info('desktop connected');
        //alert all another desktop connected (in order to force mobiles to reconnect)
        socket.broadcast.emit('desktop-connected', {});
        io.of('/mobile').emit('desktop-connected', {});
    
        socket.on('disconnect',function(data){
            console.log('desktop trying to disconnect');
            if (desktops[socket.id] !== null) {
                delete desktops[socket.id];
                console.log('remove desktop', socket.id);
            }
        });
    
    });

};