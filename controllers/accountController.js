var mongoose = require('mongoose');
var passport = require("passport");
var Account = require('../models/Account');
var User = require('../models/User');
var upload = require('./configUploadImage');
var async = require('async');

exports.listAccount = function (req, res) {
    Account.find({})
        .exec(function (err, results) {
            if (err) {
                console.log('err: ' + err);
                return;
            }

            res.render('./admin/account/account', {
                accountActive: true,
                loginSuccess: true,
                tables: results
            })
        });
}

exports.accountDetail = function (req, res) {

    User.findById(req.params.id)
        .exec(function (err, result) {
            if (err) {
                console.log('err: ' + err);
                return;
            }

            if (result == null) {
                res.sendStatus(404);
                return;
            }

            res.render('./adminview/accountDetail', {
                userActive: true,
                loginSuccess: true,
                fullname: result.fullname,
                email: result.email,
                tel: result.tel,
                address: result.address
            });
        });

}

exports.deleteAccount = function (req, res) {

    console.log(req.params.id);
    async.series({
        account: function (callback) {
            Account.findById(req.params.id)
                .populate('user')
                .exec(callback)
        },
        delteAccount: function (callback) {
            Account.findByIdAndRemove(req.params.id)
                .exec(callback);
        }
    }, function (err, result) {

        if (err) {
            console.log('error: ' + err);
            res.sendStatus(404);
            return;
        }

        //delete user 
        User.findOneAndRemove({ '_id': result.account.user._id })
            .exec(function (err1, reusult1) {
                if (err1) {
                    console.log('error: ' + err1);
                    res.sendStatus(404);
                    return;
                }
                console.log('xoa thanh cong user info');

                Account.find({})
                    .exec(function (err2, results) {
                        if (err) {
                            console.log('err: ' + err2);
                            return;
                        }

                        res.render('./admin/account/account', {
                            accountActive: true,
                            loginSuccess: true,
                            success: true,
                            tables: results
                        });
                    });
            });
    });
}

exports.createAccount_get = function (req, res) {
    res.render('./admin/account/createAccount', {
        accountActive: true,
        loginSuccess: true,
        login: true,
        errors: false
    });
}

exports.createAccount_post = function (req, res) {
    //upload image
    upload.Upload(req, res, (err) => {
        if (err) {
            req.flash('error_msg', 'Tải ảnh lên thất bại, hãy thử ảnh khác!');
            errors = res.locals.getMessages();
            console.log(errors.error_msg);
            return res.render('./admin/account/createAccount', {
                accountActive: true,
                loginSuccess: true,
                login: true,
                showError: true,
                error: errors.error_msg
            });
        } else {
            if (req.file == undefined) {
                req.flash('error_msg', 'Chưa có hình được chọn!');
                errors = res.locals.getMessages();
                console.log(errors.error_msg);
                return res.render('./admin/account/createAccount', {
                    accountActive: true,
                    loginSuccess: true,
                    login: true,
                    showError: true,
                    error: errors.error_msg
                });
            } else {
                var fullname = req.body.fullname;
                var email = req.body.email;
                var tel = req.body.tel;
                var address = req.body.address;
                var username = req.body.username;
                var password = req.body.password;
                var password2 = req.body.password2;

                req.checkBody('password2', 'Password do not match').equals(req.body.password);
                req.checkBody('fullname', 'Full name is required.').notEmpty();
                req.checkBody('email', 'Email is required.').notEmpty();
                req.checkBody('address', 'Address is required.').notEmpty();
                req.checkBody('tel', 'Phone Number is required.').notEmpty();
                req.checkBody('username', 'User name is required.').notEmpty();
                req.checkBody('password', 'Password is required.').notEmpty();
                req.checkBody('password2', 'Confirm password is required.').notEmpty();

                var errors = req.validationErrors();
                if (errors) {
                    console.log(errors);
                    return res.render('./admin/account/createAccount', {
                        accountActive: true,
                        loginSuccess: true,
                        login: true,
                        showError: false,
                        errors: errors
                    })
                } else {
                    console.log('NO');
                }

                //check username is exist before
                Account.find({ 'username': username })
                    .exec(function (err, result) {
                        if (err) { return res.sendStatus(404) }
                        if (result.length == 1) {
                            req.flash('error_msg', 'Tên tài khoảng đã tồn tại');
                            errors = res.locals.getMessages();
                            console.log(errors.error_msg);
                            return res.render('./admin/account/createAccount', {
                                accountActive: true,
                                loginSuccess: true,
                                login: true,
                                showError: true,
                                error: errors.error_msg
                            })
                        }
                    })


                userDetail = {
                    fullname: req.body.fullname,
                    img: '../../public/upload/' + req.file.filename,
                    email: req.body.email,
                    tel: req.body.tel,
                    address: req.body.address
                }

                var newUser = new User(userDetail);

                Account.register(new Account({
                    username: req.body.username,
                    authorization: req.body.authorization,
                    user: newUser,
                    status: 'Active'
                }), req.body.password, function (err, account) {
                    if (err) {
                        console.log('error: ' + err);
                        return res.send(account);
                    }

                    passport.authenticate('local')(req, res, function () {

                        newUser.save(function (err, result) {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log('new newUser: ' + newUser)
                        });

                        res.redirect('/admin/account');
                    });
                });
            }
        }

    })
}

exports.loginAdmin_get = function (req, res) {
    if (req.isAuthenticated()) {
        return res.render('./admin/home', {
            loginSuccess: true,
            checkLogin: false,
            dashboardActive: true
        });
    }

    var flashMessages = res.locals.getMessages();

    if (flashMessages.success_msg) {
        console.log(flashMessages.success_msg);
        return res.render('./admin/home', {
            loginSuccess: false,
            checkLogin: true,
            showSuccess: true,
            success_msg: flashMessages.success_msg
        });
    }

    if (flashMessages.error) {
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
}

exports.loginAdmin_post = function (req, res) {
    passport.authenticate('local', {
        failureRedirect: '/admin',
        failureFlash: 'Tên đăng nhập hoặc mật khẩu không đúng.'
    })(req, res, function () {
        res.render('./admin/home', {
            loginSuccess: true,
            checkLogin: false,
            dashboardActive: true,
            msg: 'Hello'
        });
    });
}

