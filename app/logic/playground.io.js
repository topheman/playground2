exports.init = function(io) {
    
    var mobiles = {},//mobiles infos by socketId
        desktops = {},//desktop infos by socketId
        mobileSockets = {},//saving the sockets of the mobile by sessionId
        requirejs = require('requirejs'),
        cookie = require('cookie'),
        common
    ;
    
    requirejs.config({nodeRequire: require});
    common = requirejs('./app/public/src/js/custom/common.js');
    
    /**
     * If the socket is still active :
     * - will send to the desktops to remove this mobile
     * - will remove this reference from mobiles
     * @param {String} sessionId
     * @param {String} socketId
     */
    var disconnectMobile = function(sessionId, socketId){
        //before, check if the socket is still active to prevent loops the client.disconnect() callback and calling this method directly if a duplicate socket on the same session is spotted
        if(mobileSockets[sessionId] && mobiles[socketId]){
            //alert the desktops to remove the mobile - passing the socket id
            io.of('/desktop').emit('desktop-remove-mobile', {id: socketId});
            //flush the references to this connexion
            delete mobiles[socketId];
            console.log('removed mobile socket.id : ', socketId, 'sessionId : ',sessionId);
        }
    };
    
    /**
     * @param {String} sessionId
     * @param {Function} callback function(socket,sessionId, socketId){}
     */
    var loopThroughMobileSocketsBySessionId = function(sessionId, callback){
        var i;
        if(mobileSockets && mobileSockets[sessionId] && mobileSockets[sessionId].length > 0){
            for(i=0; i < mobileSockets[sessionId].length; i++){
                callback.call({},mobileSockets[sessionId][i],sessionId,mobileSockets[sessionId][i].id);
            }
        }
    };
    
    //using the authorization part of socket.io to retrieve the sessionId which will be available in socket.handshake.sessionID
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
            console.log('MOBILE ALREADY CONNECTED on this sessionId '+socket.handshake.sessionID, 'disconnecting all other sockets connected to this session');
            //disconnect all the other sockets of this sessionId
            loopThroughMobileSocketsBySessionId(socket.handshake.sessionID, function(mobileSocket,sessionId, socketId){
                if(sessionId === socket.handshake.sessionID && socketId !== socket.id){
                    console.log('emiting a force-disconnect to socket.id : ',socketId);
                    //tell the mobile client to disconnect
                    mobileSocket.emit('force-disconnect',{});
                    //flush the references to this mobile socket
                    disconnectMobile(socket.handshake.sessionID, socket.id);
                }
            });
        }
        //otherwise, create the entry in mobileSockets to receive all the sockets for this mobile session
        else {
            mobileSockets[socket.handshake.sessionID] = [];
        }
        //subscribe the mobile
        mobileSockets[socket.handshake.sessionID].push(socket);
        mobiles[socket.id] = {};
        var color = common.getRandomColor();
        //alert the mobile it's connected with its color
        socket.emit('mobile-connected', {color: color});
        console.log('mobile-connected with socket.id : ', socket.id);
        //alert the desktops to add the mobile with this color and position
        var infos = common.getRandomPositionAndSpeedInBounds();
        infos.id = socket.id;
        infos.color = color;
        io.of('/desktop').emit('desktop-add-mobile', infos);
        
        socket.on('mobile-infos', function(data) {
            //prevent lost connection still emitting to crash the server
            if(!mobiles[socket.id]){
                return;
            }
            //update the mobiles infos
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