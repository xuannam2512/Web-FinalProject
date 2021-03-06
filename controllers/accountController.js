var mongoose = require('mongoose');
var passport = require("passport");
var Account = require('../models/Account');
var User = require('../models/User');

var Image = require('./configUploadImage');
var async = require('async');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');

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
    console.log(req.params.id);
    Account.findById(req.params.id)
        .populate('user')
        .exec(function (err, result) {
            console.log(result);
            res.render('./admin/account/accountDetail', {
                accountActive: true,
                loginSuccess: true,
                url: result.user._id,
                img: result.user.imgDisplay,
                username: result.username,
                fullname: result.user.fullname,
                email: result.user.email,
                tel: result.user.tel,
                address: result.user.address
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
    Image.Upload(req, res, (err) => {
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
                    var path = './public/uploads/' + req.file.filename;
                    Image.Delete(path);
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
                async.parallel({
                    account: function (callback) {
                        Account.find({ 'username': req.body.username })
                            .exec(callback);
                    },
                    email: function (callback) {
                        User.find({ 'email': req.body.email })
                            .exec(callback);
                    }
                }, function (err, result) {
                    if (err) {
                        var path = './public/uploads/' + req.file.filename;
                        Image.Delete(path);
                        return res.sendStatus(404)
                    }
                    //neu tai khoang da toan tai
                    if (result.account.length > 0) {
                        var path = './public/uploads/' + req.file.filename;
                            Image.Delete(path);
                            req.flash('error_msg', 'Tên tài khoảng đã tồn tại');
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
                        if (result.email.length > 0) {
                            var path = './public/uploads/' + req.file.filename;
                            Image.Delete(path);
                            req.flash('error_msg', 'Email đã tồn tại');
                            errors = res.locals.getMessages();
                            console.log(errors.error_msg);
                            return res.render('./admin/account/createAccount', {
                                accountActive: true,
                                loginSuccess: true,
                                login: true,
                                showError: true,
                                error: errors.error_msg
                            })
                        } else {
                            userDetail = {
                                fullname: req.body.fullname,
                                imgDisplay: '../../../uploads/' + req.file.filename,
                                imgDelete: './public/uploads/' + req.file.filename,
                                email: req.body.email,
                                tel: req.body.tel,
                                address: req.body.address
                            }
            
                            var newUser = new User(userDetail);
                            const secretToken = randomstring.generate();

                            Account.register(new Account({
                                username: req.body.username,
                                authorization: 'Customer',
                                user: newUser,
                                secretToken: secretToken,
                                status: 'Not Active'
                            }), req.body.password, function (err, account) {
                                if (err) {
                                    var path = './public/uploads/' + req.file.filename;
                                    Image.Delete(path);
                                    console.log('error: ' + err);
                                    return res.send(account);
                                }

                                passport.authenticate('local')(req, res, function () {

                                    newUser.save(function (err, result) {
                                        if (err) {
                                            console.error(err);
                                            return;
                                        }

                                        //send mail
                                        //content mail
                                        const html = `Hi there,
                                        <br/>
                                        Thank you for registering!
                                        <br/><br/>
                                        Please verify your email by typing the following token:
                                        <br/>
                                        Token: <b>${secretToken}</b>
                                        <br/>
                                        On the following page:
                                        <a href="http://localhost:3000/verify">http://localhost:3000/verify</a>
                                        <br/><br/>
                                        Have a pleasant day.`
                                        
                                        //config nodemailer
                                        var transporter = nodemailer.createTransport({
                                            service: 'Gmail',
                                            secure: true,
                                            port: 465,
                                            auth: {
                                                user: 'xuannam2512@gmail.com',
                                                pass: 'frhojmxzxlfbesar'
                                            }
                                        });
                                        //content mail
                                        var mailOptions = {
                                            from: 'xuannam2512@gmail.com',
                                            to: req.body.email,
                                            subject: 'Sending Email using Node.js',
                                            html: html
                                        };
                                        //send mail
                                        transporter.sendMail(mailOptions, function (error, info) {
                                            if (error) {
                                                console.log(error);
                                            } else {
                                                console.log('Email sent: ' + info.response);
                                                req.flash('success_msg', 'Đăng ký thành công, hãy kiễm tra email để kích hoạt!');
                                                res.redirect('/admin/account');
                                            }
                                        });
                                    });
                                });
                            });
                        }
                    }
                });
            }
        }

    })
}

exports.loginAdmin_get = function (req, res) {
    if (req.isAuthenticated()) {
        console.log(req.user._id);
        var authorization = req.user.authorization;
        if(authorization == 'Admin') {
            Account.findById(req.user._id)
            .populate('user')
            .exec(function (err, result) {
                if (err) {
                    req.flash('error_msg', 'Không thể load thông tin tài khoảng');
                    var flashMessages = res.locals.getMessages();
                    return res.render('./admin/home', {
                        loginSuccess: true,
                        checkLogin: false,
                        dashboardActive: true,
                        showError: true,
                        error_msg: flashMessages.error_msg
                    });
                }

                return res.render('./admin/home', {
                    loginSuccess: true,
                    checkLogin: false,
                    dashboardActive: true,
                    img: result.user.imgDisplay,
                    username: result.username,
                    fullname: result.user.fullname,
                    email: result.user.email,
                    tel: result.user.tel,
                    address: result.user.address
                });
            })
        } else {
            req.flash('error_msg', 'Chỉ có tài khoảng admin mới được đăng nhập!');
            var flashMessages = res.locals.getMessages();
            return res.render('./admin/home', {
                loginSuccess: false,
                checkLogin: true,
                dashboardActive: true,
                showError: true,
                error_msg: flashMessages.error_msg
            });
        }
    } else {
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
                error_msg: flashMessages.error
            });
        } else {
            return res.render('./admin/home', {
                loginSuccess: false,
                checkLogin: true,
            });
        }
    }
}

