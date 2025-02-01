// Create a new router
const express = require("express")
const bcrypt = require('bcrypt')
const router = express.Router()
const { check, validationResult } = require('express-validator');
const isAuthenticated = require('./auth');

router.get('/register', function (req, res, next) {
    res.render('../views/auth/register', { error: [], formData: {} });                                                     
});

router.post('/registered', [
    check('email').isEmail().withMessage('Please enter a valid email address')
        .normalizeEmail(),
    check('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/\d/).withMessage('Password must contain at least one number')
        .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character')
    ],function (req, res, next) {

        const errors = validationResult(req);
        console.log(errors.array());
        if(!errors.isEmpty()) {

            const firstError = errors.array()[0].msg;
            return res.render('auth/register', { error: firstError, formData: req.body });
        } else {
            const saltRounds = 10
            const email = req.sanitize(req.body.email);
            const plainPassword = req.body.password
            bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                // saving data in database
                let sqlquery = "INSERT INTO users (username, password) VALUES (?,?)"
                // execute sql query
                let newrecord = [
                    email, 
                    hashedPassword
                ];
                db.query(sqlquery, newrecord, (err, result) => {
                if (err) {
                    next(err)
                }
                else {
                    // After successful registration, redirect to the home page
                    const userId = result.insertId;
                    req.session.userId = userId; 
                    console.log(userId)
            
                    req.session.watchlist = [];
                    
                    res.redirect('/usr/352'); 
                }
            });
        });
    };
});

// Login route
router.get('/login', function (req, res, next) {
    const flashMessage = req.flash('error');
    console.log(flashMessage)
    res.render('../views/auth/login', { error: null, formData: {}, flashMessage });                                                             
});

router.post('/loggedin', function (req, res, next) {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
        return res.render('../views/auth/login', {
            error: 'Email and password are required.',
            formData: req.body,
            flashMessage: null,
        });
    }

    let sqlquery = "SELECT id, password FROM users WHERE username=?;"

    db.query(sqlquery, [email] , (err, result) => {
        if (err) {
            return next(err)
        }

        if(result.length === 0) {
            return res.render('../views/auth/login', {
                error: 'User does not exist.',
                formData: req.body,
                flashMessage: null,
            });
        }
        const hashedPassword = result[0].password;
        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
            if (err) {
                return next(err); 
            }

            if (!isMatch) {
                // Password does not match
                return res.render('../views/auth/login', {
                    error: 'Incorrect password.',
                    formData: req.body,
                    flashMessage: null,
                });
            }

            // Successful login
            req.session.userId = result[0].id; 
            console.log(result[0].id);

            userId = req.session.userId;

            if (!req.session.watchlist) {
                req.session.watchlist = []; 
            }

            // Fetch the user's watchlist from the database
            const watchlistQuery = "SELECT id, watched, imdb_id FROM watchlist WHERE user_id = ?";
            db.query(watchlistQuery, [userId], (err, watchlist) => {
                if (err) {
                    console.error("Error fetching watchlist:", err);
                    return next(err);
                }

                const flashMessage = null;
                // Save the watchlist in the session
                req.session.watchlist = watchlist || [];
                console.log(req.session)
                res.redirect('/usr/352', {flashMessage}); 
            });
        });
    });
});

module.exports = router