define(['custom/common','utils/requestAnimFrame','vendor/Ball'],function(common,undefined,undefined){
    
    var desktop;
    
    var socket,
        balls = {},
        width,
        height,
        ctx,
        DEVICEMOTION_INPUT_RATIO = 0.2,
        ACTIVATE_SOUND_EFFECTS      = true,
        SOUND_BALL_COLLISION_FILE   = "./assets/audio/bounce-ball.wav",
        SOUND_BORDER_COLLISION_FILE = "./assets/audio/bounce-rail.wav",
        SOUND_EXPLOSION_FILE        = "./assets/audio/explosion.wav",
        html5SoundSupport           = false,
        sounds                      = {};
    ;
    
    function init(){
        prepareCanvas();
        initSounds();
        socketConnect();
        render();
        Chat.init();
        addEmulatorLink();
    }
    
    function addEmulatorLink(){
        document.getElementById('emulator-test-anchor').addEventListener('click',function(e){
            e.preventDefault();
            window.open(this.href,"mobileRemote","menubar=no, status=no, scrollbars=no, width=400, height=400");
        },false);
    }
    
    function socketConnect(){
        //remove this (only for test to force xhr-polling)
        var options = {
//            'transports' : ['xhr-polling']
        };
        socket = io.connect('/desktop',options);
        socket.on('desktop-connected',function(data){
            console.log('desktop connected',data);
            balls = {};
            Chat.updateUsers(data.desktops);
            Chat.addMessage(data.message);
            //only show this message to the other desktops already connected
            if(socket.socket.sessionid !== data.socketId){
                addMessage("A new desktop has connected, reconnecting all mobile devices ...",2);
            }
        });
        socket.on('desktop-disconnected',function(data){
            console.log('desktop disconnected',data);
            Chat.updateUsers(data.desktops);
            Chat.addMessage(data.message);
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
        /** chat part*/
        socket.on('desktop-update-chat-users',function(data){
            Chat.updateUsers(data.desktops);
            Chat.addMessage(data.message);
        });
        socket.on('desktop-add-message',function(data){
            if(document.getElementById('chat-wrapper').className.indexOf('close') > -1){
                document.querySelector('#chat-wrapper .chat-header').classList.add('message-waiting');
            }
            Chat.addMessage(data.message);
        });
    }
    
    function addMessage(message,importance){
        importance = importance || 3;
        var liMessage = document.createElement('li');
        liMessage.innerHTML = message;
        liMessage.className = "level-"+importance;
        document.getElementById('messages').appendChild(liMessage);
        liMessage.addEventListener('webkitTransitionEnd',function( event ) { this.parentNode.removeChild(this);}, false );//webkit
        liMessage.addEventListener('transitionend',function( event ) { this.parentNode.removeChild(this);}, false );//ff
        liMessage.addEventListener('OTransitionEnd',function( event ) { this.parentNode.removeChild(this);}, false );//o
        setTimeout(function(){liMessage.className += " read";},2000*(3/importance));
    }
    
    var Chat = {
        
        init : function(){
            
            var closeChatWindow = function(chatWrapper){
                chatWrapper.classList.remove('open');
                chatWrapper.classList.add('close');
            };
            
            var openChatWindow = function(chatWrapper){
                document.querySelector('#chat-wrapper .chat-header').classList.remove('message-waiting');
                chatWrapper.classList.remove('close');
                chatWrapper.classList.add('open');
            };
        
            document.getElementById('chat-wrapper').addEventListener('click',function(e){
                e.stopPropagation();
                var chatWrapper = this;
                if(chatWrapper.classList.contains('close')){
                    openChatWindow(chatWrapper);
                }
            },false);
        
            document.getElementsByTagName('html')[0].addEventListener('click',function(e){
                console.log(e);
                var chatWrapper = document.getElementById('chat-wrapper');
                if(chatWrapper.classList.contains('open')){
                    closeChatWindow(chatWrapper);
                }
            },false);
            
            document.getElementById('input-name').addEventListener('change',function(){
                var name = this.value;
                console.log(name);
                socket.emit('desktop-update-name',{name : name});
            });
            
            document.getElementById('input-message').addEventListener('change',function(){
                var message = this.value;
                this.value = "";
                console.log(message);
                socket.emit('desktop-post-message',{message : message});
            });
            
        },
                
        updateUsers : function(data){
            
            var socketId,
                html ="",
                usersNumber = Object.keys(data).length;
            console.log('chat updating users',data);
            for(socketId in data){
                html += "<li>"+data[socketId].name+"</li>";
            }
            document.getElementById('chat-desktop-list').innerHTML = html;
            document.querySelector('#chat-wrapper .persons').innerHTML = "("+usersNumber+" person"+(usersNumber > 1 ? "s" : "")+")";
            
        },
                
        addMessage : function(message){
            var divChatMessage = document.getElementById('chat-messages');
            divChatMessage.innerHTML += "<br>"+message;
            divChatMessage.scrollTop = divChatMessage.scrollHeight;
        }
        
    };
    
    /**
     * Push callback from the server when it notifies a new mobile just connected
     * Creates a ball and adds its infos
     * @param {Object} data
     */
    function addMobile(data){
        balls[data.id] = new Ball(data.x, data.y, common.ballConst.radius, common.ballConst.mass, common.ballConst.gravity, common.ballConst.elasticity, common.ballConst.friction, data.color, common.ballConst.lifeTime, common.ballConst.options);
        console.info('addMobile',data,balls);
        document.getElementById('infos').innerHTML += '<li id="'+data.id+'" style="color:'+balls[data.id].getColor()+'"><span>toto</span></li>';
        addMessage("A new mobile just connected",2);
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
        addMessage("A mobile just disconnected",2);
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
        ball.move(ball.inputX*DEVICEMOTION_INPUT_RATIO, ball.inputY*DEVICEMOTION_INPUT_RATIO);
        ball.manageStageBorderCollision(width, height, playSoundBorderCollision);
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
                    playSoundBallCollision();
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

    /** Sound part retrieved from bombs.topheman.com */

    function initSounds(){
        var a = document.createElement('audio');
        html5SoundSupport       = !!(a.canPlayType && a.canPlayType('audio/wav; codecs="1"').replace(/no/, '')) && ACTIVATE_SOUND_EFFECTS;
        if(html5SoundSupport === true){
            sounds['soundBallCollision'] = new Audio(SOUND_BALL_COLLISION_FILE);
            sounds['soundBorderCollision'] = new Audio(SOUND_BORDER_COLLISION_FILE);
            sounds['soundExplosion'] = new Audio(SOUND_EXPLOSION_FILE);
        }
    }

    function playSound(soundId,volume,time){
        if(html5SoundSupport === true){
            try{
                sounds[soundId].currentTime   = time || 0;
                sounds[soundId].volume        = volume || 1;
                sounds[soundId].play();
            }
            catch(e){
//                console.info('html5 sound.play error ',e);
            }
        }
    }

    function playSoundBallCollision(){
        playSound('soundBallCollision');
    }

    function playSoundBorderCollision(){
        playSound('soundBorderCollision',0.1);
    }

    function playSoundExplosion(){
        playSound('soundExplosion');
    }
    
    /** end sounds part */
    
    desktop = {
        
        init : init
        
    };
    
    return desktop;
    
});