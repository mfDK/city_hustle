var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var config = require('../config/database');
var mongoose = require('mongoose');
var User = mongoose.model('User');
var passport = require('passport');
var jwt = require('jsonwebtoken');

app.use(passport.initialize());
require('../config/passport')(passport);

router.use(bodyParser.urlencoded({ extended: true }));
router.use(methodOverride(function(req, res){
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}))

router.route('/register')
    .get(function(req, res, next) {
        mongoose.model('User').find({}, function(err, users) {
            if (err) {
                return console.error(err);
            } else {
                res.format({
                    html: function() {
                        res.render('users/register', {
                            title: 'All Users',
                            "users": users
                        });
                    },
                    json: function() {
                        res.json(users);
                    }
                });
            }
        });
    })
    .post(function(req,res) {
        if (!req.body.email || !req.body.password) {
            res.json({
                success: false,
                message: 'please enter email and password'
            })
        } else {
            var newUser = new User({
                email: req.body.email,
                password: req.body.password
            });
            newUser.save(function(err) {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'that email address already exists'
                    })
                }
                res.json({
                    success: true,
                    message: 'Succesfully created new user'
                });
            });
        }
    });

router.route('/authenticate')
    .post(function(req, res) {
        User.findOne({
            email: req.body.email
        }, function(err, user) {
            console.log(user);
            if (err) throw err;
            if (!user) {
                res.send({
                    success: false,
                    message: 'Authenicate fail, User not found'
                });
            } else {
                user.comparePassword(req.body.password, function(err, isMatch) {
                    if (isMatch && !err) {
                        var token = jwt.sign(user, config.secret, {
                            expiresIn: 10090
                        });
                        res.json({
                            success: true,
                            token: 'JWT ' + token
                        });
                    } else {
                        res.send({
                            success: false,
                            message: 'Authentication Failed, Passowrds did not match'
                        });
                    }
                });
            }
        })
    })

router.get('/dashboard', passport.authenticate('jwt', {session: false}), function(req, res) {
    res.send('It worked! User id is ' + req.user._id + '.');
});

module.exports = router;
