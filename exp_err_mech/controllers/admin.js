const { Op } = require('sequelize');

// const Product = require('../models/product');
const User = require('../models/user');

exports.getAddProduct = (req, res, next) => {
  // if(!req.session.isLoggedIn){ //There is a better way than this !
  //   return res.redirect('/login');
  // }
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false
    // isAuthenticated: req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {//Dont do any conversions, formatting of data for neat display here becoz it needs to be done on the front end
  const { title, imageUrl, price, description } = req.body;
  req.user.createProduct({//returning the promise to add then
    title,
    price: +price,
    imageUrl,
    description
  }).then(product => {
    console.log(product);
    res.redirect('/');
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
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
      product: product
      // isAuthenticated: req.session.isLoggedIn
    });
  }).catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const { title, imageUrl, price, description, productId } = req.body;
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
    product.imageUrl = imageUrl;
    return product.save();
  }).then((product) => {
    res.redirect('/admin/products');
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
      return;
    }
    return product.destroy();
  }).then(result => {
    console.log('Deleted! result =', result);
    res.redirect('/admin/products');
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
