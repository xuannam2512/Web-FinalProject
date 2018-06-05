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

router.get('/user/:id/edit', userController.editUser_get);

router.post('/user/:id/edit', userController.editUser_post);

router.get('/user/:id/delete', userController.deleteUser);

router.get('/user/newuser', userController.newUser_get);

router.post('/user/newuser', userController.newUser_post);


module.exports = router;