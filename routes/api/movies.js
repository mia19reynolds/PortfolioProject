const express = require('express');
const router = express.Router();
const request = require('request');
const isAuthenticated = require('../auth');
const { check, validationResult } = require('express-validator');
const expressSanitizer = require('express-sanitizer');

let apiKey = '*************';

// Search Route with validation and sanitization
router.get('/search', [
    check('query')
        .notEmpty().withMessage('Search query is required') // Validate that query is not empty
        .isLength({ max: 30 }).withMessage('Search query should be less than 255 characters') // Limit length
], isAuthenticated, (req, res) => {
    const errors = validationResult(req); // Check if validation fails
    if (!errors.isEmpty()) {
        return res.render('../views/pages/search', {
            error: errors.array()[0].msg, // Show the first error message
            movies: null,
        });
    }

    let query = req.sanitize(req.query.query)
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=${apiKey}`;

    // Check if user has a watchlist in session
    const watchlist = req.session.watchlist || [];

    request(url, function (err, response, body) {
        if (err) {
            return next(err); // Pass the error to the error handler
        }

        const data = JSON.parse(body);
        const movies = data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            poster: `https://image.tmdb.org/t/p/w500` + movie.poster_path,
            isInWatchlist: watchlist.some(watchlistMovie => Number(watchlistMovie.imdb_id) == movie.id),
        }));

        res.render('../views/pages/search', {
            error: null,
            movies: movies,
            watchlist: watchlist,
        });
    });
});

router.get('/details', [
    check('movieId')
        .notEmpty().withMessage('Movie ID is required') 
        .isNumeric().withMessage('Movie ID must be a valid number') 
], isAuthenticated, (req, res) => {
    const errors = validationResult(req); 
    if (!errors.isEmpty()) {
        return res.status(400).send(errors.array()[0].msg); 
    }

    const userId = req.session.userId;
    let movie_Id = req.query.movieId;
    const movieId = req.sanitize(movie_Id); 

    if (!userId) {
        return res.redirect('/users/login'); 
    }

    // Fetch movie details from TMDB API
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`;

    request(url, (err, response, body) => {
        if (err) {
            console.error('Error fetching movie details:', err);
            return res.render('movieDetails', {
                error: 'Unable to fetch movie details.',
                movie: null,
                comments: [],
            });
        }

        const movie = JSON.parse(body);

        // Fetch comments for this movie from the database
        const sqlQuery = `SELECT * FROM comments WHERE imdb_id = ? ORDER BY created_at DESC`;

        db.query(sqlQuery, [movieId], (dbErr, comments) => {
            if (dbErr) {
                console.error('Error fetching comments:', dbErr);
                return res.status(500).send('Error fetching comments');
            }

            // Check if the movie is in the user's watchlist
            const watchlistQuery = `SELECT * FROM watchlist WHERE user_id = ? AND imdb_id = ?`;
            db.query(watchlistQuery, [userId, movieId], (watchlistErr, results) => {
                if (watchlistErr) {
                    console.error('Error checking watchlist:', watchlistErr);
                    return res.status(500).send('Error checking watchlist');
                }

                const isInWatchlist = results.length > 0;
                const watched = isInWatchlist ? results[0].watched : 'FALSE';

                // Render movie details page with comments
                res.render('../views/pages/movieDetails', {
                    error: null,
                    movie: movie,
                    isInWatchlist: isInWatchlist,
                    watched: watched,
                    comments: comments, 
                });
            });
        });
    });
});

// Route to get trending and upcoming movies
router.get('/trending-upcoming', isAuthenticated, (req, res, next) => {
    const trendingUrl = `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`;
    const upcomingUrl = `https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&region=US`;

    request(trendingUrl, function (err, response, body) {
        if (err) {
            return next(err);
        }

        const trendingData = JSON.parse(body);
        const trendingMovies = trendingData.results.slice(0, 5).map(movie => ({
            id: movie.id,
            title: movie.title,
            release_date: movie.release_date,
            poster: `https://image.tmdb.org/t/p/w500` + movie.poster_path
        }));

        request(upcomingUrl, function (err, response, body) {
            if (err) {
                return next(err);
            }

            const upcomingData = JSON.parse(body);
            const upcomingMovies = upcomingData.results.slice(0, 5).map(movie => ({
                id: movie.id,
                title: movie.title,
                release_date: movie.release_date,
                poster: `https://image.tmdb.org/t/p/w500` + movie.poster_path
            }));

            res.render('../views/pages/trendingUpcoming', {
                error: null,
                trendingMovies: trendingMovies,
                upcomingMovies: upcomingMovies
            });
        });
    });
});

module.exports = router;