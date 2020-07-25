const { validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");
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
        oldInput: {
            email: '',
            password: ''
        },
        errorFields: []
    });
};

exports.getSignup = (req, res, next) => {
    const errorMessage = req.flash("error").pop();
    res.render("auth/signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage,
        oldInput: null,
        errorFields: []
    });
};
exports.postSignup = async (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("auth/signup", {
            path: "/signup",
            pageTitle: "Signup",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                name, email, password, confirmPassword
            },
            errorFields: errors.array().map(e => e.param)
        });
    }

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
    });
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
            cart: { items: [], totalPrice: 0 },
        });
        newUser
            .save()
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render("auth/login", {
            path: "/login",
            pageTitle: "Login",
            errorMessage: errors.array()[0].msg,
            // we are always extracting first error message
            oldInput: {
                email, password
            },
            errorFields: errors.array().map(e => e.param)
        });
    }
    User.findOne({ email: email })
        .then((user) => {
            if (!user) {
                return res.render("auth/login", {
                    path: "/login",
                    pageTitle: "Login",
                    errorMessage : "No user exist with provided email",
                    oldInput: {
                        email, password
                    },
                    errorFields: ['email']
                });
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
                    res.render("auth/login", {
                        path: "/login",
                        pageTitle: "Login",
                        errorMessage : "Incorrect password",
                        oldInput: {
                            email, password
                        },
                        errorFields: ['password']
                    });
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

exports.getReset = async (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        const token = buffer.toString("hex"); // buffer contains hexadecimal values
        // toString('hex') converts it asci characters
        User.findOne({ email: req.user.email })
            .then((user) => {
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then((result) => {
                req.flash(
                    "success",
                    "Please check your email for link to reset password"
                );
                res.redirect("/");
                transporter.sendMail({
                    to: req.user.email,
                    from: "guptarahul70322@gmail.com",
                    subject: "Password Reset",
                    html: `
                <p>You requested a password reset</p>
                <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
                `,
                });
            })
            .catch((err) => console.log(err));
    });
};
exports.getResetPage = (req, res, next) => {
    const token = req.params.token;
    const errorMessage = req.flash("error").pop();
    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
    })
        .then((user) => {
            if (!user) {
                req.flash("error", "Invalid or Expired Token");
                res.redirect("/");
            } else {
                res.render("auth/reset", {
                    path: "/reset",
                    pageTitle: "Reset Password",
                    resetToken: token,
                    errorMessage,
                });
            }
        })
        .catch((err) => console.log(err));
};
exports.postReset = (req, res, next) => {
    const newPassword = req.body.new_password;
    const oldPassword = req.body.old_password;
    const token = req.body.resetToken;
    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
    })
        .then(async (user) => {
            if (!user) {
                req.flash("error", "Invalid or Expired Token");
                return res.redirect("/");
            }
            const matched = await bcrypt.compare(oldPassword, user.password);
            if (matched) {
                const hashedPassword = await bcrypt.hash(newPassword, 12);
                user.password = hashedPassword;
                user.resetToken = undefined;
                user.resetTokenExpiration = undefined;
                return user
                    .save()
                    .then((user) => {
                        req.session.destroy((err) => {
                            if (err) console.log(err);
                            res.redirect("/login");
                        });

                        transporter.sendMail({
                            to: user.email,
                            from: "guptarahul70322@gmail.com",
                            subject: "Password Reset",
                            html: `
                    <p>Your password has been reset</p>
                    `,
                        });
                    })
                    .catch((err) => console.log(err));
            } else {
                req.flash(
                    "error",
                    "Old Password entered was incorrect, please try again"
                );
                res.redirect(`/reset/${token}`);
            }
        })

        .catch((err) => console.log(err));
};
