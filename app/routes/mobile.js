/*
 * GET desktop page.
 */
module.exports = function(app) {

    app.get('/mobile', function(req, res){
        res.render('mobile', {title : "Playground 2.0"});
    });
    
};