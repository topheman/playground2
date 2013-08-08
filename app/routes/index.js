/*
 * GET home page.
 */

module.exports = function(app) {

    app.get('/', function(req, res){
        res.render('index', { title : "Playground 2.0" });
    });
    
};