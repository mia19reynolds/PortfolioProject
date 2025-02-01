const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        res.locals.user = req.session.userId;
        next(); // User is authenticated, proceed 
    } else {
        res.locals.user = null;
        req.flash('error', 'You must be logged in to view this page.');
        res.redirect('/usr/352/users/login');  // Redirect to login if not authenticated
    }
};

module.exports = isAuthenticated;