const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

// const Product = require('../models/product');
const User = require('../models/user');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  // if(!req.session.isLoggedIn){ //There is a better way than this !
  //   return res.redirect('/login');
  // }
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMsg: null
    // isAuthenticated: req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {//Dont do any conversions, formatting of data for neat display here becoz it needs to be done on the front end
  const { title, price, description } = req.body;
  const image = req.file;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      product: { title, price: +price, description },
      errorMsg: 'Attached file is not an Image!'
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMsg: errors.array()?.[0].msg
    });
  }
  const imageUrl = image.path;
  req.user.createProduct({//returning the promise to add then
    title,
    price: +price,
    imageUrl,
    description
  }).then(product => {
    console.log(product);
    res.redirect('/');
  }).catch(err => console.log(err));
};

exports.getEditProduct = (req, res, next) => {
  const canEdit = req.query.edit == 'true' ? true : false;
  if (!canEdit) {
    return res.redirect('/');
  }
  const id = +req.params.productId;
  req.user.getProducts({//prmis and its res_val is caught in next blck
    where: {
      id: id
    }
  }).then(([product]) => {
    if (!product) {
      return res.redirect('/404');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: canEdit,
      product: product,
      errorMsg: null
    });
  }).catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const { title, price, description, productId } = req.body;
  const image = req.file;
  // const canEdit = req.query.edit == 'true' ? true : false;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      product: { title, price, description, id: +productId },
      errorMsg: errors.array()?.[0].msg
    });
  }
  req.user.getProducts({
    where: {
      id: +productId
    }
  }).then(([product]) => {
    if (!product) {
      return res.redirect('/404');
    }
    product.title = title;
    product.description = description;
    product.price = +price;
    if (image) {
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }
    product.save().then((product) => {
      res.redirect('/admin/products');
    }).catch(err => console.log(err));
  }).catch(err => console.log(err));
};

exports.postDeleteProduct = (req, res, next) => {
  const id = +req.body.productId;
  req.user.getProducts({
    where: {
      id: {
        [Op.eq]: id
      }
    }
  }).then(([product]) => {
    if (!product) {
      return res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        errorMsg: 'An Error occurred! Either the product does not exist or you did not create the product!'
      });
    }
    fileHelper.deleteFile(product.imageUrl);
    product.destroy().then(result => {
      console.log('Product deleted successfully!');
      res.redirect('/admin/products');
    }).catch(err => {
      res.render('admin/edit-product', {
        path: 'admin/add-product',
        pageTitle: 'Add Product',
        editing: false,
        errorMsg: 'An error occurred! Please try again!'
      });
    });
  }).catch(err => console.log(err));
}

exports.getProducts = (req, res, next) => {
  // if (!req.session.isLoggedIn) {
  //   return setTimeout(() => {
  //     return res.redirect('/');
  //   }, 100);
  // }
  req.user.getProducts().then(products => {
    res.render('admin/products', {
      path: '/admin/products',
      pageTitle: 'Admin Products',
      prods: products
      // isAuthenticated: req.session.isLoggedIn
    });
  }).catch(err => console.log(err));
};
