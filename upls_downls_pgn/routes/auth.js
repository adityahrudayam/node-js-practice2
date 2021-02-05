const express = require('express');
const { check, body } = require('express-validator');
const { Op } = require('sequelize');

const authController = require('../controllers/auth');

const User = require('../models/user');

const router = express.Router();

router.post('/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email !')
            .normalizeEmail()
            .custom((value, { req }) => {
                return User.findOne({
                    where: {
                        email: {
                            [Op.eq]: value
                        }
                    }
                }).then(user => {
                    if (!user) {
                        return Promise.reject('No such user with the given email !');
                    }
                });
            }),
        body('password', 'Invalid Password!')
            .isLength({ min: 5, max: 30 })
            .isAlphanumeric()
            .trim()
    ], authController.postLogin);

router.post('/logout', authController.postLogout);

router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email !')
            .normalizeEmail()
            .custom((value, { req }) => {
                return User.findOne({ //express-validator will wait for us here for the promise to resolve!
                    where: {
                        email: {
                            [Op.eq]: value
                        }
                    }
                }).then(user => {
                    if (user) {
                        return Promise.reject('E-mail already exists! Please use a different one!');
                    }
                });
            }),
        body('password', 'Please enter a password with only numbers/text and atleast 5 chars long !')
            .isLength({ min: 5, max: 30 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Enter same passwords in both the fields!');
                }
                return true; //no error
            })
    ],
    authController.postSignup);

router.post('/reset', authController.postReset);

router.post('/new-password', authController.postNewPassword);

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.get('/reset/:token', authController.getNewPassword);

module.exports = router;