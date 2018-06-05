var express = require('express');
var parser = require('body-parser');
var passport = require('passport');
var router = express.Router();

//controller
var accountController = require('../controllers/accountController');
var userController = require('../controllers/userController');
var mobileController = require('../controllers/mobileController');
var providerController = require('../controllers/providerController');
var importController = require('../controllers/importController');
var saleController = require('../controllers/saleController');

router.get('/', accountController.loginAdmin_get);

router.post('/', accountController.loginAdmin_post);

//user
router.get('/user', userController.listUser);


module.exports = router;