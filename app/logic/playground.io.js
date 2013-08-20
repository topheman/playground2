exports.init = function(io) {
    
    var mobiles = {},
        desktops = {},
        requirejs = require('requirejs'),
        common
    ;
    
    requirejs.config({nodeRequire: require});
    common = requirejs('./app/public/src/js/custom/common.js');
    
    io.set('authorization', function (handshakeData, accept) {
        console.log( (handshakeData && handshakeData.headers) ? handshakeData.headers.cookie : null);
        accept(null, true);
    });

    io.of('/mobile').on('connection',function(socket){
        //subscribe the mobile
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
            if (mobiles[socket.id] !== null) {
                //alert the desktops to remove the mobile
                io.of('/desktop').emit('desktop-remove-mobile', {id: socket.id});
                delete mobiles[socket.id];
                console.log('remove mobile', socket.id);
            }
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