var Mobile = require('../models/Mobile');
var Provider = require('../models/Provider');
var Specification = require('../models/Specifications');
var Comments = require('../models/Comment');
var Image = require('./configUploadImage');
var async = require('async');

exports.listMobile = function (req, res) {
    Mobile.find({})
        .populate('provider')
        .exec(function (err, results, next) {
            if(err) {
                return next(err);
            }
            res.render('./admin/mobile/mobile', { 
                login: true,
                loginSuccess: true,
                mobileActive: true, 
                title: 'Danh Sách Sản Phẩm',
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
        res.render('./admin/mobile/mobileDetail', {
            mobileActive: true,
            loginSuccess: true,
            title: results.mobile.mobileName,
            img1: results.specification[0].imgDisplay[0],
            img2: results.specification[0].imgDisplay[1],
            img3: results.specification[0].imgDisplay[2],
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

        res.render('./admin/mobile/editMobile', {
            mobileActive: true,
            loginSuccess: true,
            title: result.mobile.mobileName,
            mobileName: result.mobile.mobileName,
            img1: result.specification[0].imgDisplay[0],
            img2: result.specification[0].imgDisplay[1],
            img3: result.specification[0].imgDisplay[2],
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

    Image.UploadArray(req, res, (err) => {
        if(err) {
            console.log(err);
            return res.render('./admin/mobile/editMobile', {
                mobileActive: true,
                loginSuccess: true,
                showError: true,
                error_msg: 'Lỗi, không thể upload ảnh, hãy thử lại!'
            });
        } else {
            if(req.files == undefined) {
                return res.render('./admin/mobile/editMobile', {
                    mobileActive: true,
                    loginSuccess: true,
                    title: req.body.mobileName,
                    mobileName: req.body.mobileName,
                    salePrice: req.body.salePrice,
                    screen: req.body.screen,
                    operationsystem: req.body.operator,
                    camerafont: req.body.frontCamera,
                    camerabehind: req.body.behindCamera,
                    cpu: req.body.cpu,
                    ram: req.body.ram,
                    memories: req.body.memories, 
                    memorycard: req.body.memoriesCard,
                    sim: req.body.sim,
                    showError: true,
                    error_msg: 'Chưa có hình được chọn!'
                });
            } else {
                var imgDisplays = [];
                var imgDeletes = [];
                var nameMobile = req.body.mobileName;
                var upperNameMobile = nameMobile.toUpperCase();
                for (var i = 0; i < req.files.length; i++) {
                    imgDisplay = '../../../uploads/' + req.files[i].filename;
                    imgDelete = './public/uploads/' + req.files[i].filename;
                    imgDisplays.push(imgDisplay);
                    imgDeletes.push(imgDelete);
                }

                //delete old image
                async.parallel({
                    mobile: function(callback) {
                        Mobile.findByIdAndUpdate(req.params.id, {
                            mobileName: upperNameMobile,
                            salePrice: req.body.salePrice
                        }).exec(callback);
                    },
                    specification: function(callback) {
                        Specification.findOneAndUpdate({'mobileID': req.params.id}, {
                            screen: req.body.screen,
                            operationsystem: req.body.operator,
                            camerafont: req.body.frontCamera,
                            camerabehind: req.body.behindCamera,
                            cpu: req.body.cpu,
                            ram: req.body.ram,
                            memories: req.body.memories,
                            memorycard: req.body.memoriesCard,
                            sim: req.body.sim
                        }).populate('mobileID').exec(callback);
                    }
                }, function(err, result, next) {
                    if(err) {
                        return next(err);
                    }
                    //delete old image
                    var oldImageDelete = result.specification.imgDelete;
                    console.log(oldImageDelete);
                    for (var i = 0; i < oldImageDelete.length; i++) {
                        Image.Delete(oldImageDelete[i]);
                    }

                    Specification.findOneAndUpdate( {'mobileID': req.params.id }, {
                        imgDisplay: imgDisplays,
                        imgDelete: imgDeletes
                    }).exec(function(err, result) {
                        if(err) {
                            console.log(err);
                            return res.render('./admin/mobile/editMobile', {
                                mobileActive: true,
                                loginSuccess: true,
                                showError: true,
                                error_msg: 'Lỗi không update được ảnh.'
                            });
                        }

                        res.render('./admin/mobile/editMobile', {
                            mobileActive: true,
                            loginSuccess: true,
                            title: req.body.mobileName,
                            mobileName: req.body.mobileName,
                            img1: imgDisplays[0],
                            img2: imgDisplays[1],
                            img3: imgDisplays[2],
                            salePrice: req.body.salePrice,
                            screen: req.body.screen,
                            operationsystem: req.body.operator,
                            camerafont: req.body.frontCamera,
                            camerabehind: req.body.behindCamera,
                            cpu: req.body.cpu,
                            ram: req.body.ram,
                            memories: req.body.memories, 
                            memorycard: req.body.memoriesCard,
                            sim: req.body.sim,
                            showSuccess: true,
                            success_msg: 'Chỉnh sửa thành công!'
                        });
                    })
                });
            }
        }
    })
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

