const express = require('express');
const authController = require('../controllers/auth');
const router = express.Router();
router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);
router.post('/signup', authController.postSignup);
router.get('/verify-email', authController.getEmailVerification);
router.post('/verify-email', authController.postEmailVerification);
router.post('/login', authController.postLogin);
router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);
router.get('/reset/:token', authController.getResetPage);
router.post('/reset', authController.postReset);
module.exports = router;