//cmodel
var User = require('../models/User');
var Account = require('../models/Account');
var Mobile = require('../models/Mobile');
var Provider = require('../models/Provider');
var Specification = require('../models/Specifications');
var Comment = require('../models/Comment');
var Sale = require('../models/Sale');
var Cart = require('../models/cart');

var passport = require("passport");
var async = require('async');
var Image = require('./configUploadImage');
const randomstring = require('randomstring');
var nodemailer = require('nodemailer');
var dateFormat = require('dateformat');

exports.homeClient = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    async.parallel({
        provider: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        specification: function (callback) {
            Specification.find({})
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, result) {
        var apple = [];
        var samsung = [];
        var idApple, idSamsung;
        //get id of provider apple and samsung
        for (var i = 0; i < result.provider.length; i++) {
            if (result.provider[i].name == 'APPLE')
                idApple = result.provider[i]._id;
            if (result.provider[i].name == 'SAMSUNG')
                idSamsung = result.provider[i]._id
        }
        //get 6 mobile of each provider
        for (var i = 0; i < result.specification.length; i++) {
            var idProvider = result.specification[i].mobileID.provider;
            if (idProvider.toString() == idApple.toString() && apple.length <= 6) {
                apple.push(result.specification[i])
            }
            if (idProvider.toString() == idSamsung.toString() && samsung.length <= 6) {
                samsung.push(result.specification[i])
            }
        }

        var flashMessages = res.locals.getMessages();
        if (flashMessages.error) {
            return res.render('./client/home', {
                layout: 'layoutClient.hbs',
                homeActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                apple: apple,
                samsung: samsung,
                provider: result.provider,
                amountInCart: amountInCart,
                showError: true,
                error_msg: flashMessages.error
            });
        } else {
            if (flashMessages.success_msg) {
                if (req.isAuthenticated()) {
                    return res.render('./client/home', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: true,
                        nameProvider: result.provider,
                        apple: apple,
                        samsung: samsung,
                        provider: result.provider,
                        amountInCart: amountInCart,
                        showSuccess: true,
                        success_msg: flashMessages.success_msg
                    });
                } else {
                    return res.render('./client/home', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: false,
                        nameProvider: result.provider,
                        apple: apple,
                        samsung: samsung,
                        provider: result.provider,
                        amountInCart: amountInCart,
                        showSuccess: true,
                        success_msg: flashMessages.success_msg
                    });
                }


            } else {
                if (req.isAuthenticated()) {
                    return res.render('./client/home', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: true,
                        nameProvider: result.provider,
                        apple: apple,
                        samsung: samsung,
                        provider: result.provider,
                        amountInCart: amountInCart,
                    });
                } else {
                    return res.render('./client/home', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: false,
                        nameProvider: result.provider,
                        apple: apple,
                        samsung: samsung,
                        provider: result.provider,
                        amountInCart: amountInCart,
                    });
                }
            }
        }
    })
}

exports.login_post = function (req, res) {
    passport.authenticate('local', {
        failureRedirect: '/',
        failureFlash: 'Tên đăng nhập hoặc mật khẩu không đúng.'
    })(req, res, function () {
        var id = req.user._id;
        console.log(id);
        Account.findById(id)
            .populate('user')
            .exec(function (err, result) {
                if (err) {
                    req.flash('error', 'Không thể load thông tin tài khoảng');
                    return res.redirect('/');
                }

                if (result.status != 'Active') {
                    req.flash('error', 'Tài khoảng chưa được active, hãy kiễm tra mail để kích hoạt.');
                    return res.redirect('/verify');
                } else {
                    req.flash('success_msg', 'Xin chao!');
                    return res.redirect('/');
                }
            })
    });
}

exports.logout = function (req, res) {
    req.logout();

    req.flash('success_msg', 'Đăng Xuất Thành Công.');

    res.redirect('/');
}

//dang ky tai khoang
exports.register_get = function (req, res) {
    var flashMessages = res.locals.getMessages();
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;

    Provider.find({})
    .exec(function(err, result) {
        if(err) {
            return console.log(err);
        }

        if (flashMessages.error) {
            return res.render('./client/register', {
                layout: 'layoutClient.hbs',
                loginSuccess: false,
                nameProvider: result,
                registerActive: true,
                showError: true,
                error_msg: flashMessages.error,
                amountInCart: amountInCart
            });
        } else {
            if (flashMessages.success_msg) {
                return res.render('./client/register', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: false,
                    nameProvider: result,
                    registerActive: true,
                    showSuccess: true,
                    success_msg: flashMessages.success_msg, 
                    amountInCart: amountInCart
                });
            } else {
                res.render('./client/register', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: false,
                    registerActive: true,
                    nameProvider: result,
                    amountInCart: amountInCart
                });
            }
        }
    });
}

