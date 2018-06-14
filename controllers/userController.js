var User = require('../models/User');
var Comments = require('../models/Comment');
var Account = require('../models/Account');
var Image = require('./configUploadImage');
var async = require('async');


exports.listUser = function(req, res) {
    User.find({})
        .exec(function(err, results, next) {
            if (err){
                return next(err);
            }
            res.render('./admin/user/user', { 
                userActive: true, 
                loginSuccess: true,
                tables: results 
            });
        });
}

//create new user get

exports.newUser_get = function(req, res) {
    res.render('admin/user/createUser', {
        loginSuccess: true,
        userActive: true
    });
}
//create new user post
exports.newUser_post = function(req, res) {
    Image.Upload(req, res, (err) => {
        if (err) {
            req.flash('error_msg', 'Ảnh tải lên thất bại!');
            var errors = res.locals.getMessages();
            console.log(errors);
            return res.render('./admin/user/createUser', {
                userActive: true,
                loginSuccess: true,
                showError: true,
                error: errors.error_msg
            });
        } else {
            if (req.file == undefined) {
                req.flash('error_msg', 'Chưa có ảnh được chọn!');
                var errors = res.locals.getMessages();
                console.log(errors);
                return res.render('./admin/user/createUser', {
                    userActive: true,
                    loginSuccess: true,
                    showError: true,
                    error: errors.error_msg
                });
            } else {
                //kiem tra da dien day du thong tin chua.
                var fullname = req.body.fullname;
                var email = req.body.email;
                var tel = req.body.tel;
                var address = req.body.address;

                req.checkBody('fullname', 'Full name is required!').notEmpty();
                req.checkBody('email', 'Email is required!').notEmpty();
                req.checkBody('tel', 'Phone number is required!').notEmpty();
                req.checkBody('address', 'Address is required!').notEmpty();

                var errors = req.validationErrors();

                if (errors) {
                    var path = './public/uploads/' + req.file.filename;
                    Image.Delete(path);
                    console.log(errors);
                    return res.render('./admin/user/createUser', {
                        userActive: true,
                        loginSuccess: true,
                        showError: false,
                        errors: errors
                    });
                } else {
                    console.log('NO');
                }

                userDetail = {
                    fullname: req.body.fullname,
                    imgDisplay: '../../../uploads/' + req.file.filename,
                    imgDelete: './public/uploads/' + req.file.filename,
                    email: req.body.email,
                    tel: req.body.tel,
                    address: req.body.address
                }
            
                var user = new User(userDetail);
                user.save(function(err, result) {
                    if (err) {
                        var path = './public/uploads/' + req.file.filename;
                        Image.Delete(path);
                        console.error(err);
                        return;
                    }
                    console.log('new user: ' + result._id)

                    res.render('admin/user/createUser', {
                        userActive: true,
                        loginSuccess: true,
                        showSuccess: true,
                        msg: 'Thêm người dùng mới thành công!'
                    });
                });
            }
        }
    })
}

//edit user
exports.editUser_get = function(req, res) {

    User.findById(req.params.id)
        .exec(function(err, result, next) {
            if(err) {
                console.log('error');
                return next(err);
            }
            console.log(result);
            res.render('./admin/user/editUser', {
                userActive: true,
                loginSuccess: true,
                fullname: result.fullname,
                img: result.imgDisplay,
                email: result.email,
                tel: result.tel,
                address: result.address
            });
        });
    
}
//edit user post
exports.editUser_post = function(req, res) {
    //upload new image
    Image.Upload(req, res, (err) => {
        if (err) {
            req.flash('error_msg', 'Ảnh tải lên thất bại!');
            var errors = res.locals.getMessages();
            console.log(errors);
            return res.render('./admin/user/editUser', {
                userActive: true,
                loginSuccess: true,
                showError: true,
                error: errors.error_msg
            });
        } else {
            if (req.file == undefined) {
                req.flash('error_msg', 'Chưa có ảnh được chọn!');
                var errors = res.locals.getMessages();
                console.log(errors);
                return res.render('./admin/user/editUser', {
                    userActive: true,
                    loginSuccess: true,
                    showError: true,
                    error: errors.error_msg
                });
            } else {
                //delete old image
                User.findById(req.params.id)
                .exec(function(err, result) {
                    var path = result.imgDelete;
                    Image.Delete(path, (err) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
    
                        console.log("delete successfully");
                        if (req.body == null) {
                            return sendStatus(404);
                        }
                    
                        User.findByIdAndUpdate(req.params.id, {
                            fullname: req.body.fullname,
                            imgDisplay: '../../../uploads/' + req.file.filename,
                            imgDelete: './public/uploads/' + req.file.filename,
                            email: req.body.email,
                            tel: req.body.tel,
                            address: req.body.address
                        }, function(err) {
                            if (err) {
                                return sendStatus(404);
                            }
                    
                            return res.render('./admin/user/editUser', {
                                userActive: true,
                                loginSuccess: true,
                                fullname: req.body.nameTxt,
                                email: req.body.emailTxt,
                                tel: req.body.telTxt,
                                address: req.body.addressTxt,
                                showSuccess: true,
                                success_msg: 'Chỉnh sửa thành công!'
                            });
                        })
                    });
                });
            }
        }
    })
}
//delete user
exports.deleteUser = function(req, res) {
    //delete Image
    User.findById(req.params.id)
    .exec(function(err, result) {
        var path = result.imgDelete;
        Image.Delete(path, (err) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log("Delete successfully");
            async.parallel({
                user: function(callback) {
                    User.findByIdAndRemove(req.params.id)
                    .exec(callback);
                },
                comment: function(callback) {
                    Comments.remove({'info': req.params.id})
                    .exec(callback);
                },
                account: function(callback) {
                    Account.remove({'user': req.params.id})
                    .exec(callback);
                }
            }, function(err, result, next) {
                if(err) { return next(err); }
        
                User.find({})
                .exec(function(err1, results, next) {
                    if (err){
                        return next(err1);
                    }
                    res.render('./admin/user/user', { 
                        userActive: true, 
                        loginSuccess: true,
                        tables: results,
                        showSuccess: true,
                        success_msg: 'Xóa thành công'
                    });
                });
            });
        })
    })
}