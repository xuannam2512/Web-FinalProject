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

//account
router.get('/account', accountController.listAccount);

router.get('/account/newaccount', accountController.createAccount_get);

router.post('/account/newaccount', accountController.createAccount_post);

router.get('/account/:id/delete', accountController.deleteAccount);

//provider
router.get('/provider', providerController.listProvider);

router.get('/provider/:id', providerController.providerDetail);

//mobile
router.get('/mobile', mobileController.listMobile);

router.get('/mobile/:id', mobileController.mobileDetail);

router.get('/mobile/:id/edit', mobileController.mobileEdit_Get);

router.post('/mobile/:id/edit', mobileController.mobileEdit_Post);

router.get('/mobile/:id/status', mobileController.setStatus);

//import mobile
router.get('/importMobile', importController.listImports);

router.get('/importMobile/newImport', importController.newImport_Get);

router.post('/importMobile/newImport', importController.newImport_Post);

router.get('/importMobile/:id', importController.importDetail);


module.exports = router;