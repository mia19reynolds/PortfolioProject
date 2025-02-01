const express = require('express');
const router = express.Router();
const isAuthenticated = require('../auth');
const expressSanitizer = require('express-sanitizer');

router.get('/', isAuthenticated, (req, res) => {
    const userId = req.session.userId; 
    
    if (!userId) {
        return res.redirect('/usr/352/users/login');
    }

    let query = req.sanitize(req.query.query) || '';  
    
    // SQL query to fetch the user's watchlist based on userId
    let sqlQuery = `
        SELECT watchlist.id, watchlist.user_id, watchlist.watched, watchlist.imdb_id, watchlist.title
        FROM watchlist 
        WHERE watchlist.user_id = ?`;

    let queryParams = [userId];  

    if (query) {
        sqlQuery += ' AND watchlist.title LIKE ?';
        queryParams.push(`%${query}%`);  
    }

    db.query(sqlQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching watchlist:', err);
            return res.status(500).send('Internal Server Error');
        }

        res.render('../views/pages/watchlist', { 
            items: results, 
            query: query  
        });
    });
});

// Add to Watchlist
router.post('/add', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' }); 
    }

        const movieId = req.sanitize(req.body.movieId);
        const title = req.sanitize(req.body.title);
        const action = req.sanitize(req.body.action);


    const sqlInsert = `
    INSERT INTO watchlist (user_id, watched, imdb_id, title)
    VALUES (?, ?, ?, ?);
    `;


    db.query(sqlInsert, [userId, "FALSE", movieId, title], (err, result) => {
        if (err) {
            console.error('Error adding item to watchlist:', err);
            return res.status(500).json({ error: 'Failed to add to watchlist' }); // Send error response
        }

        // Add movie to the session watchlist
        req.session.watchlist.push({ movieId });

        console.log(req.session)

        if (action === "details") {
          return res.redirect(`/usr/352/movies/details?movieId=${movieId}`);
      }
      res.redirect('/usr/352/movies/search');
  });
});

router.post('/delete', isAuthenticated, (req, res) => {
    const userId = req.session.userId;

    const movieId = req.sanitize(req.body.movieId);
    const title = req.sanitize(req.body.title);
    const action = req.sanitize(req.body.action);

    // Remove this from the database
    const sqlQuery = `
    DELETE FROM watchlist WHERE user_id = ? AND imdb_id = ?;
    `;

    db.query(sqlQuery, [userId, Number(movieId)], (err) => {
        if (err) {
            console.error('Error removing from watchlist:', err);
            return res.status(500).json({ success: false });
        }

        // Remove movie from the session watchlist
        req.session.watchlist = req.session.watchlist.filter(movie => movie.imdb_id !== movieId);

        
        if (action === "details") {
            return res.redirect(`/movies/details?movieId=${movieId}`);
        }
  });
});


router.post('/update', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const movieId = req.sanitize(req.body.movieId);
    const watched  = req.sanitize(req.body.watched);

    if (!userId) {
        return res.redirect('/users/login');
    }

    const newWatchedStatus = watched === 'TRUE' ? 'TRUE' : 'FALSE';
    const sqlUpdate = `UPDATE watchlist SET watched = ? WHERE user_id = ? AND imdb_id = ?`;

    db.query(sqlUpdate, [newWatchedStatus, userId, movieId], (err) => {
        if (err) {
            console.error('Error updating watch status:', err);
            return res.status(500).send('Error updating watch status');
        }

        if (!req.session.watchlist) req.session.watchlist = [];
        req.session.watchlist = req.session.watchlist.map(movie => {
            if (movie.imdb_id == movieId) {
                return { ...movie, watched: newWatchedStatus };
            }
            return movie;
        });

        const referer = req.get('Referer'); // Get the previous page URL
        if (referer.includes('/movies/details')) {
            return res.redirect(`/movies/details?movieId=${movieId}`);
        }
        return res.redirect('/watchlist'); // Redirect to watchlist if no referer
    });
});



module.exports = router;