var Provider = require('../models/Provider');
var Mobile = require('../models/Mobile');
var Image = require('./configUploadImage');
var Specification = require('../models/Specifications');
var async = require('async');

//admin
exports.listProvider = function (req, res) {
    console.log('here');
    Provider.find({})
        .exec(function (err, results) {
            if (err) {
                console.error(err);
                return;
            }
            var flashMessages = res.locals.getMessages();
            if(flashMessages.success_msg) {
                return res.render('./admin/provider/provider', {
                    providerActive: true,
                    loginSuccess: true,
                    showSuccess: true,
                    success_msg: flashMessages.success_msg,
                    tables: results
                });
            }

            if(flashMessages.error_msg) {
                return res.render('./admin/provider/provider', {
                    providerActive: true,
                    loginSuccess: true,
                    tables: results,
                    showError: true,
                    error_msg: flashMessages.error_msg
                });
            } else {
                return res.render('./admin/provider/provider', {
                    providerActive: true,
                    loginSuccess: true,
                    tables: results
                });
            }
        });
}

exports.providerDetail = function (req, res) {
    async.parallel({
        provider: function (callback) {
            Provider.findById(req.params.id)
                .exec(callback);
        },
        mobiles: function (callback) {
            Mobile.find({ 'provider': req.params.id })
                .populate('provider')
                .exec(callback)
        }
    }, function (err, results) {
        if (err) {
            console.log('err: ' + err);
            return res.render('./admin/provider/providerDetail', {
                providerActive: true,
                loginSuccess: true,
                showError: true,
                error_msg: err
            });
        }

        if (results.provider == null) {
            console.log('no result');
            return res.render('./admin/provider/providerDetail', {
                providerActive: true,
                loginSuccess: true,
                showError: true,
                error_msg: 'Không có kết quả hiển thị, hãy thử lại!'
            });
        }

        console.log(results.mobiles);
        res.render('./admin/provider/providerDetail', {
            providerActive: true,
            loginSuccess: true,
            name: results.provider.name,
            info: results.provider.info,
            img: results.provider.imgDisplay,
            tables: results.mobiles
        });
    });
}

exports.newProvider_get = function (req, res) {
    res.render('./admin/provider/createProvider', {
        providerActive: true,
        loginSuccess: true,
    });
}

exports.newProvider_post = function (req, res) {
    Image.Upload(req, res, (err) => {
        if (err) {
            console.log(err);
            return res.render('./admin/provider/createProvider', {
                providerActive: true,
                loginSuccess: true,
                showError: true,
                error_msg: 'Upload ảnh thất bại, hãy thử lại!'
            });
        } else {
            if (req.file == undefined) {
                console.log('chưa có ảnh được chọn');
                return res.render('./admin/provider/createProvider', {
                    providerActive: true,
                    loginSuccess: true,
                    showError: true,
                    error_msg: 'Chưa có hình được chọn!'
                });
            } else {
                Provider.find({})
                    .exec(function (err, results) {
                        if (err) {
                            var path = './public/uploads/' + req.file.filename;
                            Image.Delete(path);
                            res.sendStatis(404);
                        }
                        var newName = req.body.name;
                        console.log(newName);
                        var upperNewName = newName.toUpperCase();

                        for (var i = 0; i < results.length; i++) {
                            var oldName = results[i].name;

                            if (oldName == upperNewName) {
                                var path = './public/uploads/' + req.file.filename;
                                Image.Delete(path);
                                return res.render('./admin/provider/createProvider', {
                                    providerActive: true,
                                    loginSuccess: true,
                                    showError: true,
                                    error_msg: 'Tên nhà cung cấp đã tồn tại trong dữ liệu.',
                                    name: req.body.name,
                                    info: req.body.info
                                });
                            }
                        }

                        providerDetail = {
                            name: upperNewName,
                            amountOfModel: '0',
                            imgDisplay: '../../../uploads/' + req.file.filename,
                            imgDelete: './public/uploads/' + req.file.filename,
                            info: req.body.info
                        }

                        var newProvider = new Provider(providerDetail);

                        newProvider.save(function (err, result) {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log('new newProvider: ' + newProvider)

                            return res.render('./admin/provider/createProvider', {
                                providerActive: true,
                                loginSuccess: true,
                                showSuccess: true,
                                success_msg: 'Thêm mới nhà cung cấp thành công!'
                            });
                        });
                    });
            }
        }
    })

}

