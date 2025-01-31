const express = require('express');
const router = express.Router();

router.get('/leaderboard', (req, res) => {
    const sqlQuery = `
        SELECT title, imdb_id, COUNT(*) AS watch_count 
        FROM watchlist 
        WHERE watched = 'TRUE' 
        GROUP BY imdb_id, title 
        ORDER BY watch_count DESC 
        LIMIT 10;
    `;

    db.query(sqlQuery, (err, results) => {
        if (err) {
            console.error('Error fetching leaderboard:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        
        res.json({ leaderboard: results });
    });
});

module.exports = router;
