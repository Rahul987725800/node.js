module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        return res.redirect('/login');
        /* 
        here we redirect unauthenticated user to login page
        it makes sense to set status 401
        but if we do res.status(401).redirect('/login'); 
        it will set status code 300 by default because of redirection
        we will see how to deal with this in rest api section
        where we don't render views but just return data
        */
    }
    next();
}