exports.register_post = function (req, res) {
    Image.Upload(req, res, (err) => {
        if (err) {
            req.flash('error', 'Tải ảnh lên thất bại, hãy thử ảnh khác!');
            return res.redirect('/register');
        } else {
            if (req.file == undefined) {
                req.flash('error', 'Chưa có hình được chọn!');
                return res.redirect('/register');
            } else {
                var password = req.body.password;
                var confirmPassword = req.body.confirmPassword;
                console.log(password);
                console.log(confirmPassword);

                req.checkBody('confirmPassword', 'Password do not match').equals(password);
                var errors = req.validationErrors();
                if (errors) {
                    console.log(errors);
                    req.flash('error', 'Mật khẩu xác nhận không khớp, hãy thử lại!');
                    var path = './public/uploads/' + req.file.filename;
                    Image.Delete(path);
                    return res.redirect('/register');
                }
                //check username and email are exist before
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
                        req.flash('error', 'Tên tài khoảng đã tồn tại');
                        return res.redirect('/register');
                    } else {
                        if (result.email.length > 0) {
                            var path = './public/uploads/' + req.file.filename;
                            Image.Delete(path);
                            req.flash('error', 'Email đã tồn tại');
                            return res.redirect('/register');
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
                                                req.flash('success_msg', 'Đăng ký thành công!');
                                                res.redirect('/verify');
                                            }
                                        });
                                    });
                                });
                            });
                        }
                    }
                })
            }
        }

    })
}

//trang xac nhan ma bao mat
exports.verifyEmail_get = function (req, res) {
    var flashMessages = res.locals.getMessages();
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    Provider.find({})
    .exec(function(err, result) {
        if(err) {
            return console.log(err);
        }

        if (flashMessages.error) {
            return res.render('./client/verify', {
                layout: 'layoutClient.hbs',
                loginSuccess: false,
                registerActive: true,
                nameProvider: result,
                showError: true,
                error_msg: flashMessages.error,
                amountInCart: amountInCart
            });
        } else {
            if (flashMessages.success_msg) {
                return res.render('./client/verify', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: false,
                    registerActive: true,
                    nameProvider: result,
                    showSuccess: true,
                    success_msg: flashMessages.success_msg,
                    amountInCart: amountInCart
                });
            } else {
                return res.render('./client/verify', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: false,
                    nameProvider: result,
                    registerActive: true,
                    amountInCart: amountInCart
                });
            }
        }
    });
}

exports.verifyEmail_post = async (req, res, next) => {
    try {
        const { secretToken } = req.body;
        const user = await Account.findOneAndUpdate({ 'secretToken': secretToken }, {
            status: 'Active'
        });

        if (user == null) {
            req.flash('error', 'Mã bí mật không đúng hãy kiễm tra lại');
            return res.redirect('/verify');
        }
        req.flash('success_msg', 'Kích hoạt thành công, bạn có thể đăng nhập để sử dụng');
        res.redirect('/');
    } catch (error) {
        return console.log(error);
    }
}

//quen mat khau
exports.forgotPassword_get = function (req, res) {
    var flashMessages = res.locals.getMessages();
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;

    Provider.find({})
    .exec(function(err, result) {
        if(err) {
            return console.log(err);
        }

        if (flashMessages.error) {
            return res.render('./client/forgotPassword', {
                layout: 'layoutClient.hbs',
                signinActive: true,
                loginSuccess: false,
                showError: true,
                nameProvider: result,
                error_msg: flashMessages.error,
                amountInCart: amountInCart
            });
        } else {
            if (flashMessages.success_msg) {
                return res.render('./client/forgotPassword', {
                    layout: 'layoutClient.hbs',
                    signinActive: true,
                    loginSuccess: false,
                    nameProvider: result,
                    showSuccess: true,
                    success_msg: flashMessages.success_msg,
                    amountInCart: amountInCart
                });
            } else {
                return res.render('./client/forgotPassword', {
                    layout: 'layoutClient.hbs',
                    signinActive: true,
                    loginSuccess: false,
                    nameProvider: result,
                    amountInCart: amountInCart
                });
            }
        }
    });
}

exports.forgotPassword_post = function (req, res) {
    //tim email trong danh sach user
    User.findOne({ 'email': req.body.email })
        .exec(function (err, user) {
            if (err) {
                return console.log(err);
            }
            if (user == null) {
                req.flash('error', 'Email không tồn tài.');
                return res.redirect('/quen-mat/khau');
            }
            console.log(user);

            Account.findOne({ 'user': user })
                .exec(function (err, result) {
                    var secretToken = result.secretToken;
                    console.log(secretToken);
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
                            req.flash('success_msg', 'Gửi mã bí mật thành công,hãy kiễm tra mail của bạn!');
                            res.redirect('/verify-changepass');
                        }
                    });
                })
        })
}

