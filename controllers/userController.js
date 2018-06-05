var User = require('../models/User');
var Comments = require('../models/Comment');
var Account = require('../models/Account');
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
    if (req.body == null) {
        return res.sendStatus(400);
    }
    userDetail = {
        fullname: req.body.nameTxt,
        email: req.body.emailTxt,
        tel: req.body.telTxt,
        address: req.body.addressTxt
    }

    var user = new User(userDetail);
    user.save(function(err, result) {
        if (err) {
            console.error(err);
            return;
        }
        console.log('new user: ' + result._id)

        res.render('admin/user/createUser', {
            userActive: true,
            loginSuccess: true,
            success: true
        });
    });
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
                email: result.email,
                tel: result.tel,
                address: result.address
            });
        });
    
}
//edit user post
exports.editUser_post = function(req, res) {
    if (req.body == null) {
        return sendStatus(404);
    }

    User.findByIdAndUpdate(req.params.id, {
        fullname: req.body.nameTxt,
        email: req.body.emailTxt,
        tel: req.body.telTxt,
        address: req.body.addressTxt
    }, function(err) {
        if (err) {
            return sendStatus(404);
        }

        res.render('./admin/user/editUser', {
            userActive: true,
            loginSuccess: true,
            fullname: req.body.nameTxt,
            email: req.body.emailTxt,
            tel: req.body.telTxt,
            address: req.body.addressTxt,
            success: true
        });
    })
}

//delete user
exports.deleteUser = function(req, res) {
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
                success: true 
            });
        });
    });

}