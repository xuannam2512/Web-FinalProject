var Provider = require('../models/Provider');
var Mobile = require('../models/Mobile');
var async = require('async');

exports.listProvider = function(req, res) {
    console.log('here');
    Provider.find({})
        .exec(function(err, results) {
            if(err) {
                console.error(err);
                return;
            }
            console.log(results);
            res.render('./adminview/provider', { 
                providerActive: true, 
                loginSuccess: true,
                tables: results
            });
        });
}

exports.providerDetail = function(req, res) {
    async.parallel({
        provider: function(callback) {
            Provider.findById(req.params.id)
                .exec(callback);
        },
        mobiles: function(callback) {
            Mobile.find({'provider': req.params.id})
            .populate('provider')
                .exec(callback)
        }
    }, function(err, results) {
        if (err) {
            console.log('err: ' + err);
            return;
        }

        if (results.provider == null) {
            console.log('no result');
            return;
        }

        console.log(results.mobiles);
        res.render('./adminview/index', { 
            providerActive: true, 
            loginSuccess: true,
            title: results.provider.name, 
            tables: results.mobiles
        });
    });
}

exports.newProvider_get = function(req, res) {
    res.render('./adminview/editProvider', {
        providerActive: true,
        loginSuccess: true,
        title: 'New Provider'
    });
}

exports.newProvider_post = function(req, res) {
    Provider.find({})
    .exec(function(err, results) {
        if (err) {
            res.sendStatis(404);
        }
        var newName = req.body.nameTxt;

        for(var i = 0; i < results.length; i++) {
            var oldName = results[i].name;
            var lowerOldName = oldName.toLowerCase();
            var lowerNewName = newName.toLowerCase();

            if(lowerNewName == lowerOldName) {
                return res.render('./adminview/editProvider', { 
                    providerActive: true,
                    loginSuccess: true,
                    checkNameProvider: true,
                    title: 'New Provider',
                    name: req.body.nameTxt,
                    info: req.body.infoTxt
                });
            }
        }

        providerDetail = {
            name: req.body.nameTxt,
            amountOfModel: '0',
            info: req.body.infoTxt
        }

        var newProvider = new Provider(providerDetail);

        newProvider.save(function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            console.log('new newProvider: ' + newProvider)
        });

        Provider.find({}) 
        .exec(function(err1, results1) {
            res.render('./adminview/provider', { 
                providerActive: true, 
                loginSuccess: true,
                success: true,
                tables: results1
            });
        });
    });

}

exports.editProvider_Get = function(req, res) {
    Provider.findById(req.params.id)
    .exec(function(err, result, next) {
        if (err) { return next(err) }

        res.render('./adminview/editProvider', { 
            providerActive: true,
            title: 'Edit Provider',
            name: result.name,
            info: result.info
        });
    });
}

exports.editProvider_Post = function(req, res) {
    Provider.findByIdAndUpdate(req.params.id, {
        name: req.body.nameTxt,
        info: req.body.infoTxt
    },).exec(function(err, result, next) {
        if (err) { return next(err) }
        console.log(result);
        res.render('./adminview/editProvider', { 
            providerActive: true,
            name: req.body.nameTxt,
            info: req.body.infoTxt,
            success: true
        });
    });
}

exports.deleteProvider = function(req, res) {
    Provider.findById(req.params.id)
    .exec(function(err, result) {
        if (result.amountOfModel == 0) {
            Provider.findByIdAndRemove(req.params.id, function(err1, next) {
                if(err1) {
                    return next(err);
                }
                Provider.find({})
                .exec(function(err2, datas, next) {

                    if(err2) { return next(err2); }

                    res.render('./adminview/provider', {
                        providerActive: true,
                        success: true,
                        tables: datas
                    });
                })
            })
        } else {
            console.log('can not delete');
            Provider.find({}) 
            .exec(function(err1, datas) {
                res.render('./adminview/provider', {
                    providerActive: true,
                    notSuccess: true,
                    tables: datas
                });
            })
        }
    });
}