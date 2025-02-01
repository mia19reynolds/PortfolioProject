const express = require('express');
const router = express.Router();
const isAuthenticated = require('./auth');
const expressSanitizer = require('express-sanitizer');

// Route to fetch comments for a specific movie
router.get('/', (req, res) => {
    const imdb_id = req.sanitize(req.query.imdb_id);  // Get imdb_id from query parameters

    console.log(imdb_id)
    const sqlQuery = `
        SELECT comment, created_at
        FROM comments
        WHERE imdb_id = ?
        ORDER BY created_at DESC;
    `;

    db.query(sqlQuery, [imdb_id], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).json({ error: 'Failed to fetch comments' });
        }

        res.status(200).json({ comments: results });
    });
});

// Route to add a comment
router.post('/add', isAuthenticated, (req, res) => {
    const userId = req.sanitize(req.session.userId);
    const imdb_id = req.sanitize(req.body.imdb_id);
    const comment = req.sanitize(req.body.comment);

    if (!userId) {
        return res.redirect('/usr/352/users/login');
    }

    if (!imdb_id || !comment) {
        return res.status(400).json({ error: 'Missing imdb_id or comment text' });
    }

    // Insert the comment into the database
    const sqlInsert = `INSERT INTO comments (imdb_id, user_id, comment) VALUES (?, ?, ?)`;

    db.query(sqlInsert, [imdb_id, userId, comment], (err, result) => {
        if (err) {
            console.error('Error inserting comment:', err);
            return res.status(500).json({ error: 'Failed to submit comment' });
        }

        res.redirect(`/usr/352/movies/details?movieId=${imdb_id}`);
    });
});

module.exports = router;
