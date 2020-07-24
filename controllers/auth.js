const bcrypt = require("bcryptjs");

const User = require("../models/user");

exports.getLogin = (req, res, next) => {
    const errorMessage = req.flash('error').pop();
    const successMessage = req.flash('success').pop();
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage,
        successMessage
    });
};

exports.getSignup = (req, res, next) => {
    const errorMessage = req.flash('error').pop();
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage
    });
};
exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    User.findOne({ email: email })
        .then((user) => {
            if (user) {
                req.flash('error', 'Email already exists');
                return res.redirect("/signup");
            }
            return bcrypt
                .hash(password, 12)
                .then((hashedPassword) => {
                    const newUser = new User({
                        name,
                        email,
                        password: hashedPassword,
                        cart: { items: [], totalPrice: 0 },
                    });
                    return newUser.save();
                })
                .then((result) => {
                    req.flash('success', 'Signed up successfully, Please login');
                    res.redirect("/login");
                });
        })
        .catch((err) => console.log(err));
};
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({email: email})
        .then((user) => {
            if (!user){
                req.flash('error', 'Invalid email');
                return res.redirect('/login');
            }
            // password -> String, user.password -> hash
            bcrypt.compare(password, user.password)
            .then(matched => {
                if (matched){
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    return req.session.save((err) => {
                        if (err) console.log(err);
                        req.flash('success', 'Login Successful');
                        res.redirect("/");
                    });
                }
                req.flash('error', 'Invalid password');
                res.redirect("/login");
            })
            .catch(err => {
                console.log(err);
                res.redirect('/login');
            })
        })
        .catch((err) => console.log(err));
};
exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.redirect("/");
    });
};
