module.exports = {
    
    getHost : function(){
        
        if(process.argv[2]){
            return process.argv[2];
        }
        else{
            return "topheman-playground.herokuapp.com";
        }
        
    }
    
};