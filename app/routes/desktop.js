/*
 * GET desktop page.
 */
module.exports = function(app) {

    app.get('/desktop', function(req, res){
        
        var requirejs = require('requirejs');
        requirejs.config({nodeRequire: require});

        var common = requirejs('./app/public/src/js/custom/common.js');
        
        var mobileUrl = "http" + (app.get('host') === "topheman-playground.herokuapp.com" ? "s" : "") + "://"+app.get('host')+"/mobile";
        
        var qrCode = null;
        var qrCode = require('qrcode-npm');
        var qr = qrCode.qrcode(4, 'M');
        qr.addData(mobileUrl);
        qr.make();

        var imgQrCode = qr.createImgTag(5);    // creates an <img> tag as text
        
        res.render('desktop', { title : "Playground 2.0", stage : common.stage, imgQrCode : imgQrCode, mobileUrl : mobileUrl });
    });
    
};