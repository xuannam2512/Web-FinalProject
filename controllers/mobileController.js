var Mobile = require('../models/Mobile');
var Provider = require('../models/Provider');
var Specification = require('../models/Specifications');
var Comments = require('../models/Comment');
var async = require('async');

exports.listMobile = function (req, res) {
    Mobile.find({})
        .populate('provider')
        .exec(function (err, results, next) {
            if(err) {
                return next(err);
            }
            res.render('./adminview/index', { 
                login: true,
                loginSuccess: true,
                mobileActive: true, 
                title: 'List Mobile',
                tables: results
             });
        });
}

exports.mobileDetail = function (req, res) {
    async.parallel({
        mobile: function (callback) {
            Mobile.findById(req.params.id)
                .populate('provider')
                .exec(callback);
        },
        comments: function (callback) {
            Comments.find({ 'mobileID': req.params.id })
                .populate('info')
                .exec(callback);
        },
        specification: function (callback) {
            Specification.find({ 'mobileID': req.params.id })
                .populate('mobileID')
                .exec(callback);
        }
    }, function (err, results) {
        res.render('./adminview/mobileDetail', {
            mobileActive: true,
            loginSuccess: true,
            title: results.mobile.mobileName,
            screen: results.specification[0].screen,
            operatorsystem: results.specification[0].operationsystem,
            camerafont: results.specification[0].camerafont,
            camerabehind: results.specification[0].camerabehind,
            cpu: results.specification[0].cpu,
            ram: results.specification[0].ram,
            memories: results.specification[0].memories,
            memorycard: results.specification[0].memorycard,
            sim: results.specification[0].sim,
            tables: results.comments
        });
    });
}

exports.mobileEdit_Get = function(req, res) {
    async.parallel({
        mobile: function(callback) {
            Mobile.findById(req.params.id)
            .populate('provider')
            .exec(callback);
        },
        specification: function (callback) {
            Specification.find({ 'mobileID': req.params.id })
                .populate('mobileID')
                .exec(callback);
        }
    }, function(err, result, next) {
        if (err) { return next(err) }

        res.render('./adminview/editMobile', {
            mobileActive: true,
            loginSuccess: true,
            title: result.mobile.mobileName,
            mobileName: result.mobile.mobileName,
            salePrice: result.mobile.salePrice,
            provider: result.mobile.provider.name,
            screen: result.specification[0].screen,
            operationsystem: result.specification[0].operationsystem,
            camerafont: result.specification[0].camerafont,
            camerabehind: result.specification[0].camerabehind,
            cpu: result.specification[0].cpu,
            ram: result.specification[0].ram,
            memories: result.specification[0].memories, 
            memorycard: result.specification[0].memorycard,
            sim: result.specification[0].sim
        });
    })
}

exports.mobileEdit_Post = function(req, res) {

    async.parallel({
        mobile: function(callback) {
            Mobile.findByIdAndUpdate(req.params.id, {
                mobileName: req.body.mobileNameTxt,
                salePrice: req.body.salePriceTxt
            }).exec(callback);
        },
        specification: function(callback) {
            Specification.findOneAndUpdate({'mobileID': req.params.id}, {
                screen: req.body.screenTxt,
                operationsystem: req.body.operationsystemTxt,
                camerafont: req.body.camerafontTxt,
                camerabehind: req.body.camerabehindTxt,
                cpu: req.body.cpuTxt,
                ram: req.body.ramTxt,
                memories: req.body.memoriesTxt,
                memorycard: req.body.memorycardTxt,
                sim: req.body.simTxt
            }).populate('mobileID').exec(callback);
        }
    }, function(err, result, next) {
        if(err) {
            return next(err);
        }

        res.render('./adminview/editMobile', {
            mobileActive: true,
            loginSuccess: true,
            success: true,
            title: req.body.mobileNameTxt,
            mobileName: req.body.mobileNameTxt,
            salePrice: req.body.salePriceTxt,
            screen: req.body.screenTxt,
            operationsystem: req.body.operationsystemTxt,
            camerafont: req.body.camerafontTxt,
            camerabehind: req.body.camerabehindTxt,
            cpu: req.body.cpuTxt,
            ram: req.body.ramTxt,
            memories: req.body.memoriesTxt, 
            memorycard: req.body.memorycardTxt,
            sim: req.body.simTxt,
            success: true
        });
    });
}

exports.setStatus = function(req, res) {

    Mobile.findById(req.params.id)
    .exec(function(err, result) {
        if(result.status == 'Ngung ban') {
            console.log('Lich hoat lai');
            var status;
            if (parseInt(result.sold) < parseInt(result.imported)) {
                status = 'Con hang';
            } else {
                status = 'Het hang';
            }

            Mobile.findByIdAndUpdate(req.params.id, {
                status: status
            }).exec(function(err1, result1) {
                Mobile.find({})
                .exec(function(err2, results) {
                    res.redirect('/admin/mobile');
                });
            })
        } else {
            console.log('Ngung ban');
            Mobile.findByIdAndUpdate(req.params.id, {
                status: 'Ngung ban'
            }).exec(function(err1, result1) {
                Mobile.find({})
                .exec(function(err2, results) {
                    res.redirect('/admin/mobile');
                });
            });
        }
    });
}