//xac nhan ma bi mat khi quen mat khau
exports.verifyAndChangePass_get = function(req, res) {
    var flashMessages = res.locals.getMessages();
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;

    Provider.find({}) 
    .exec(function(err, result) {
        if(err) {
            return console.log(err);
        }    

        if (flashMessages.error) {
            return res.render('./client/verifyAndChangePass', {
                layout: 'layoutClient.hbs',
                signinActive: true,
                loginSuccess: false,
                nameProvider: result,
                showError: true,
                error_msg: flashMessages.error,
                amountInCart: amountInCart
            });
        } else {
            if (flashMessages.success_msg) {
                return res.render('./client/verifyAndChangePass', {
                    layout: 'layoutClient.hbs',
                    signinActive: true,
                    loginSuccess: false,
                    nameProvider: result,
                    showSuccess: true,
                    success_msg: flashMessages.success_msg,
                    amountInCart: amountInCart
                });
            } else {
                return res.render('./client/verifyAndChangePass', {
                    layout: 'layoutClient.hbs',
                    signinActive: true,
                    loginSuccess: false,
                    nameProvider: result,
                    amountInCart: amountInCart
                });
            }
        }
    })
}

exports.verifyAndChangePass_post = async (req, res, next) => {
    try {
        const { secretToken } = req.body;
        const account = await Account.findOneAndUpdate({ 'secretToken': secretToken }, {
            status: 'Active'
        });

        if (account == null) {
            req.flash('error', 'Mã bí mật không đúng hãy kiễm tra lại');
            return res.redirect('/verify-changepass');
        }

        var newPassword = req.body.newPassword;
        var confirmPassword = req.body.confirmNewPassword;
        if(newPassword == confirmPassword) {
            console.log(account);
            account.changePasswordNotCheckOldPass(newPassword, function(err) {
                if (err) {
                    console.log(err);
                    req.flash('error', 'Mật khẩu cũ không đúng! Hãy thử lại!');
                    return res.redirect('/verify-changepass');
                }
                console.log('success');
                req.flash('success_msg', 'Kích hoạt thành công, bạn có thể đăng nhập để sử dụng');
                return res.redirect('/');
            })
        } else {
            req.flash('error', 'Mật khẩu không với với nhau, kiễm tra lại!');
            return res.redirect('/verify-changepass');
        }
    } catch (error) {
        return console.log(error);
    }
}

//thong tin ca nhan
exports.profile_get = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;

    if (req.isAuthenticated()) {
        var username = req.user.username;

        async.parallel({
            providers: function(callback) {
                Provider.find({})
                .exec(callback);
            },
            user: function(callback) {
                User.findById(req.user.user)
                .exec(callback);
            }
        }, function(err, result) {
            if (err) {
                console.log(err);
                return;
            }
            var flashMessages = res.locals.getMessages();

            if (flashMessages.error) {
                return res.render('./client/profile', {
                    layout: 'layoutClient.hbs',
                    personalActive: true,
                    loginSuccess: true,
                    img: result.user.imgDisplay,
                    fullname: result.user.fullname,
                    username: username,
                    email: result.user.email,
                    tel: result.user.tel,
                    address: result.user.address,
                    id: result.user._id,
                    nameProvider: result.providers,
                    showError: true,
                    error_msg: flashMessages.error,
                    amountInCart: amountInCart
                });
            } else {
                if (flashMessages.success_msg) {
                    return res.render('./client/profile', {
                        layout: 'layoutClient.hbs',
                        personalActive: true,
                        loginSuccess: true,
                        img: result.user.imgDisplay,
                        fullname: result.user.fullname,
                        username: username,
                        email: result.user.email,
                        tel: result.user.tel,
                        address: result.user.address,
                        id: result.user._id,
                        nameProvider: result.providers,
                        showSuccess: true,
                        success_msg: flashMessages.success_msg,
                        amountInCart: amountInCart
                    });
                } else {
                    return res.render('./client/profile', {
                        layout: 'layoutClient.hbs',
                        personalActive: true,
                        loginSuccess: true,
                        img: result.user.imgDisplay,
                        fullname: result.user.fullname,
                        username: username,
                        email: result.user.email,
                        tel: result.user.tel,
                        address: result.user.address,
                        nameProvider: result.providers,
                        id: result.user._id,
                        amountInCart: amountInCart
                    });
                }
            }
        });
    } else {
        req.flash('error', 'Phải đăng nhập để được truy cập!');
        return res.redirect('/');
    }
}
//chinh sua thong tin ca nhna
exports.editProfile_post = function (req, res) {
    Image.Upload(req, res, (err) => {
        if (err) {
            console.log(err);
            req.flash('error', err);
            return res.redirect('/');
        } else {
            if (req.file == undefined) {
                console.log(req.body.tel);
                var userID = req.user.user;
                async.series({
                    user: function (callback) {
                        User.findById(userID)
                            .exec(callback);
                    },
                    updateUser: function (callback) {
                        User.findOneAndUpdate({ '_id': userID }, {
                            fullname: req.body.fullname,
                            email: req.body.email,
                            tel: req.body.tel,
                            address: req.body.address
                        }).exec(callback);
                    }
                }, function (err, result) {
                    if (err) {
                        console.log(err);
                        req.flash('error', err);
                        return res.redirect('/ca-nhan');
                    }
                    //success
                    req.flash('success_msg', 'Chỉnh sửa thông tin thành công');
                    res.redirect('/ca-nhan');
                })
            } else {
                var userID = req.user.user;
                var imgDisplay = '../../../uploads/' + req.file.filename;
                var imgDelete = './public/uploads/' + req.file.filename;

                async.series({
                    user: function (callback) {
                        User.findById(userID)
                            .exec(callback);
                    },
                    updateUser: function (callback) {
                        User.findOneAndUpdate({ '_id': userID }, {
                            fullname: req.body.fullname,
                            imgDisplay: imgDisplay,
                            imgDelete: imgDelete,
                            email: req.body.email,
                            tel: req.body.tel,
                            address: req.body.address
                        }).exec(callback);
                    }
                }, function (err, result) {
                    if (err) {
                        console.log(err);
                        Image.Delete(imgDelete);
                        req.flash('error', err);
                        return res.redirect('/ca-nhan');
                    }
                    //success
                    //delete old image
                    Image.Delete(result.user.imgDelete);
                    req.flash('success_msg', 'Chỉnh sửa thông tin thành công');
                    res.redirect('/ca-nhan');
                })
            }
        }
    })
    //res.send('abc');
}

