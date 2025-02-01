const express = require ('express');
var ejs = require('ejs');
var session = require('express-session');
var validator = require ('express-validator');
const expressSanitizer = require('express-sanitizer');
const request = require('request')
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const flash = require('connect-flash');

//Import mysql module
var mysql = require('mysql2')

// Create the express application object
const app = express()
const port = 8000

// Templating Engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

// Use express-ejs-layouts to automatically load layout files
app.use(expressLayouts);

// Set default layout
app.set('layout', '../views/layouts/main');

// Set up the body parser 
app.use(express.urlencoded({ extended: true }))

// Set up public folder (for css and statis js)
app.use(express.static(path.join(__dirname, 'public')));


// Create a session
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}))

// Define the database connection
const db = mysql.createConnection ({
    host: 'igor.gold.ac.uk',
    user: 'mreyn001',
    password: '*******',
    database: 'mreyn001_flixlist',
    port: 3307
})

// Connect to the database
db.connect((err) => {
    if (err) {
        throw err
    }
    console.log('Connected to database')
})
global.db = db

// Define application-specific data
app.locals.appName = {appName: "FlixList"}

app.use(expressSanitizer());

app.use((req, res, next) => {
    res.locals.user = req.session.userId || null; 
    next();
});

// Set up flash messages
app.use(flash());

// Routes
const mainRoutes = require("./routes/main")
app.use('/', mainRoutes)

const userRoutes = require('./routes/users')
app.use(`/users`, userRoutes)

// Load the route handlers for /books
const moviesRoutes = require('./routes/api/movies');
app.use(`/movies`, moviesRoutes);

// Load the route handlers for /books
const watchlistRoutes = require('./routes/api/watchlist');
app.use(`/watchlist`, watchlistRoutes);

// Load the route for api leaderboard
const leaderboardRoutes = require('./routes/leaderboard'); 
app.use(`/leaderboard`, leaderboardRoutes);

// Import the comments route
const commentsRoute = require('./routes/comments'); 
app.use(`/comments`, commentsRoute);

// Start the web app listening
app.listen(port, () => console.log(`Node app listening on port ${port}!`))