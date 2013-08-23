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
        var i;
        console.log('>disconnecting mobile');
        //before, check if the socket is still active to prevent loops the client.disconnect() callback and calling this method directly if a duplicate socket on the same session is spotted
        if(mobileSockets[sessionId] && mobiles[socketId]){
            //alert the desktops to remove the mobile - passing the socket id
            io.of('/desktop').emit('desktop-remove-mobile', {id: socketId});
            //flush the references to this connexion in mobiles
            console.log('>>flushing mobiles with socketId '+socketId);
            delete mobiles[socketId];
            console.log('<<flushing mobiles with socketId');
            //flush the references to this connexion in mobilesSockets
            console.log('>>flushing mobileSockets with socketId '+socketId);
            for(i = 0;i < mobileSockets[sessionId].length; i++){
                if(mobileSockets[sessionId][i].id === socketId){
                    mobileSockets[sessionId].splice(i,1);
                    console.log('>>>flushed mobileSockets[sessionId] with '+socketId);
                    break;
                }
            }
            if(mobileSockets[sessionId].length === 0){
                delete mobileSockets[sessionId];
                    console.log('>>>mobileSockets[sessionId] empty > deleted');
            }
            console.log('<<flushing mobileSockets with socketId '+socketId);
        }
        console.log('<disconnecting mobile');
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
        console.log('>mobile connect');
        //check if a mobile already has a session opened, to close its socket
        if(mobileSockets[socket.handshake.sessionID]){
            console.log('>>MOBILE ALREADY CONNECTED on this sessionId '+socket.handshake.sessionID, 'disconnecting all other sockets connected to this session');
            //disconnect all the other sockets of this sessionId
            loopThroughMobileSocketsBySessionId(socket.handshake.sessionID, function(mobileSocket,sessionId, socketId){
                if(sessionId === socket.handshake.sessionID && socketId !== socket.id){
                    console.log('>>emiting a force-disconnect to socket.id : ',socketId);
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
        console.log('>>mobile-connected with socket.id : ', socket.id);
        //alert the desktops to add the mobile with this color and position
        var infos = common.getRandomPositionAndSpeedInBounds();
        infos.id = socket.id;
        infos.color = color;
        io.of('/desktop').emit('desktop-add-mobile', infos);
        console.log('<mobile connect');
        
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
            console.log('>mobile client - .disconnect()');
            disconnectMobile(socket.handshake.sessionID, socket.id);
            console.log('<mobile client - .disconnect()');
        });
        
    });
    
    io.of('/desktop').on('connection',function(socket){
        console.log('>desktop connect');
        desktops[socket.id] = {
            name : "Anonymous"
        };
        console.info('>>desktop connected');
        //alert all desktop connected (in order to force mobiles to reconnect) + update the chat users list
        io.of('/desktop').emit('desktop-connected', desktops);
        io.of('/mobile').emit('desktop-connected', {});
        console.log('<desktop connect');
    
        socket.on('disconnect',function(data){
            console.log('>desktop client - .disconnect()');
            if (desktops[socket.id] !== null) {
                delete desktops[socket.id];
                console.log('remove desktop with socketId : ', socket.id);
                socket.broadcast.emit('desktop-disconnected', desktops);
            }
            console.log('<desktop client - .disconnect()');
        });
        
        /** chat part */
        socket.on('desktop-update-name', function(data){
            var previousName = desktops[socket.id].name;
            console.log('>desktop update name from ',previousName, ' to ',data.name);
            desktops[socket.id].name = data.name;
            io.of('/desktop').emit('desktop-update-chat-users', {
                desktops : desktops,
                message : "<b>"+previousName + '</b> renamed to <b>' + data.name+"<b>"
            });
        });
        socket.on('desktop-post-message', function(data){
            console.log('>desktop ',desktops[socket.id].name, ' posted : ',data.message);
            io.of('/desktop').emit('desktop-add-message', {
                message : "<b>"+desktops[socket.id].name+"</b> "+data.message
            });
        });
    
    });

};