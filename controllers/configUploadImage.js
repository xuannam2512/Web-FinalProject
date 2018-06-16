var multer  = require('multer');
var path = require('path');
var fs = require('fs');
const { promisify } = require('util')

//delete image
const unlinkAsync = promisify(fs.unlink)

//set storage engine
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

//init upload
const upload = multer({
    storage: storage,
    limits: {fileSize: 10000000},
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('myImage')

const uploadArray = multer({
    storage: storage,
    limits: { fileSize: 10000000 },
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).array('myImage', 3);

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Image only!');
    }
}

module.exports.Upload = upload;

module.exports.Delete = unlinkAsync;

module.exports.UploadArray = uploadArray;