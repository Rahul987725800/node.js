const express = require("express");
const { check, body } = require("express-validator");
// check looks for parameter provided to it eg 'email' in
// body, param, query, cookie, header
// we can use just body to be specific that validate 'email' in req.body.email
const User = require("../models/user");
const authController = require("../controllers/auth");
const router = express.Router();
router.get("/login", authController.getLogin);
router.get("/signup", authController.getSignup);
router.post(
    "/signup",

    [
        check('name')
        .isLength({min: 1})
        .withMessage("Username can't be empty")
        .trim(), // trim is for sanitizing input to remove whitespaces if any at start and end
        check("email")
            .isEmail() // form checks for just @ this validator also checks for @something.com
            .withMessage("Please enter a valid email")
            // this is a message for isEmail validator
            // if we want same message for all validators
            // provide it as second argument to check function
            // see password validator
            .custom(async (value, { req, location, path }) => {
                // we can access req, location path
                const user = await User.findOne({ email: value });
                if (user) {
                    throw new Error(
                        "Email exists already, please use another email"
                    );
                }
                return true;
            })
            .normalizeEmail(),
        body(
            "password",
            `
        Password should be minimum 5 characters long
        and it must contain a upperCase, a lowerCase, a digit and a special character
        `
        )
            .isLength({ min: 5 }) // not needed though as regex is also checking this
            .custom((value) => {
                const pattern = new RegExp(
                    "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{5,}$"
                );
                return pattern.test(value);
            }),
        // isAlphanumeric();
        body("confirmPassword").custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Password fields don't match");
            }
            return true;
        }),
    ],
    authController.postSignup
);
router.get("/verify-email", authController.getEmailVerification);
router.post("/verify-email", authController.postEmailVerification);
router.post(
    "/login",
    body('email').isEmail().withMessage("Please enter a valid email").normalizeEmail(),
    // normalizeEmail removes whitespaces and converts it lowerCase
    authController.postLogin
);
router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);
router.get("/reset/:token", authController.getResetPage);
router.post("/reset", authController.postReset);
module.exports = router;
