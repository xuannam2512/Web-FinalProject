var upload = require('./configUploadImage');

exports.upload_get = function(req, res) {
    console.log("upload file");
    res.render('./admin/upload');
}

exports.upload_post = function(req, res) {
    upload.Upload(req, res, (err) => {
        if (err) {
            res.render('./admin/upload', {
                error: true,
                msg: err
            });
        } else {
            if (req.file == undefined) {
                res.render('./admin/upload', {
                    error: true,
                    msg: 'Error: No file selected!'
               });
            } else {
                console.log('../../public/upload/' + req.file.filename);
                res.render('./admin/upload', {
                    success: true,
                    msg: 'Upload image successfully',
                    file: '../../uploads/' + req.file.filename
                });
            }   
        }
    })
}