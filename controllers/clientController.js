//cmodel
var User = require('../models/User');
var Account = require('../models/Account');
var Mobile = require('../models/Mobile');
var Provider = require('../models/Provider');
var Specification = require('../models/Specifications');
var Comment = require('../models/Comment');

var passport = require("passport");
var async = require('async');
var Image = require('./configUploadImage');
const randomstring = require('randomstring');
var nodemailer = require('nodemailer');

exports.homeClient = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        specification: function(callback) {
            Specification.find({})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        var apple = [];
        var samsung = [];
        var idApple, idSamsung;
        //get id of provider apple and samsung
        for(var i = 0; i < result.provider.length; i++) {
            if(result.provider[i].name == 'APPLE')
                idApple = result.provider[i]._id;
            if(result.provider[i].name == 'SAMSUNG')
                idSamsung = result.provider[i]._id
        }
        //get 6 mobile of each provider
        for(var i = 0; i < result.specification.length; i++) {
            var idProvider = result.specification[i].mobileID.provider;
            if(idProvider.toString() == idApple.toString() && apple.length <= 6) {
                apple.push(result.specification[i])
            }
            if(idProvider.toString() == idSamsung.toString() && samsung.length <= 6) {
                samsung.push(result.specification[i])
            }
        }

        var flashMessages = res.locals.getMessages();
        if(flashMessages.error) {
            return res.render('./client/home', {
                layout: 'layoutClient.hbs',
                homeActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                apple: apple, 
                samsung: samsung, 
                provider: result.provider,
                showError: true,
                error_msg: flashMessages.error
            });
        } else{
            if(flashMessages.success_msg) {
                if(req.isAuthenticated()) {
                    return res.render('./client/home', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: true,
                        nameProvider: result.provider,
                        apple: apple, 
                        samsung: samsung, 
                        provider: result.provider,
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
                        showSuccess: true,
                        success_msg: flashMessages.success_msg
                    });
                }

                
            } else {
                if(req.isAuthenticated()) {
                    return res.render('./client/home', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: true,
                        nameProvider: result.provider,
                        apple: apple, 
                        samsung: samsung, 
                        provider: result.provider
                    });
                } else {
                    return res.render('./client/home', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: false,
                        nameProvider: result.provider,
                        apple: apple, 
                        samsung: samsung, 
                        provider: result.provider
                    });
                }
            }
        }
    })
}