exports.changPassword_post = function (req, res) {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Hãy đăng nhập.');
    }

    if (req.body.newPassword == req.body.confirmNewPassword) {
        Account.findById(req.user._id)
            .exec(function (err, user) {
                user.changePassword(req.body.oldPassword, req.body.newPassword, function (err) {
                    if (err) {
                        console.log(err);
                        req.flash('error', 'Mật khẩu cũ không đúng! Hãy thử lại!');
                        return res.redirect('/ca-nhan');
                    }
                    console.log('success');
                    req.flash('success_msg', 'Đổi mật khẩu thành công');
                    return res.redirect('/ca-nhan');
                })
            })
    } else {
        req.flash('error', 'Mật khẩu xác thực không đúng.');
        return res.redirect('/ca-nhan');
    }
}

//loc dien thoai theo nha cung cap
exports.listMobile_provider = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;

    async.parallel({
        provider: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        mobile: function (callback) {
            Mobile.find({ 'provider': req.params.id })
                .populate('provider')
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        var listProvider = result.provider;
        var name = result.mobile[0].provider.name;
        var amount = result.mobile.length;

        Specification.find({ 'mobileID': result.mobile })
            .populate('mobileID')
            .exec(function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log(result);
                if (req.isAuthenticated()) {
                    return res.render('./client/listMobile_Provider', {
                        layout: 'layoutClient.hbs',
                        mobileActive: true,
                        loginSuccess: true,
                        nameProvider: listProvider,
                        name: name,
                        amount: amount,
                        mobile: result,
                        amountInCart: amountInCart
                    })
                } else {
                    return res.render('./client/listMobile_Provider', {
                        layout: 'layoutClient.hbs',
                        mobileActive: true,
                        loginSuccess: false,
                        nameProvider: listProvider,
                        name: name,
                        amount: amount,
                        mobile: result,
                        amountInCart: amountInCart
                    });
                }
            });

    });
}
//danh sach toan bo san pham
exports.listMobile = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;

    async.parallel({
        provider: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        specification: function (callback) {
            Specification.find({})
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        if (req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'TẤT CẢ ĐIỆN THOẠI',
                amount: result.specification.length,
                mobile: result.specification,
                amountInCart: amountInCart
            })
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'TẤT CẢ ĐIỆN THOẠI',
                amount: result.specification.length,
                mobile: result.specification,
                amountInCart: amountInCart
            })
        }
    })
}

