var Sale = require('../models/Sale');
var Provider = require('../models/Provider');
var Mobile = require('../models/Mobile');

var async = require('async');

exports.listSale_get = function (req, res) {
    var flashMessages = res.locals.getMessages();

    Sale.find()
        .populate('user')
        .exec(function (err, results) {
            if (err) {
                return console.log(err);
            }

            console.log(results);
            if (flashMessages.error) {
                return res.render('./admin/sale/sale', {
                    saleActive: true,
                    loginSuccess: true,
                    showError: true,
                    error_msg: flashMessages.error,
                    tables: results
                });
            } else {
                if (flashMessages.success_msg) {
                    return res.render('./admin/sale/sale', {
                        saleActive: true,
                        loginSuccess: true,
                        showSuccess: true,
                        success_msg: flashMessages.success_msg,
                        tables: results
                    });
                } else {
                    return res.render('./admin/sale/sale', {
                        saleActive: true,
                        loginSuccess: true,
                        tables: results
                    });
                }
            }
        })
}

exports.saleDetail = function (req, res) {

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

        res.render('./admin/sale/saleDetail', {
            saleActive: true,
            loginSuccess: true,
            date: date,
            tables: tables
        });
    })
}

exports.deliver_get = function(req, res) {
    var id = req.params.id;

    Sale.findByIdAndUpdate(id, {
        status: 'Đang giao'
    }).exec(function(err, result) {
        if(err) {
            return console.log(err);
        }

        console.log(result);
        req.flash('success_msg', 'Đơn hàng ' + result.date + ' ở trạng thái đang giao.' );
        return res.redirect('/admin/sale');
    })
}