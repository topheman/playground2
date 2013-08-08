exports.init = function(io) {
    
    var mobiles = {},
        desktops = {},
        requirejs = require('requirejs'),
        common
    ;
    
    requirejs.config({nodeRequire: require});
    common = requirejs('./app/public/src/js/custom/common.js');

    io.sockets.on('connection', function(socket) {
        //first, ask which client it is (mobile or desktop)
        socket.emit('who-is-there', {});

        //mobile side
        socket.on('mobile-connect', function(data) {
            mobiles[socket.id] = {};
            var color = common.getRandomColor();
            socket.emit('mobile-connected', {color: color});
            console.log('mobile-connected', mobiles[socket.id]);
            var infos = common.getRandomPositionAndSpeedInBounds();
            infos.id = socket.id;
            infos.color = color;
            socket.broadcast.emit('desktop-add-mobile', infos);
        });
        socket.on('mobile-infos', function(data) {
            if(!mobiles[socket.id]){
                return;
            }
            mobiles[socket.id].inputX = data.inputX;
            mobiles[socket.id].inputY = data.inputY;
            //dispatch coordinates to desktops
            socket.broadcast.emit('desktop-update-motion-infos', mobiles);
        });

        //desktop side
        socket.on('desktop-connect', function(data) {
            desktops[socket.id] = {
                timeStamp : Date.now()
            };
            console.info('desktop connected');
            socket.emit('desktop-connected', {});
        });

        //disconnect devices
        socket.on('disconnect', function(data) {
            if (mobiles[socket.id] !== null) {
                socket.broadcast.emit('desktop-remove-mobile', {id: socket.id});
                delete mobiles[socket.id];
                console.log('remove mobile', socket.id);
            }
            else if (desktops[socket.id] !== null) {
                delete desktops[socket.id];
                console.log('remove desktop', socket.id);
            }
        });
    });

};