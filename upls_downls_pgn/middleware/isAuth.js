module.exports = (req, res, next) => { // using for checking whether logged in or not, if not then redirecting to login page
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
    }
    next();
}