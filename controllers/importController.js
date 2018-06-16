var Imports = require('../models/Import');
var Provider = require('../models/Provider');
var Mobile = require('../models/Mobile');
var Specification = require('../models/Specifications');
var Image = require('./configUploadImage');
var async = require('async');

exports.listImports = function (req, res) {
    Imports.find({})
        .populate('mobileImported')
        .exec(function (err, results, next) {
            if (err) { return next(err) }

            //tinh so luong thiet bi

            res.render('./admin/import/importMobile', {
                importActive: true,
                loginSuccess: true,
                tables: results
            });
        });
}

exports.importDetail = function (req, res) {

    var importDetails = []
    Imports.findById(req.params.id)
        .exec(function (err, result) {
            if (err) {
                console.log(err);
                return;
            }

            var mobiles = result.mobileImported;
            var mobilePrices = result.mobilePrice;
            var mobileAmounts = result.mobileAmount;

            // console.log(mobiles);
            // console.log(mobileAmounts);
            // console.log(mobilePrices);

            async.parallel({
                mobile: function (callback) {
                    Mobile.find({ '_id': mobiles })
                        .populate('provider')
                        .exec(callback);
                }
            }, function (err, result) {
                console.log(result.mobile.length);
                for (var i = 0; i < result.mobile.length; i++) {
                    importDetail = {
                        mobile: result.mobile[i],
                        amount: mobileAmounts[i],
                        price: mobilePrices[i]
                    }

                    importDetails.push(importDetail);
                }

                res.render('./admin/import/importDetail', {
                    importActive: true,
                    loginSuccess: true,
                    tables: importDetails
                })
            })

        });
}

exports.newImport_Get = function (req, res) {

    Provider.find({})
        .exec(function (err, results, next) {
            if (err) { return next(err); }
            res.render('./admin/import/createImport', {
                importActive: true,
                loginSuccess: true,
                list: results
            });
        })
}

