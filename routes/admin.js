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
var uploadController = require('../controllers/uploadController');

router.get('/', accountController.loginAdmin_get);

router.post('/', accountController.loginAdmin_post);

router.get('/logout', accountController.logout);
//user
router.get('/user', isLoggedIn, userController.listUser);

router.get('/user/:id/edit', isLoggedIn, userController.editUser_get);

router.post('/user/:id/edit', isLoggedIn, userController.editUser_post);

router.get('/user/:id/delete', isLoggedIn, userController.deleteUser);

router.get('/user/newuser', isLoggedIn, userController.newUser_get);

router.post('/user/newuser', isLoggedIn, userController.newUser_post);

//account
router.get('/account', isLoggedIn, accountController.listAccount);

router.post('/account', function(req, res) {
    res.send('khoa tai khoang');
})

router.get('/account/newaccount', isLoggedIn, accountController.createAccount_get);

router.post('/account/newaccount', accountController.createAccount_post);

router.get('/account/:id', isLoggedIn, accountController.accountDetail);

router.get('/account/:id/delete', isLoggedIn, accountController.deleteAccount);

//provider
router.get('/provider', isLoggedIn, providerController.listProvider);

router.get('/provider/newprovider', isLoggedIn, providerController.newProvider_get);

router.post('/provider/newprovider', isLoggedIn, providerController.newProvider_post);

router.get('/provider/:id', isLoggedIn, providerController.providerDetail);

router.get('/provider/:id/edit', isLoggedIn, providerController.editProvider_Get);

router.post('/provider/:id/edit', isLoggedIn, providerController.editProvider_Post);

router.get('/provider/:id/delete', isLoggedIn, providerController.deleteProvider);

//mobile
router.get('/mobile', isLoggedIn, mobileController.listMobile);

router.get('/mobile/:id', isLoggedIn, mobileController.mobileDetail);

router.get('/mobile/:id/edit', isLoggedIn, mobileController.mobileEdit_Get);

router.post('/mobile/:id/edit', isLoggedIn, mobileController.mobileEdit_Post);

router.get('/mobile/:id/status', isLoggedIn, mobileController.setStatus);

//import mobile
router.get('/importMobile', isLoggedIn, importController.listImports);

router.get('/importMobile/newImport', isLoggedIn, importController.newImport_Get);

router.post('/importMobile/newImport', isLoggedIn, importController.newImport_Post);

router.get('/importMobile/:id', isLoggedIn, importController.importDetail);

//demo upload
router.get('/upload', uploadController.upload_get);

router.post('/upload', uploadController.upload_post);

//sale
router.get('/sale', isLoggedIn, saleController.listSale_get);

router.get('/sale/:id', isLoggedIn, saleController.saleDetail);

router.get('/sale/deliver/:id', isLoggedIn, saleController.deliver_get);

module.exports = router;

//route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/admin');
}