define(['custom/common','utils/requestAnimFrame','vendor/Ball'],function(common,undefined,undefined){
    
    var desktop;
    
    var socket,
        balls = {},
        width,
        height,
        ctx,
        DEVICEMOTION_INPUT_RATIO = 0.2
    ;
    
    function init(){
        prepareCanvas();
        socketConnect();
        render();
    }
    
    function socketConnect(){
        socket = io.connect(window.location.protocol+'//'+window.location.host);
        socket.on('who-is-there',function(data){
            socket.emit('desktop-connect',{});
        });
        socket.on('desktop-connected',function(data){
            console.log('desktop connected (important ?)',data);
        });
        socket.on('desktop-add-mobile',function(data){
            console.log('desktop add mobile',data);
            addMobile(data);
        });
        socket.on('desktop-remove-mobile',function(data){
            console.log('desktop remove mobile',data);
            removeMobile(data);
        });
        socket.on('desktop-update-motion-infos',function(data){
//            console.log('desktop update',data);
            updateMotionInfos(data);
        });
    }
    
    /**
     * Push callback from the server when it notifies a new mobile just connected
     * Creates a ball and adds its infos
     * @param {Object} data
     */
    function addMobile(data){
        balls[data.id] = new Ball(data.x, data.y, common.ballConst.radius, common.ballConst.mass, common.ballConst.gravity, common.ballConst.elasticity, common.ballConst.friction, data.color, common.ballConst.lifeTime, common.ballConst.options);
        console.info('addMobile',data,balls);
        document.getElementById('infos').innerHTML += '<li id="'+data.id+'" style="color:'+balls[data.id].getColor()+'"><span>toto</span></li>';
    }
    
    /**
     * Push callback from the server when it notifies a mobile just disconnected
     * Removes the ball
     * @param {Object} data
     */
    function removeMobile(data){
        console.info('removeMobile>',data,balls);
        delete balls[data.id];
        var elem = document.getElementById(data.id);
        if(elem){
            elem.parentNode.removeChild(elem);
        }
        console.info('>removeMobile',data,balls);
    }
    
    /**
     * Only updates inputX and inputY of the balls (the ball will be moved later to manage latency cause of the network)
     * @param {Object} mobiles
     */
    function updateMotionInfos(mobiles){
//        console.info('updateMotionInfos');
        loop1: for(var id in balls){
            loop2: for(var mobileId in mobiles){
                if(mobileId === id){
                    updateBallInfos(balls[id],mobiles[mobileId]);
                    break loop2;
                }
            }
        }
    }
    
    /**
     * Updates inputX and inputY of the ball
     * @param {Ball} ball
     * @param {Object} mobileInfos
     */
    function updateBallInfos(ball,mobileInfos){
        ball.inputX = mobileInfos.inputX;
        ball.inputY = mobileInfos.inputY;
    }
    
    /**
     * Physicly moves the ball and checks for out of bounds collision
     * @param {Ball} ball
     */
    function moveBall(ball){
        ball.move(ball.inputX*DEVICEMOTION_INPUT_RATIO,-ball.inputY*DEVICEMOTION_INPUT_RATIO);
        ball.manageStageBorderCollision(width, height);
    }
    
    /**
     * Moves all the balls
     */
    function moveBalls(){
        var ball;
        for (ball in balls){
            moveBall(balls[ball]);
        }
    }
    
    /**
     * @see http://stackoverflow.com/questions/6748781/looping-javascript-hashmap#6748870
     * for looping through hashmap like an array
     */
    function manageCollisions(){
        var i,j,keys,ii;
        for (i = 0, keys = Object.keys(balls), ii = keys.length; i < ii; i++) {
            for (j = i+1; j < ii; j++){
                if(balls[keys[i]].checkBallCollision(balls[keys[j]]) === true){
                    balls[keys[i]].resolveBallCollision(balls[keys[j]]);
                }
            }
        }
    }
    
    function prepareCanvas(){
        var el = document.getElementById('playground');
        width   = el.width;
        height  = el.height;
        ctx = el.getContext('2d');
    }
    
    function clearAllContext(){
        ctx.clearRect ( 0 , 0 , width , height );
    }
    
    function renderInfos(){
        for(var id in balls){
            document.getElementById(id).innerHTML = '<span>inputX : '+balls[id].inputX+' - inputY : '+balls[id].inputY+'</span>';
        }
    }
    
    function renderScreen(){
        clearAllContext();
        for(var id in balls){
            balls[id].draw(ctx);
        }
    }
    
    function render(timeElapsed){
        moveBalls();
        manageCollisions();
        renderInfos();
        renderScreen();
        window.requestAnimFrame(render);
    }
    
    desktop = {
        
        init : init
        
    };
    
    return desktop;
    
});