exports.login_post = function(req, res) {
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

exports.logout = function(req, res) {
    req.logout();

    req.flash('success_msg', 'Đăng Xuất Thành Công.');
    var flashMessages = res.locals.getMessages();

    res.redirect('/');
}

exports.register_get = function(req, res) {
    var flashMessages = res.locals.getMessages();
    if(flashMessages.error) {
        return res.render('./client/register', {
            layout: 'layoutClient.hbs',
            loginSuccess: false,
            registerActive: true,
            showError: true,
            error_msg: flashMessages.error
        });
    } else {
        if(flashMessages.success_msg) {
            return res.render('./client/register', {
                layout: 'layoutClient.hbs',
                loginSuccess: false,
                registerActive: true,
                showSuccess: true,
                success_msg: flashMessages.success_msg
            });
        } else {
            res.render('./client/register', {
                layout: 'layoutClient.hbs',
                loginSuccess: false,
                registerActive: true
            });
        }
    }
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

exports.verifyEmail_get = function(req, res) {
    var flashMessages = res.locals.getMessages();
    if (flashMessages.error) {
       return res.render('./client/verify', {
        layout: 'layoutClient.hbs',
        loginSuccess: false, 
        registerActive: true,
        showError: true,
        error_msg: flashMessages.error
    });
    } else {
        if(flashMessages.success_msg) {
            return res.render('./client/verify', {
                layout: 'layoutClient.hbs',
                loginSuccess: false, 
                registerActive: true,
                showSuccess: true,
                success_msg: flashMessages.success_msg
            });
        } else {
            return res.render('./client/verify', {
                layout: 'layoutClient.hbs',
                loginSuccess: false, 
                registerActive: true
            });
        }
    }
}

exports.verifyEmail_post = async(req, res, next) => {
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

exports.profile = function(req, res) {
    if (req.isAuthenticated()) {
        var username = req.user.username;
        User.findById(req.user.user)
        .exec(function(err, result) {
            if(err) {
                console.log(err);
                return;
            }
            var flashMessages = res.locals.getMessages();

            if(flashMessages.error) {
                return res.render('./client/profile', {
                    layout: 'layoutClient.hbs',
                    personalActive: true,
                    loginSuccess: true,
                    img: result.imgDisplay,
                    fullname: result.fullname,
                    username: username,
                    email: result.email,
                    tel: result.tel,
                    address: result.address,
                    id: result._id,
                    showError: true,
                    error_msg: flashMessages.error
                });
            } else {
                if(flashMessages.success_msg) {
                    return res.render('./client/profile', {
                        layout: 'layoutClient.hbs',
                        personalActive: true,
                        loginSuccess: true,
                        img: result.imgDisplay,
                        fullname: result.fullname,
                        username: username,
                        email: result.email,
                        tel: result.tel,
                        address: result.address,
                        id: result._id, 
                        showSuccess: true,
                        success_msg: flashMessages.success_msg
                    });
                } else {
                    return res.render('./client/profile', {
                        layout: 'layoutClient.hbs',
                        personalActive: true,
                        loginSuccess: true,
                        img: result.imgDisplay,
                        fullname: result.fullname,
                        username: username,
                        email: result.email,
                        tel: result.tel,
                        address: result.address,
                        id: result._id
                    });
                }
            }
            
        })
    } else {
        req.flash('error', 'Phải đăng nhập để được truy cập!');
        return res.redirect('/');
    }
}

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

exports.changPassword_post = function(req, res) {
    if(!req.isAuthenticated()) {
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

exports.listMobile_provider = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        mobile: function(callback) {
            Mobile.find({'provider': req.params.id}) 
            .populate('provider')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        var listProvider = result.provider;
        var name = result.mobile[0].provider.name;
        var amount = result.mobile.length;

        Specification.find({'mobileID': result.mobile})
        .populate('mobileID')
        .exec(function(err, result) {
            if(err) {
                console.log(err);
                return;
            }
            console.log(result);
            if(req.isAuthenticated()) {
                return res.render('./client/listMobile_Provider', {
                    layout: 'layoutClient.hbs',
                    mobileActive: true,
                    loginSuccess: true,
                    nameProvider: listProvider,
                    name: name,
                    amount: amount,
                    mobile: result
                })
            } else {
                return res.render('./client/listMobile_Provider', {
                    layout: 'layoutClient.hbs',
                    mobileActive: true,
                    loginSuccess: false,
                    nameProvider: listProvider,
                    name: name,
                    amount: amount,
                    mobile: result
                })
            }
        });
        
    });
}

exports.listMobile = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        specification: function(callback) {
            Specification.find({})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        if(req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'TẤT CẢ ĐIỆN THOẠI',
                amount: result.specification.length,
                mobile: result.specification
            })
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'TẤT CẢ ĐIỆN THOẠI',
                amount: result.specification.length,
                mobile: result.specification
            })
        }
    })
}

//sản phẩm có giá dưới 1 triệu
exports.listMobile_duoi1 = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        specification: function(callback) {
            Specification.find({})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for( var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if(price < 1000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if(req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI DƯỚI 1 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI DƯỚI 1 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        }
    });
}

//sản phẩm có giá từ 1 - 3 triệu
exports.listMobile_tu1den3 = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        specification: function(callback) {
            Specification.find({})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for( var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if(price >= 1000000 && price < 3000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if(req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 1 ĐẾN 3 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 1 ĐẾN 3 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        }
    });
}
//sản phẩm có giá từ 3 - 6 triệu
exports.listMobile_tu3den6 = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        specification: function(callback) {
            Specification.find({})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for( var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if(price >= 3000000 && price < 6000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if(req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 3 ĐẾN 6 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 3 ĐẾN 6 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        }
    });
}
//sản phảm có giá từ 6 đến 10 triệu
exports.listMobile_tu6den10 = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        specification: function(callback) {
            Specification.find({})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for( var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if(price >= 6000000 && price < 10000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if(req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 6 ĐẾN 10 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 6 ĐẾN 10 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        }
    });
}
//sản phẩm có giá từ 10 đến 15 triệu
exports.listMobile_tu10den15 = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        specification: function(callback) {
            Specification.find({})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for( var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if(price >= 10000000 && price < 15000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if(req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 10 ĐẾN 15 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TỪ 10 ĐẾN 15 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        }
    });
}
exports.listMobile_tren15 = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        specification: function(callback) {
            Specification.find({})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        var listMobile = []
        for( var i = 0; i < result.specification.length; i++) {
            var price = parseInt(result.specification[i].mobileID.salePrice);
            if(price >= 15000000) {
                listMobile.push(result.specification[i]);
            }
        }

        if(req.isAuthenticated()) {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: true,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TRÊN 15 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        } else {
            return res.render('./client/listMobile_Provider', {
                layout: 'layoutClient.hbs',
                mobileActive: true,
                loginSuccess: false,
                nameProvider: result.provider,
                name: 'ĐIỆN THOẠI TRÊN 15 TRIỆU',
                amount: listMobile.length,
                mobile: listMobile
            });
        }
    });
}

