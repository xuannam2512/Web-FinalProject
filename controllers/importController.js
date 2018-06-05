var Imports = require('../models/Import');
var Provider = require('../models/Provider');
var Mobile = require('../models/Mobile');
var Specification = require('../models/Specifications');
var async = require('async');

exports.listImports = function(req, res) {
    Imports.find({})
    .populate('mobileImported')
    .exec(function(err, results, next) {
        if(err) { return next(err) }

        //tinh so luong thiet bi

        res.render('./adminview/imports', {
            importActive: true,
            loginSuccess: true,
            tables: results
        });
    });
}

exports.importDetail = function(req, res) {
    
    async.parallel({
        mobileAndTime: function(callback) {
            Imports.findById(req.params.id)
            .populate('mobileImported')
            .exec(callback);
        },
        amountOfModel: function(callback) {
            Amount.find({'date': req.params.id})
            .exec(callback);
        },
        priceOfModel: function(callback) {
            Price.find({'date': req.params.id})
            .exec(callback);
        }
    }, function(err, results, next) {

        if(err) { return next(err); }

        console.log(results);


        res.render('./adminview/importDetail', {
            importActive: true,
            loginSuccess: true,
            mobiles: results.mobileAndTime.mobileImported,
            amounts: results.amountOfModel,
            prices: results.priceOfModel
        });
    })    
}

exports.newImport_Get = function(req, res) {

    Provider.find({})
    .exec(function(err, results, next) {
        if(err) { return next(err); }
        res.render('./adminview/createImport', {
            importActive: true,            
            loginSuccess: true,
            list: results
        });
    })
}

exports.newImport_Post = function(req, res) {

    async.parallel({
        provider: function(callback) {
            Provider.find({'name': req.body.providerTxt})
            .exec(callback);
        },
        mobile: function(callback) {
            Mobile.find({'mobileName': req.body.nameModelTxt})
            .exec(callback);
        }
    }, function(err, result) {

        var providers = [];
        var mobiles = [];
        var listMobile = [];

        //cap nhat nhung model da co trong co so du lieu
        for (var i = 0; i < result.mobile.length; i++) {
            for(var j = 0;  j < req.body.nameModelTxt.length; j++) {
                if(result.mobile[i].mobileName == req.body.nameModelTxt[j]) {

                    listMobile.push(result.mobile[i]);

                    var imported = parseInt(result.mobile[i].imported) + parseInt(req.body.amountTxt[i]);
                    Mobile.update({'mobileName': result.mobile[i].mobileName}, {
                        imported: imported,
                        salePrice: req.body.salepricelTxt[i]
                    }).exec();
                    break;
                }
            }
        }
        
        //danh sach cac nha cung cap vua nhap theo dung thu tu
        for(var i = 0; i < req.body.providerTxt.length; i++) {

            for(var j = 0; j < result.provider.length; j++) {

                if (req.body.providerTxt[i] == result.provider[j].name) {
                    providers.push(result.provider[j]);
                    break;
                }
            }
        }

        // cap nhat so luong model cua nha cung cap

        //them dien thoai moi chua co trong co so du lieu
        for(var i = 0; i < req.body.nameModelTxt.length; i++) {
            var j;
            for(j = 0;  j < result.mobile.length; j++) {
                if(result.mobile[j].mobileName == req.body.nameModelTxt[i]) {
                    break;
                }
            }
            if(j == result.mobile.length) {
                mobileDetail = {
                    mobileName: req.body.nameModelTxt[i],
                    status: 'Con hang',
                    provider: providers[i],
                    sold: '0',
                    imported: req.body.amountTxt[i],
                    salePrice: req.body.salepricelTxt[i]
                }
    
                var newMobile = Mobile(mobileDetail);
                mobiles.push(newMobile);
                listMobile.push(newMobile);
                
                newMobile.save(function(err, result) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    //console.log('new newMobile: ' + newMobile)
                });

                specificationDetail = {
                    mobileID: newMobile,
                    screen: req.body.screenTxt[i],
                    operationsystem: req.body.operationsystemTxt[i],
                    camerafont: req.body.camerafontTxt[i],
                    camerabehind: req.body.camerabehindTxt[i],
                    cpu: req.body.cpuTxt[i],
                    ram: req.body.ramTxt[i],
                    memories: req.body.memoriesTxt[i],
                    memorycard: req.body.memorycardTxt[i],
                    sim: req.body.simTxt[i]
                }
    
                var newSpecification = new Specification(specificationDetail);
                newSpecification.save(function(err, result) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    //console.log(newSpecification);
                });
            }
        }

        //cap nhat lai so luong model cua nha cung cap
        
        for(var i = 0; i < result.provider.length; i++) {
            var count = 0;
            var amountOfModel = parseInt(result.provider[i].amountOfModel);
            for(var j = 0; j < mobiles.length; j++) {
                if(mobiles[j].provider._id == result.provider[i]._id) {
                    count = count + 1;
                }  
            }

            Provider.findByIdAndUpdate(result.provider[i]._id, {
                amountOfModel: amountOfModel + count
            }).exec();
        }

        //tao new import
        var totalPrice = 0;
        for(var i = 0; i < req.body.importpricelTxt.length; i++) {
            totalPrice = totalPrice + parseInt(req.body.importpricelTxt[i]);
        }

        importDetail = {
            mobileImported: listMobile,
            mobileAmount: req.body.amountTxt,
            mobilePrice: req.body.importpricelTxt,
            date: Date.now(),
            totalPrice: totalPrice
        }

        var newImport = Imports(importDetail);
        newImport.save(function(err, result) {
            if (err) {
                console.error(err);
                return;
            }
            console.log(newImport);
        });

        res.redirect('/admin/importMobile');
    });
}

exports.editImport = function(req, res) {
    res.send('edit import');
}

exports.deleteImport = function(req, res) {
    res.send('delete import');
}