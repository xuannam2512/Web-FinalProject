var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var flash = require('express-flash-messages');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var expressHbs = require('express-handlebars');
var expressValidator = require('express-validator');
var MongoStore = require('connect-mongo')(session);
var Account = require('./models/Account');

var client = require('./routes/client');
var users = require('./routes/users');
var admin = require('./routes/admin');

var app = express();

//config mongodb
var mongoDBUrl = 'mongodb://localhost:27017/finalProject'
mongoose.connect(mongoDBUrl);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB Connection Error:'));
db.once("open", function (callback) {
  console.log("connection succeeded.");
});

// view engine setup
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', 'hbs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//express session
app.use(require('express-session')({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 180 * 60 * 1000 } // Maximum Time Session: Minutes * Seconds * Miliseconds
}));
//express validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));
//flash
app.use(flash());
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.session = req.session;
  next();
})

//config passport
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', client);
app.use('/admin', admin);
app.use('/users', users);

//check account
var Account = require('./models/Account');
passport.use('local', new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