exports.mobileDetail = function(req, res) {

    async.parallel({
        providers: function(callback) {
            Provider.find({})
            .exec(callback);
        },
        comments: function(callback) {
            Comment.find({'mobileID': req.params.id})
            .populate('info')
            .populate('mobileID')
            .exec(callback);
        },
        mobile: function(callback) {
            Mobile.findById(req.params.id)
            .populate('provider')
            .exec(callback);
        },
        specifications: function(callback) {
            Specification.find({'mobileID': req.params.id})
            .populate('mobileID')
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }
        
        var comments = result.comments;
        var providers = result.providers;
        var specifications = result.specifications;
        var mobile = result.mobile;

        Mobile.find({'provider': mobile.provider})
        .exec(function(err, result) {
            if(err) {
                console.log(err);
                return;
            }
            Specification.find({'mobileID': result})
            .populate('mobileID')
            .exec(function(err, result) {
                if(err) {
                    console.log(err);
                    return;
                }

                var flashMessages = res.locals.getMessages()
                if(flashMessages.error) {
                    if(req.isAuthenticated()) {
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
                            error_msg: flashMessages.error
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
                            error_msg: flashMessages.error
                        });
                    }
                } else {
                    if (flashMessages.success_msg) {
                        if(req.isAuthenticated()) {
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
                                success_msg: flashMessages.success_msg
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
                                success_msg: flashMessages.success_msg
                            });
                        }
                    } else {
                        if(req.isAuthenticated()) {
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
                                comments: comments
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
                                comments: comments
                            });
                        }
                    }
                }
            })
        })
    })
}

//binh luan
exports.comment_post = function(req, res) {
    if(req.isAuthenticated()) {
        var mobileID = req.params.id;
        var userID = req.user.user;
        var message = req.body.message;

        async.parallel({
            mobile: function(callback) {
                Mobile.findById(req.params.id)
                .populate('provider')
                .exec(callback);
            }, 
            user: function(callback) {
                User.findById(userID)
                .exec(callback);
            }
        }, function(err, result) {
            if(err) {
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
            newComment.save(function(err, result) {
                if(err) {
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
exports.search_post = function(req, res) {
    var key = req.body.key;
    var mobileResults = [];
    var providerResults = [];
    var upperKey = key.toUpperCase();

    async.parallel({
        specifications: function(callback) {
            Specification.find({})
            .populate('mobileID')
            .exec(callback)
        },
        providers: function(callback) {
            Provider.find({})
            .exec(callback);
        }
    }, function(err, result) {
        if(err) {
            console.log(err);
            return;
        }

        //tim kiem theo dien thoai
        for(var i = 0; i < result.specifications.length; i++) {
            var mobileName = result.specifications[i].mobileID.mobileName;
            console.log(mobileName);
            if(mobileName.search(upperKey) >= 0) {
                mobileResults.push(result.specifications[i]);
            }
        }

        //tim kiem theo nha cung cap
        for(var i = 0; i < result.providers.length; i++) {
            var name = result.providers[i].name;
            if(name.search(upperKey) >= 0) {
                providerResults.push(result.providers[i]);
            }
        }
        if(req.isAuthenticated()) {
            if(providerResults.length == 0 && mobileResults.length == 0) {
                res.render('./client/search', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: true,
                    amount: '0',
                    noresult: true
                })
            } else {
                if(providerResults.length > 0) {
                    return res.render('./client/search', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: true,
                        amount: providerResults.length.toString(),
                        provider: true,
                        providers: providerResults
                    });
                } else {
                    return res.render('./client/search', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: true,
                        amount: mobileResults.length.toString(),
                        mobile: true,
                        mobiles: mobileResults
                    });
                }
            }
        } else {
            if(providerResults.length == 0 && mobileResults.length == 0) {
                res.render('./client/search', {
                    layout: 'layoutClient.hbs',
                    loginSuccess: false,
                    amount: '0',
                    noresult: true
                })
            } else {
                if(providerResults.length > 0) {
                    return res.render('./client/search', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: false,
                        amount: providerResults.length,
                        provider: true,
                        providers: providerResults
                    });
                } else {
                    return res.render('./client/search', {
                        layout: 'layoutClient.hbs',
                        homeActive: true,
                        loginSuccess: false,
                        amount: mobileResults.length,
                        mobile: true,
                        mobiles: mobileResults
                    });
                }
            }
        }
    })
}