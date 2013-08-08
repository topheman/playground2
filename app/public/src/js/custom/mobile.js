define(['custom/common','utils/requestAnimFrame'],function(common,undefined){
    
    var mobile;
    
    var inputX = 0,
        inputY = 0,
        socket
    ;

     function socketConnect (callback){
        socket = io.connect(window.location.protocol+'//'+window.location.host);
        socket.on('who-is-there', function(data){
            console.log('respond to who-is-there');
            socket.emit('mobile-connect',{});
        });
        socket.on('mobile-connected',function(data){
            console.log('respond to mobile-connected');
            console.log('mobile connected',data);
            document.getElementById('ball').style.backgroundColor = data.color;
            callback();
        });
    }

     function pushMotionInfos (){
        console.info('pushMotionInfos');
        socket.emit('mobile-infos',{
            inputX: inputX,
            inputY: inputY
        });
        console.log('updateCoordinates');
        document.getElementById("coords").innerHTML = "inputX : "+inputX+" - inputY : "+inputY;
        window.requestAnimFrame(pushMotionInfos);
    }
    
    mobile = {
    
        isDeviceMotionEnabled : function (){
            if(window.DeviceMotionEvent)
                return true;
            else
                return false;
        },
    
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
            if(!this.checkFeatures())
                return;
            //listen to the orientation of the device
            window.addEventListener("devicemotion", function(event){
                inputX = (event.accelerationIncludingGravity.x).toFixed(5);
                inputY = (event.accelerationIncludingGravity.y).toFixed(5);
            }, false);
            //push coordinates to server via socket.io
            socketConnect(pushMotionInfos);
        },

        log : function (msg){
            document.getElementById('errors').innerHTML += msg;
        }
        
    };
    
    return mobile;
    
});