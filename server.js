var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');

var jwt    = require('jsonwebtoken');
var config = require('./config');
var User   = require('./app/models/user'); // mongoose model

var app = express();

// *******************
// Config
// *******************
var port = process.env.PORT || 3000; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// *******************
// ROUTES
// *******************

app.get('/', function(req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.get('/setup', function(req, res) {
  var gob = new User({
    name: 'GOB Bluth',
    password: 'password',
    admin: true
  });

  gob.save(function(err) {
    if (err) throw err;

    console.log('User saved successfully');
    res.json({ success: true });
  });
});

// API
 
var apiRoutes = express.Router();

apiRoutes.get('/', function(req, res) {
  res.json({ message: "You just blue yourself." });
});

apiRoutes.post('/authenticate', function(req, res) {

  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: "Her?" });
    } else if (user) {

      if (user.password != req.body.password) {
        res.json({ success: false, message: "Has any of you even seen a password before?" });
      } else {

        // Password matches. Here's the JWT
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: '24hr'
        });

        res.json({
          success: true,
          message: 'Loose Token',
          token: token
        });

      }

    }
  });
});

apiRoutes.use(function(req, res, next) {

  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {

    jwt.verify(token, app.get('superSecret'), function(err, decoded) {

      if (err) {
        return res.json({ success: false, message: "Failed to authenticate." });
      } else {
        req.decoded = decoded;
        next();
      }

    });

  } else {

    return res.status(403).send({ 
        success: false, 
        message: 'No token provided. Please authenticate first.' 
    });

  }

});


apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});

app.use('/api', apiRoutes);


app.listen(port);
console.log('Magic happens at http://localhost:' + port);