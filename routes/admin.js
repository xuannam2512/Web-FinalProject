var express = require('express');
var parser = require('body-parser');
var passport = require('passport');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.isAuthenticated()) {
        return res.render('./admin/home', {
            loginSuccess: true,
            checkLogin: false,
            dashboardActive: true
        });
    }

    var flashMessages = res.locals.getMessages();

    if(flashMessages.success_msg) {
        console.log(flashMessages.success_msg);
        return res.render('./admin/home', {
            loginSuccess: false,
            checkLogin: true,
            showSuccess: true,
            success_msg: flashMessages.success_msg
        });
    }
   
    if(flashMessages.error) {
        return res.render('./admin/home', {
            loginSuccess: false,
            checkLogin: true,
            showError: true,
            errors: flashMessages.error
        });
    } else {
        return res.render('./admin/home', {
            loginSuccess: false,
            checkLogin: true,
        });
    }
    
});


module.exports = router;