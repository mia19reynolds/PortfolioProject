// Create a new router
const express = require("express")
const router = express.Router()
const bcrypt = require('bcrypt');
const isAuthenticated = require('./auth');
const request = require('request');

let apiKey = 'a646101ee6c12f017d2d957d18bc2323';

// Route to get trending and upcoming movies
router.get('/', isAuthenticated, (req, res, next) => {
    const trendingUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`;

    request(trendingUrl, function (err, response, body) {
        if (err) {
            return next(err);
        }

        const trendingData = JSON.parse(body);
        const trendingMovies = trendingData.results.slice(0, 5).map(movie => ({
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            poster: `https://image.tmdb.org/t/p/w500` + movie.poster_path
        }));

        res.render('../views/pages/home.ejs', {
            error: null,
            trendingMovies: trendingMovies,
        });
    });
});


router.get('/about', isAuthenticated, (req, res) => {
    res.render('../views/pages/about.ejs', {title: 'About' });
});

router.get('/logout', (req,res) => {
    req.session.destroy(() => {
        res.redirect('/users/login');
    });
});

// Export the router object so index.js can access it
module.exports = router