var express = require('express');
var router = express.Router();

//controller
var providerController = require('../controllers/providerController');
var mobileController = require('../controllers/mobileController');
var clientController = require('../controllers/clientController');

router.get('/', clientController.homeClient);

router.get('/login', clientController.login_post);

router.get('/logout', clientController.logout);

router.get('/register', clientController.register_get);

router.post('/register', clientController.register_post);

router.get('/verify', clientController.verifyEmail_get);

router.post('/verify', clientController.verifyEmail_post);

router.get('/verify-changepass', clientController.verifyAndChangePass_get);

router.post('/verify-changepass', clientController.verifyAndChangePass_post);

router.get('/quen-mat-khau', clientController.forgotPassword_get);

router.post('/quen-mat-khau', clientController.forgotPassword_post);

router.get('/dien-thoai', clientController.listMobile)

router.get('/dien-thoai/duoi-1-trieu', clientController.listMobile_duoi1);

router.get('/dien-thoai/tu-1-3-trieu', clientController.listMobile_tu1den3);

router.get('/dien-thoai/tu-3-6-trieu', clientController.listMobile_tu3den6);

router.get('/dien-thoai/tu-6-10-trieu', clientController.listMobile_tu6den10);

router.get('/dien-thoai/tu-10-15-trieu', clientController.listMobile_tu10den15);

router.get('/dien-thoai/tren-15-trieu', clientController.listMobile_tren15);

router.get('/dien-thoai/:name-:id', clientController.listMobile_provider);

router.get('/dien-thoai/:id', clientController.mobileDetail);

router.post('/dien-thoai/:id', clientController.comment_post);

router.get('/ca-nhan', clientController.profile_get);

router.post('/ca-nhan/chinh-sua', clientController.editProfile_post);

router.post('/ca-nhan/doi-mat-khau', clientController.changPassword_post);

router.post('/tim-kiem', clientController.search_post);

router.post('/dien-thoai/:id/them-vao-gio-hang', clientController.addToCartShopping_post);

router.get('/gio-hang', clientController.cartShopping_get);

router.post('/gio-hang', clientController.cartShopping_post);

router.get('/gio-hang/delete/:id', clientController.deleteCart);

router.get('/gio-hang/tang-1/:id', clientController.increaseByOne);

router.get('/gio-hang/giam-1/:id', clientController.decreaseByOne);

router.get('/lich-su-mua-hang', clientController.saleHistory_get);

router.get('/lich-su-mua-hang/:id', clientController.saleHistoryDetail_get);

router.get('/lich-su-mua-hang/da-nhan/:id', clientController.recievedMobile_get);

router.get('/nha-cung-cap/:id', clientController.providerDetaile_get);


module.exports = router;