//sản phẩm có giá dưới 1 triệu
exports.listMobile_duoi1 = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;

    async.parallel({
        provider: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        specification: function (callback) {
            Specification.find({})
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for (var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if (price < 1000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if (req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI DƯỚI 1 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI DƯỚI 1 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        }
    });
}

//sản phẩm có giá từ 1 - 3 triệu
exports.listMobile_tu1den3 = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    async.parallel({
        provider: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        specification: function (callback) {
            Specification.find({})
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for (var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if (price >= 1000000 && price < 3000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if (req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 1 ĐẾN 3 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 1 ĐẾN 3 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        }
    });
}
//sản phẩm có giá từ 3 - 6 triệu
exports.listMobile_tu3den6 = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    async.parallel({
        provider: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        specification: function (callback) {
            Specification.find({})
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for (var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if (price >= 3000000 && price < 6000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if (req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 3 ĐẾN 6 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 3 ĐẾN 6 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        }
    });
}
//sản phảm có giá từ 6 đến 10 triệu
exports.listMobile_tu6den10 = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    async.parallel({
        provider: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        specification: function (callback) {
            Specification.find({})
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for (var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if (price >= 6000000 && price < 10000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if (req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 6 ĐẾN 10 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 6 ĐẾN 10 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        }
    });
}
//sản phẩm có giá từ 10 đến 15 triệu
exports.listMobile_tu10den15 = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    async.parallel({
        provider: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        specification: function (callback) {
            Specification.find({})
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for (var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if (price >= 10000000 && price < 15000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if (req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 10 ĐẾN 15 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 10 ĐẾN 15 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        }
    });
}
exports.listMobile_tren15 = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    async.parallel({
        provider: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        specification: function (callback) {
            Specification.find({})
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for (var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if (price >= 15000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if (req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TRÊN 15 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TRÊN 15 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile,
                amountInCart: amountInCart
            });
        }
    });
}

exports.mobileDetail = function (req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    async.parallel({
        providers: function (callback) {
            Provider.find({})
                .exec(callback);
        },
        comments: function (callback) {
            Comment.find({ 'mobileID': req.params.id })
                .populate('info')
                .populate('mobileID')
                .exec(callback);
        },
        mobile: function (callback) {
            Mobile.findById(req.params.id)
                .populate('provider')
                .exec(callback);
        },
        specifications: function (callback) {
            Specification.find({ 'mobileID': req.params.id })
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }

        var comments = result.comments;
        var providers = result.providers;
        var specifications = result.specifications;
        var mobile = result.mobile;

        Mobile.find({ 'provider': mobile.provider })
            .exec(function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                Specification.find({ 'mobileID': result })
                    .populate('mobileID')
                    .exec(function (err, result) {
                        if (err) {
                            console.log(err);
                            return;
                        }

                        var flashMessages = res.locals.getMessages()
                        if (flashMessages.error) {
                            if (req.isAuthenticated()) {
                                return res.render('./client/mobileDetail', {
                                    layout: 'layoutClient.hbs',
                                    mobileActive: true,
                                    loginSuccess: true,
                                    nameProvider: providers,
                                    mobileName: mobile.mobileName,
                                    img1: specifications[0].imgDisplay[0],
                                    img2: specifications[0].imgDisplay[1],
                                    img3: specifications[0].imgDisplay[2],
                                    price: mobile.salePrice,
                                    id: mobile._id,
                                    screen: specifications[0].screen,
                                    operator: specifications[0].operationsystem,
                                    frontCamera: specifications[0].camerafont,
                                    behindCamera: specifications[0].camerabehind,
                                    cpu: specifications[0].cpu,
                                    ram: specifications[0].ram,
                                    memories: specifications[0].memories,
                                    memorycard: specifications[0].memorycard,
                                    sim: specifications[0].sim,
                                    mobile: result,
                                    comments: comments,
                                    showError: true,
                                    error_msg: flashMessages.error,
                                    amountInCart: amountInCart
                                });
                            } else {
                                return res.render('./client/mobileDetail', {
                                    layout: 'layoutClient.hbs',
                                    mobileActive: true,
                                    loginSuccess: false,
                                    nameProvider: providers,
                                    mobileName: mobile.mobileName,
                                    img1: specifications[0].imgDisplay[0],
                                    img2: specifications[0].imgDisplay[1],
                                    img3: specifications[0].imgDisplay[2],
                                    price: mobile.salePrice,
                                    id: mobile._id,
                                    screen: specifications[0].screen,
                                    operator: specifications[0].operationsystem,
                                    frontCamera: specifications[0].camerafont,
                                    behindCamera: specifications[0].camerabehind,
                                    cpu: specifications[0].cpu,
                                    ram: specifications[0].ram,
                                    memories: specifications[0].memories,
                                    memorycard: specifications[0].memorycard,
                                    sim: specifications[0].sim,
                                    mobile: result,
                                    comments: comments,
                                    showError: true,
                                    error_msg: flashMessages.error,
                                    amountInCart: amountInCart
                                });
                            }
                        } else {
                            if (flashMessages.success_msg) {
                                if (req.isAuthenticated()) {
                                    return res.render('./client/mobileDetail', {
                                        layout: 'layoutClient.hbs',
                                        mobileActive: true,
                                        loginSuccess: true,
                                        nameProvider: providers,
                                        mobileName: mobile.mobileName,
                                        img1: specifications[0].imgDisplay[0],
                                        img2: specifications[0].imgDisplay[1],
                                        img3: specifications[0].imgDisplay[2],
                                        price: mobile.salePrice,
                                        id: mobile._id,
                                        screen: specifications[0].screen,
                                        operator: specifications[0].operationsystem,
                                        frontCamera: specifications[0].camerafont,
                                        behindCamera: specifications[0].camerabehind,
                                        cpu: specifications[0].cpu,
                                        ram: specifications[0].ram,
                                        memories: specifications[0].memories,
                                        memorycard: specifications[0].memorycard,
                                        sim: specifications[0].sim,
                                        mobile: result,
                                        comments: comments,
                                        showSuccess: true,
                                        success_msg: flashMessages.success_msg,
                                        amountInCart: amountInCart
                                    });
                                } else {
                                    return res.render('./client/mobileDetail', {
                                        layout: 'layoutClient.hbs',
                                        mobileActive: true,
                                        loginSuccess: false,
                                        nameProvider: providers,
                                        mobileName: mobile.mobileName,
                                        img1: specifications[0].imgDisplay[0],
                                        img2: specifications[0].imgDisplay[1],
                                        img3: specifications[0].imgDisplay[2],
                                        price: mobile.salePrice,
                                        id: mobile._id,
                                        screen: specifications[0].screen,
                                        operator: specifications[0].operationsystem,
                                        frontCamera: specifications[0].camerafont,
                                        behindCamera: specifications[0].camerabehind,
                                        cpu: specifications[0].cpu,
                                        ram: specifications[0].ram,
                                        memories: specifications[0].memories,
                                        memorycard: specifications[0].memorycard,
                                        sim: specifications[0].sim,
                                        mobile: result,
                                        comments: comments,
                                        showSuccess: true,
                                        success_msg: flashMessages.success_msg,
                                        amountInCart: amountInCart
                                    });
                                }
                            } else {
                                if (req.isAuthenticated()) {
                                    return res.render('./client/mobileDetail', {
                                        layout: 'layoutClient.hbs',
                                        mobileActive: true,
                                        loginSuccess: true,
                                        nameProvider: providers,
                                        mobileName: mobile.mobileName,
                                        img1: specifications[0].imgDisplay[0],
                                        img2: specifications[0].imgDisplay[1],
                                        img3: specifications[0].imgDisplay[2],
                                        price: mobile.salePrice,
                                        id: mobile._id,
                                        screen: specifications[0].screen,
                                        operator: specifications[0].operationsystem,
                                        frontCamera: specifications[0].camerafont,
                                        behindCamera: specifications[0].camerabehind,
                                        cpu: specifications[0].cpu,
                                        ram: specifications[0].ram,
                                        memories: specifications[0].memories,
                                        memorycard: specifications[0].memorycard,
                                        sim: specifications[0].sim,
                                        mobile: result,
                                        comments: comments,
                                        amountInCart: amountInCart
                                    });
                                } else {
                                    return res.render('./client/mobileDetail', {
                                        layout: 'layoutClient.hbs',
                                        mobileActive: true,
                                        loginSuccess: false,
                                        nameProvider: providers,
                                        mobileName: mobile.mobileName,
                                        img1: specifications[0].imgDisplay[0],
                                        img2: specifications[0].imgDisplay[1],
                                        img3: specifications[0].imgDisplay[2],
                                        price: mobile.salePrice,
                                        id: mobile._id,
                                        screen: specifications[0].screen,
                                        operator: specifications[0].operationsystem,
                                        frontCamera: specifications[0].camerafont,
                                        behindCamera: specifications[0].camerabehind,
                                        cpu: specifications[0].cpu,
                                        ram: specifications[0].ram,
                                        memories: specifications[0].memories,
                                        memorycard: specifications[0].memorycard,
                                        sim: specifications[0].sim,
                                        mobile: result,
                                        comments: comments,
                                        amountInCart: amountInCart
                                    });
                                }
                            }
                        }
                    })
            })
    })
}

//binh luan
exports.comment_post = function (req, res) {
    if (req.isAuthenticated()) {
        var mobileID = req.params.id;
        var userID = req.user.user;
        var message = req.body.message;

        async.parallel({
            mobile: function (callback) {
                Mobile.findById(req.params.id)
                    .populate('provider')
                    .exec(callback);
            },
            user: function (callback) {
                User.findById(userID)
                    .exec(callback);
            }
        }, function (err, result) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(result);
            commentDetail = {
                mobileID: result.mobile,
                info: result.user,
                message: message,
                date: Date.now()
            }

            var newComment = new Comment(commentDetail);
            newComment.save(function (err, result) {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log('new comment: ' + result);
                res.redirect('/dien-thoai/' + req.params.id);
            })

        })
    } else {
        req.flash('error', 'Bạn chưa đăng nhập, hãy đăng nhập trước khi bình luận');
        return res.redirect('/dien-thoai/' + req.params.id);
    }
}

//tim kiem
exports.search_post = function (req, res) {
    var key = req.body.key;
    var mobileResults = [];
    var providerResults = [];
    var upperKey = key.toUpperCase();
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;

    async.parallel({
        specifications: function (callback) {
            Specification.find({})
                .populate('mobileID')
                .exec(callback)
        },
        providers: function (callback) {
            Provider.find({})
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }

        //tim kiem theo dien thoai
        for (var i = 0; i < result.specifications.length; i++) {
            var mobileName = result.specifications[i].mobileID.mobileName;
            console.log(mobileName);
            if (mobileName.search(upperKey) >= 0) {
                mobileResults.push(result.specifications[i]);
            }
        }

        //tim kiem theo nha cung cap
        for (var i = 0; i < result.providers.length; i++) {
            var name = result.providers[i].name;
            if (name.search(upperKey) >= 0) {
                providerResults.push(result.providers[i]);
            }
        }
        if (req.isAuthenticated()) {
            if (providerResults.length == 0 && mobileResults.length == 0) {
                res.render('./client/search', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: true,
                    amount: '0',
                    noresult: true,
                    nameProvider: result.providers,
                    amountInCart: amountInCart
                })
            } else {
                if (providerResults.length > 0) {
                    return res.render('./client/search', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: true,
                        amount: providerResults.length.toString(),
                        provider: true,
                        providers: providerResults,
                        nameProvider: result.providers,
                        amountInCart: amountInCart
                    });
                } else {
                    return res.render('./client/search', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: true,
                        amount: mobileResults.length.toString(),
                        mobile: true,
                        mobiles: mobileResults,
                        nameProvider: result.providers,
                        amountInCart: amountInCart
                    });
                }
            }
        } else {
            if (providerResults.length == 0 && mobileResults.length == 0) {
                res.render('./client/search', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: false,
                    amount: '0',
                    noresult: true,
                    nameProvider: result.providers,
                    amountInCart: amountInCart
                })
            } else {
                if (providerResults.length > 0) {
                    return res.render('./client/search', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: false,
                        amount: providerResults.length,
                        provider: true,
                        providers: providerResults,
                        nameProvider: result.providers,
                        amountInCart: amountInCart
                    });
                } else {
                    return res.render('./client/search', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: false,
                        amount: mobileResults.length,
                        mobile: true,
                        mobiles: mobileResults,
                        nameProvider: result.providers,
                        amountInCart: amountInCart
                    });
                }
            }
        }
    })
}

//gio hang
//them vao gio hang
exports.addToCartShopping_post = function(req, res) {
    var mobileID = req.params.id;
    var amount = req.body.amount;
    console.log(amount);
    console.log(mobileID);
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    async.parallel({
        mobile: function(callback) {
            Mobile.findById(mobileID)
            .populate('provider')
            .exec(callback);
        }, 
        specification: function(callback) {
            Specification.findOne({'mobileID': mobileID})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        var provider = result.mobile.provider.name;
        var img = result.specification.imgDisplay[0];
        cart.add(result.mobile, mobileID, amount, provider, img);
        req.session.cart = cart;
        res.redirect('/dien-thoai/' + req.params.id);
    })
}
//hien thi tho hang
exports.cartShopping_get = function(req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    
    var flashMessages = res.locals.getMessages();

    Provider.find({})
    .exec(function(err, result) {
        if(err) {
            return console.log(err);
        }
        var providers = result;
        if(req.isAuthenticated()) {
            User.findById(req.user.user)
            .exec(function(err, user) {
                if(err) {
                    console.log(err);
                    return;
                }
                if(flashMessages.success_msg) {
                    return res.render('./client/cart', {
                        layout: 'layoutClient.hbs',
                        cartActive: true,
                        loginSuccess: true,
                        amountInCart: amountInCart,
                        cartShopping: cart.items,
                        name: user.fullname,
                        address: user.address,
                        tel: user.tel,
                        showSuccess: true,
                        success_msg: flashMessages.success_msg,
                        nameProvider: providers
                    });
                } else {
                    if(flashMessages.error) {
                        return res.render('./client/cart', {
                            layout: 'layoutClient.hbs',
                            cartActive: true,
                            loginSuccess: true,
                            amountInCart: amountInCart,
                            cartShopping: cart.items,
                            name: user.fullname,
                            address: user.address,
                            tel: user.tel, 
                            showError: true,
                            error_msg: flashMessages.error,
                            nameProvider: providers
                        });
                    } else {
                        return res.render('./client/cart', {
                            layout: 'layoutClient.hbs',
                            cartActive: true,
                            loginSuccess: true,
                            amountInCart: amountInCart,
                            cartShopping: cart.items,
                            name: user.fullname,
                            address: user.address,
                            tel: user.tel,
                            nameProvider: providers
                        });
                    }
                }
            })  
        } else {
            if(flashMessages.error) {
                return res.render('./client/cart', {
                    layout: 'layoutClient.hbs',
                    cartActive: true,
                    amountInCart: amountInCart,
                    cartShopping: cart.items,
                    showError: true,
                    error_msg: flashMessages.error,
                    nameProvider: providers
                });
            } else {
                return res.render('./client/cart', {
                    layout: 'layoutClient.hbs',
                    cartActive: true,
                    amountInCart: amountInCart,
                    cartShopping: cart.items,
                    nameProvider: providers
                });
            }
        }
    })
}
//thanh toan gio hang
exports.cartShopping_post = function(req, res) {
    if(req.isAuthenticated()) {
        var cart = new Cart(req.session.cart ? req.session.cart : {});
        var name = req.body.name;
        var address = req.body.address;
        var tel = req.body.tel;

        var mobiles = [];
        var amounts = [];
        var items = cart.generateArray();

        for(var i = 0; i < items.length; i++) {
            mobiles.push(items[i].item);
            amounts.push(items[i].qty);

            if ((parseInt(items[i].item.sold) + parseInt(items[i].qty)) > parseInt(items[i].item.imported)) {
                console.log('khong du hang');
                req.flash('error', 'điện thoại ' + items[i].item.mobileName + ' hiện không đủ hàng trong kho, bạn chỉ có thể mua tối đa ' 
                + (parseInt(items[i].item.imported) - parseInt(items[i].item.sold)) + ' cái');
                return res.redirect('/gio-hang');
            }
        }

        saleDetail = {
            mobileSole: mobiles,
            mobileAmount: amounts,
            user: req.user,
            status: 'Chưa giao',
            date: Date.now(),
            nameReciever: name,
            telReciever: tel,
            addressReciever: address,
            totalPrice: cart.totalPrice
        }

        var newSale = new Sale(saleDetail);
        newSale.save(function(err, result) {
            if(err) {
                return console.log(err);
            }
            cart.removeAll();
            req.session.cart = null;

            for (var i in mobiles) {
                Mobile.findByIdAndUpdate(mobiles[i]._id, {
                    sold: parseInt(mobiles[i].sold) + parseInt(amounts[i])
                }).exec(function(err, result) {
                    if(err) {
                        return console.log(err);
                    }
                    console.log(result);
                });
            }

            req.flash('success_msg', 'Thanh toán thành công, hàng sẽ được giao trong vài ngày tới!');
            res.redirect('/gio-hang');
        })
    } else {
        req.flash('error', 'Đăng nhập để có thể thanh toán.');
        res.redirect('/gio-hang');
    }
}
//xoa hang trong gio
exports.deleteCart = function(req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.removeItem(req.params.id);
    req.session.cart = cart;
    res.redirect('/gio-hang');
}
//tang so luong hang trong gio tung 1 
exports.increaseByOne = function(req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.increaseByOne(req.params.id);
    req.session.cart = cart;
    res.redirect('/gio-hang');
}
//giam so luong hang trong gio tung 1
exports.decreaseByOne = function(req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.decreaseByOne(req.params.id);
    req.session.cart = cart;
    res.redirect('/gio-hang');
}

//lich su mua hang
exports.saleHistory_get = function(req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;
    var flashMessages = res.locals.getMessages();
    
    async.parallel({
        providers: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        sale: function(callback) {
            Sale.find({'user': req.user})
            .populate('user')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            return console.log(err);
        }
        if(flashMessages.error) {
            return res.render('./client/saleHistory', {
                layout: 'layoutClient.hbs',
                loginSuccess: true,
                personalActive: true,
                amountInCart: amountInCart,
                tables: result.sale, 
                nameProvider: result.providers,
                showError: flashMessages.error
            });
        } else {
            if(flashMessages.success_msg) {
                return res.render('./client/saleHistory', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: true,
                    personalActive: true,
                    amountInCart: amountInCart,
                    tables: result.sale, 
                    nameProvider: result.providers,
                    showSuccess: true,
                    success_msg: flashMessages.success_msg
                });
            } else {
                return res.render('./client/saleHistory', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: true,
                    personalActive: true,
                    amountInCart: amountInCart,
                    tables: result.sale, 
                    nameProvider: result.providers
                });
            }
        }
        
    });
}

//chi tiet do hang
exports.saleHistoryDetail_get = function(req, res) {
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    var amountInCart = cart.totalQty;

    async.parallel({
        sale: function (callback) {
            Sale.findById(req.params.id)
                .populate('user')
                .populate('mobileSole')
                .exec(callback);
        },
        providers: function (callback) {
            Provider.find({})
                .exec(callback);
        }
    }, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        var mobiles = result.sale.mobileSole;
        var amounts = result.sale.mobileAmount;
        var date = result.sale.date;
        var providers = [];
        var tables = [];

        for (var j = 0; j < mobiles.length; j++) {
            for (var i = 0; i < result.providers.length; i++) {
                if (toString(mobiles[j].provider) == toString(result.providers[i]._id)) {
                    providers.push(result.providers[i]);
                    break;
                }
            }
        }

        for(var i = 0; i < mobiles.length; i++) {
            var table = {
                mobiles: mobiles[i],
                provider: providers[i],
                amount: amounts[i]
            }

            tables.push(table);
        }

        console.log(tables);

        res.render('./client/saleHistoryDetail', {
            layout: 'layoutClient.hbs',
            personalActive: true,
            saleActive: true,
            loginSuccess: true,
            date: date,
            tables: tables,
            nameProvider: result.providers,
            amountInCart: amountInCart
        });
    });
}

//da nhan hang
exports.recievedMobile_get = function(req, res) {
    var id = req.params.id;

    Sale.findByIdAndUpdate(id, {
        status: 'Đã nhận'
    }).exec(function(err, result) {
        if(err) {
            return console.log(err);
        }
        console.log(result);
        req.flash('success_msg', 'Đơn hàng ' + result.date + ' đã nhận.');
        return res.redirect('/lich-su-mua-hang');
    });
}