exports.loginAdmin_post = function (req, res) {
    passport.authenticate('local', {
        failureRedirect: '/admin',
        failureFlash: 'Tên đăng nhập hoặc mật khẩu không đúng.'
    })(req, res, function () {
        var id = req.user._id;
        var authorization = req.user.authorization;
        var status = req.user.status;
        console.log(authorization);
        console.log(id);
        if(authorization == "Admin" && status == 'Active') {
            Account.findById(id)
            .populate('user')
            .exec(function (err, result) {
                if (err) {
                    req.flash('error_msg', 'Không thể load thông tin tài khoảng');
                    var flashMessages = res.locals.getMessages();
                    return res.render('./admin/home', {
                        loginSuccess: true,
                        checkLogin: false,
                        dashboardActive: true,
                        showError: true,
                        error_msg: flashMessages.error_msg
                    });
                }

                req.flash('success_msg', 'Xin chao admin');
                var flashMessages = res.locals.getMessages();
                return res.render('./admin/home', {
                    loginSuccess: true,
                    checkLogin: false,
                    dashboardActive: true,
                    showSuccess: true,
                    success_msg: flashMessages.success_msg,
                    img: result.user.imgDisplay,
                    username: result.username,
                    fullname: result.user.fullname,
                    email: result.user.email,
                    tel: result.user.tel,
                    address: result.user.address
                });
            })
        } else {
            req.flash('error_msg', 'Chỉ có tài khoảng admin mới được đăng nhập! Hoặc tài khoảng chưa được active, hãy kiễm tra mail!');
            var flashMessages = res.locals.getMessages();
            return res.render('./admin/home', {
                loginSuccess: false,
                checkLogin: true,
                dashboardActive: true,
                showError: true,
                error_msg: flashMessages.error_msg
            });
        }
        
    });
}

exports.logout = function(req, res) {
    req.logout();

    req.flash('success_msg', 'Đăng Xuất Thành Công.');

    res.redirect('/admin');
}