exports.editProvider_Get = function (req, res) {
    Provider.findById(req.params.id)
        .exec(function (err, result, next) {
            if (err) { return next(err) }

            res.render('./admin/provider/editProvider', {
                providerActive: true,
                loginSuccess: true,
                img: result.imgDisplay,
                name: result.name,
                info: result.info
            });
        });
}

exports.editProvider_Post = function (req, res) {
    Image.Upload(req, res, (err) => {
        if (err) {
            console.log(req.params.id);
            return res.render('./admin/provider/editProvider', {
                loginSuccess: true, 
                providerActive: true,
                showError: true,
                error_msg: err,
                name: req.body.name,
                info: req.body.info
            });
        } else {
            if (req.file == undefined) {
                Provider.findByIdAndUpdate(req.params.id, {
                    name: req.body.name,
                    info: req.body.info,
                }, ).exec(function (err, result) {
                    if (err) {
                        var path = './public/uploads/' + req.file.filename;
                        Image.Delete(path);
                        return res.render('./admin/provider/editProvider', {
                            loginSuccess: true,
                            providerActive: true,
                            showError: true,
                            error_msg: 'Không lưu được dữ liệu, hãy thử lại!'
                        });
                    }
                    console.log(result);
                    res.render('./admin/provider/editProvider', {
                        providerActive: true,
                        loginSuccess: true,
                        showSuccess: true,
                        success_msg: 'Chỉnh sửa thành công!'
                    });
                });
            } else {
                Provider.findById(req.params.id)
                .exec(function(err, result) {
                    if (err) {
                        var path = './public/uploads/' + req.file.filename;
                        Image.Delete(path);
                        return res.render('./admin/provider/editProvider', {
                            loginSuccess: true,
                            providerActive: true,
                            showError: true,
                            error_msg: 'Không load được dữ liệu, hãy thử lại!'
                        });
                    }
                    //delete old image
                    Image.Delete(result.imgDelete);
                    //update provider
                    Provider.findByIdAndUpdate(req.params.id, {
                        name: req.body.name,
                        imgDisplay: '../../../uploads/' + req.file.filename,
                        imgDelete: './public/uploads/' + req.file.filename,
                        info: req.body.info,
                    }, ).exec(function (err, result) {
                        if (err) {
                            var path = './public/uploads/' + req.file.filename;
                            Image.Delete(path);
                            return res.render('./admin/provider/editProvider', {
                                loginSuccess: true,
                                providerActive: true,
                                showError: true,
                                error_msg: 'Không lưu được dữ liệu, hãy thử lại!'
                            });
                        }
                        console.log(result);
                        res.render('./admin/provider/editProvider', {
                            providerActive: true,
                            loginSuccess: true,
                            showSuccess: true,
                            success_msg: 'Chỉnh sửa thành công!'
                        });
                    });

                });
            }
        }
    })
}

exports.deleteProvider = function (req, res) {
    Provider.findById(req.params.id)
        .exec(function (err, result) {
            if (result.amountOfModel == 0) {
                Provider.findByIdAndRemove(req.params.id, function (err1, next) {
                    if (err1) {
                        return next(err);
                    }
                    //delete data
                    var path = result.imgDelete;
                    Provider.find({})
                        .exec(function (err2, results, next) {

                            if (err2) { return next(err2); }

                            //delete image in database
                            Image.Delete(path);
                            req.flash('success_msg', 'Xóa thành công.');

                            res.redirect('/admin/provider');
                        })
                })
            } else {
                console.log('can not delete');
                Provider.find({})
                    .exec(function (err1, results) {
                        req.flash('error_msg', 'Xóa thất bại hãy thử lại.');
                        res.redirect('/admin/provider');
                    })
            }
        });
}