exports.newImport_Post = function (req, res) {

    Image.UploadArray(req, res, (err) => {
        if (err) {
            console.log(err);
            retrun;
        } else {
            if (req.files == undefined) {
                return res.render('./admin/import/createImport', {
                    importActive: true,
                    loginSuccess: true,
                    showError: true,
                    error_msg: 'Chưa có ảnh được chọn.'
                });
            } else {
                var imgDisplays = [];
                var imgDeletes = [];
                for (var i = 0; i < req.files.length; i++) {
                    imgDisplay = '../../../uploads/' + req.files[i].filename;
                    imgDelete = './public/uploads/' + req.files[i].filename;
                    imgDisplays.push(imgDisplay);
                    imgDeletes.push(imgDelete);
                }

                async.parallel({
                    provider: function (callback) {
                        Provider.find({ 'name': req.body.provider })
                            .exec(callback);
                    },
                    mobile: function (callback) {
                        Mobile.find({ 'mobileName': req.body.mobileName })
                            .exec(callback);
                    }
                }, function (err, result) {
                    if (err) {
                        console.log(err);
                        return res.render('./admin/import/createImport', {
                            importActive: true,
                            loginSuccess: true,
                            showError: true,
                            error_msg: 'Không lưu được, hãy thử lại'
                        });
                    }
                    //neu da co trong du lieu thi se cap nhat
                    var amountOfModel = parseInt(result.provider[0].amountOfModel) + 1;
                    var provider = result.provider;                

                    if (result.mobile.length > 0) {
                        var imported = parseInt(result.mobile[0].imported) + parseInt(req.body.amount);
                        var mobileID = result.mobile[0]._id;
                        var mobile = result.mobile[0];
                        async.series({
                            updateMobile: function (callback) {
                                Mobile.update({ 'mobileName': req.body.mobileName }, {
                                    imported: imported,
                                    salePrice: req.body.salePrice
                                }).exec(callback);
                            },
                            specification: function(callback) {
                                Specification.find({ 'mobileID': mobileID} )
                                .exec(callback);
                            },
                            updateSpecification: function (callback) {
                                Specification.update({ 'mobileID': mobileID }, {
                                    imgDisplay: imgDisplays,
                                    imgDelete: imgDeletes,
                                    screen: req.body.screen,
                                    operationsystem: req.body.operator,
                                    camerafont: req.body.frontCamera,
                                    camerabehind: req.body.behindCamera,
                                    cpu: req.body.cpu,
                                    ram: req.body.ram,
                                    memories: req.body.memories,
                                    memorycard: req.body.memoriesCard,
                                    sim: req.body.sim
                                }).exec(callback);
                            }
                        }, function (err, result) {
                            if (err) {
                                console.log(err);
                                return res.render('./admin/import/createImport', {
                                    loginSuccess: true,
                                    importActive: true,
                                    showError: true,
                                    error_msg: 'Lưu thất bại hãy thử lại!'
                                });
                            }

                            //delete old image
                            var oldImageDelete = result.specification[0].imgDelete;
                            console.log(oldImageDelete);
                            for(var i = 0; i < oldImageDelete.length; i++) {
                                Image.Delete(oldImageDelete[i]);
                            }

                            importDetail = {
                                mobileImported: mobile,
                                mobileAmount: req.body.amount,
                                mobilePrice: req.body.importPrice,
                                date: Date.now()
                            }

                            var newImport = Imports(importDetail);
                            newImport.save(function (err, result) {
                                if (err) {
                                    console.log(err);
                                    return res.render('./admin/import/createImport', {
                                        importActive: true,
                                        loginSuccess: true,
                                        showError: true,
                                        error_msg: 'Không lưu được, hãy thử lại'
                                    });
                                }
                                console.log(result);
                                res.render('./admin/import/createImport', {
                                    importActive: true,
                                    loginSuccess: true,
                                    showSuccess: true,
                                    success_msg: 'Nhập hàng thành công'
                                })
                            });
                        })
                    } else {
                        var mobileName = req.body.mobileName;
                        var upperMobileName = mobileName.toUpperCase();
                        mobileDetail = {
                            mobileName: upperMobileName,
                            provider: provider[0],
                            sold: '0',
                            imported: req.body.amount,
                            status: 'Con hang',
                            salePrice: req.body.salePrice
                        }
                        var mobile = new Mobile(mobileDetail);
                        console.log(mobile.provider);
                        mobile.save(function (err, result) {
                            if (err) {
                                console.log(err);
                                return res.render('./admin/import/createImport', {
                                    importActive: true,
                                    loginSuccess: true,
                                    showError: true,
                                    error_msg: 'Không lưu được, hãy thử lại'
                                });
                            }

                            specificationDetail = {
                                mobileID: mobile,
                                imgDisplay: imgDisplays,
                                imgDelete: imgDeletes,
                                screen: req.body.screen,
                                operationsystem: req.body.operator,
                                camerafont: req.body.frontCamera,
                                camerabehind: req.body.behindCamera,
                                cpu: req.body.cpu,
                                ram: req.body.ram,
                                memories: req.body.memories,
                                memorycard: req.body.memoriesCard,
                                sim: req.body.sim
                            }
                            var newSpecification = new Specification(specificationDetail);
                            newSpecification.save(function (err, result) {
                                if (err) {
                                    console.log(err);
                                    return res.render('./admin/import/createImport', {
                                        importActive: true,
                                        loginSuccess: true,
                                        showError: true,
                                        error_msg: 'Không lưu được, hãy thử lại'
                                    });
                                }

                                importDetail = {
                                    mobileImported: mobile,
                                    mobileAmount: req.body.amount,
                                    mobilePrice: req.body.importPrice,
                                    date: Date.now()
                                }

                                var newImport = Imports(importDetail);
                                newImport.save(function (err, result) {
                                    if (err) {
                                        console.log(err);
                                        return res.render('./admin/import/createImport', {
                                            importActive: true,
                                            loginSuccess: true,
                                            showError: true,
                                            error_msg: 'Không lưu được, hãy thử lại'
                                        });
                                    }
                                    console.log(result);
                                    Provider.update({'name': req.body.provider}, {
                                        amountOfModel: amountOfModel
                                    }).exec(function(err, result) {
                                        if (err) {
                                            console.log(err);
                                            return res.render('./admin/import/createImport', {
                                                importActive: true,
                                                loginSuccess: true,
                                                showError: true,
                                                error_msg: 'Không lưu được, hãy thử lại'
                                            });
                                        }
                                        res.render('./admin/import/createImport', {
                                            importActive: true,
                                            loginSuccess: true,
                                            showSuccess: true,
                                            success_msg: 'Nhập hàng thành công'
                                        })
                                    });
                                });
                            });
                        });
                    }
                })
            }
        }
    })
}

exports.editImport = function (req, res) {
    res.send('edit import');
}

exports.deleteImport = function (req, res) {
    res.send('delete import');
}