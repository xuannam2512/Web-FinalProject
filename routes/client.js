var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('./client/home', {
        layout: 'layoutClient.hbs'
    });
});

module.exports = router;