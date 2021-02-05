const path = require('path');

const express = require('express');
const { check, body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.get('/products', isAuth, adminController.getProducts);

router.post('/add-product', isAuth,
    [
        body('title')
            .notEmpty()
            .withMessage('Please do not leave any field empty!')
            .trim(),
        body('price')
            .notEmpty()
            .withMessage('Fill price !')
            .trim()
            .isCurrency({ digits_after_decimal: [1, 2] })
            .withMessage('Please enter a price with upto only 2 decimal places!'),
        body('description', 'Please enter some description!')
            .notEmpty()
            .trim()
    ], adminController.postAddProduct);

router.post('/edit-product', isAuth,
    [
        body('title')
            .notEmpty()
            .withMessage('Please do not leave any field empty!')
            .trim(),
        body('price')
            .notEmpty()
            .withMessage('Fill price !')
            .trim()
            .isCurrency({ digits_after_decimal: [1, 2] })
            .withMessage('Please enter a price with upto only 2 decimal places!'),
        body('description', 'Please enter some description!')
            .notEmpty()
            .trim()
    ], adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

module.exports = router;
