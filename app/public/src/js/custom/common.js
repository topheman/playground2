/**
 * This file is used as well on the server and on the front, via requirejs
 *
 */

define(function(){
    
    var common;
    
    common = {
        
        stage : {
            width : 600,
            height : 500
        },
        
        ballConst : {
            radius           : 15,
            mass             : 1.3,
            gravity          : 1,
            elasticity       : 0.98,
            friction         : 0.94,
            lifetime         : Infinity,
            options          : {
                aging:true,
                bouncingColor:'#000060',
                bouncingRate: 20,
                glowingColor:'#9922DD',
                glowingRate:'#9922DD',
                explodingRadius:80,
                explodingRate:40,
                explodingAlpha:true
            }
        },
        
        isRemoteTiltEnabled : function(){
            if(window.location.href.indexOf('#tiltremote') > -1)
                return true;
            else
                return false;
        },
                
        getRandomColor : function(){
            var color = '#000000';
            while(color === '#000000'){
                color = '#'+Math.floor(Math.random()*16777215).toString(16);
            }
            return color;
        },
                
        getRandomPositionAndSpeedInBounds : function(){
            return {
                x : Math.random()*this.stage.width,
                y : Math.random()*this.stage.height,
                velocityX : Math.random()*10,
                velocityY : Math.random()*10
            };
        }
        
    };
    
    return common;
    
});