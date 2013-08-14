define(['custom/common','utils/requestAnimFrame'],function(common,undefined){
    
    var mobile;
    
    var inputX = 0,
        inputY = 0,
        socket
    ;

     function socketConnect (callback){
        socket = io.connect('/mobile');
        socket.on('mobile-connected',function(data){
            console.log('respond to mobile-connected');
            console.log('mobile connected',data);
            document.getElementById('ball').style.backgroundColor = data.color;
            callback();
        });
        socket.on('desktop-connected',function(data){
            console.log('desktop connected',data);
            setTimeout(function(){window.location.reload();},0);//boo .. bas setTimeout at 0 (but firefox doesn't respond to reload otherwise ...
        });
    }

     function pushMotionInfos (){
//        console.info('pushMotionInfos');
        socket.emit('mobile-infos',{
            inputX: inputX,
            inputY: inputY
        });
//        console.log('updateCoordinates');
        document.getElementById("coords").innerHTML = "inputX : "+inputX+" - inputY : "+inputY;
        window.requestAnimFrame(pushMotionInfos);
    }
    
    mobile = {
    
        isWebSocketsEnabled : function (){
            if(window.WebSocket)
                return true;
            else
                return false;
        },

        checkFeatures : function (){
            var errors = "";
            if(!this.isDeviceMotionEnabled())
                errors += "<li>No gyroscope detected.</li>";
            if(!this.isWebSocketsEnabled())
                errors += "<li>No websockets enabled.</li>";
            if(errors !== ""){
                document.getElementById("errors").innerHTML = "<h3>Errors</h3><ul>"+errors+"</ul>";
                return false;
            }
            else
                return true;
        },

        init : function (){
            //do not execute on remotetilt frame
            if(common.isRemoteTiltEnabled())
                return;
            //do not execute if all the features needed aren't here
            if( (!window.DeviceMotionEvent && !window.DeviceOrientationEvent) || (!("ontouchstart" in window) && !window.DeviceMotionEvent) || (!("ontouchstart" in window) && !window.DeviceOrientationEvent) )
                return;
            //listen to the orientation of the device
            if(window.DeviceMotionEvent){
                window.addEventListener("devicemotion", function(event){
                    inputX = (event.accelerationIncludingGravity.x).toFixed(5);
                    inputY = (event.accelerationIncludingGravity.y).toFixed(5);
                }, false);
            }
            else if(window.DeviceOrientationEvent){
                window.addEventListener('deviceorientation',function(e){
                    inputX = (e.gamma/6).toFixed(5);
                    inputY = -(e.beta/6).toFixed(5);
                },false);
            }
            //push coordinates to server via socket.io
            socketConnect(pushMotionInfos);
        },

        log : function (msg){
            document.getElementById('errors').innerHTML += msg;
        }
        
    };
    
    return mobile;
    
});