const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const transporter = nodemailer.createTransport(
    sendgridTransport({
        auth: {
            api_key:
                "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",
        },
    })
);
const otp = () => {
    let otp = "";
    for (let i = 1; i <= 6; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};
const User = require("../models/user");

exports.getLogin = (req, res, next) => {
    const errorMessage = req.flash("error").pop();
    const successMessage = req.flash("success").pop();
    res.render("auth/login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage,
        successMessage,
    });
};

exports.getSignup = (req, res, next) => {
    const errorMessage = req.flash("error").pop();
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage,
    });
};
exports.postSignup = async (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const user = await User.findOne({ email: email });
    if (user) {
        req.flash("error", "Email already exists");
        return res.redirect("/signup");
    } else {
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = name + "***" + email + "***" + hashedPassword;
        const otpSent = otp();
        const otpSentHash = await bcrypt.hash(otpSent, 12);
        req.flash("user", user);
        req.flash("otp", otpSentHash);
        req.flash("success", "Please enter OTP sent to your email");
        res.redirect("/verify-email");
        transporter.sendMail({
            to: email,
            from: "guptarahul70322@gmail.com",
            subject: "OTP for Email Verification",
            html: `<h1>Please Enter Below OTP to sign up</h1><br><p>OTP: ${otpSent}</p>`,
        })
    }
};
exports.getEmailVerification = (req, res, next) => {
    const user = req.flash("user").pop();
    const otpSent = req.flash("otp").pop();
    const errorMessage = req.flash("error").pop();
    const successMessage = req.flash("success").pop();
    res.render("auth/verify-email", {
        path: "/verify-email",
        pageTitle: "Email Verification",
        errorMessage,
        successMessage,
        otpSent,
        user,
    });
};
exports.postEmailVerification = async (req, res, next) => {
    const user = req.body.user;
    const otpUser = req.body.otp_user;
    const otpSent = req.body.otp_sent;
    const matched = await bcrypt.compare(otpUser, otpSent);
    if (matched) {
        const userData = user.split("***");
        const newUser = new User({
            name: userData[0],
            email: userData[1],
            password: userData[2],
            cart: {items: [], totalPrice: 0}
        });
        newUser.save()
            .then((result) => {
                req.flash("success", "Successfully signedup, please login");
                res.redirect("/login");
            })
            .catch((err) => console.log(err));
    } else {
        req.flash("user", user);
        req.flash("otp", otpSent);
        req.flash("error", "Wrong otp");
        res.redirect("/verify-email");
    }
};
exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                req.flash("error", "Invalid email");
                return res.redirect("/login");
            }
            // password -> String, user.password -> hash
            bcrypt
                .compare(password, user.password)
                .then((matched) => {
                    if (matched) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save((err) => {
                            if (err) console.log(err);
                            req.flash("success", "Login Successful");
                            res.redirect("/");
                        });
                    }
                    req.flash("error", "Invalid password");
                    res.redirect("/login");
                })
                .catch((err) => {
                    console.log(err);
                    res.redirect("/login");
                });
        })
        .catch((err) => console.log(err));
};
exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) console.log(err);
        res.redirect("/");
    });
};
