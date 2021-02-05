const { Op } = require('sequelize');

const Product = require('../models/product');
const User = require('../models/user');

// const Cart = require('../models/cart');
// const Order = require('../models/order');


exports.getProducts = (req, res, next) => {
  Product.findAll().then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
      isAuthenticated: req.session.isLoggedIn
    });
  });
};

exports.getProduct = (req, res, next) => {
  const id = +req.params.productId;
  Product.findByPk(id).then(product => {
    if (!product) {
      return res.redirect('/404');
    }
    res.render('shop/product-detail', {
      path: '/products',
      pageTitle: product.title,
      product: product,
      isAuthenticated: req.session.isLoggedIn
    });
  });
  // Product.findAll({ where: { id: id } }).then(products => { //Another Way
  //   if (!products[0]) {
  //     return res.render('404', {
  //       pageTitle: 'Error',
  //       path: '/404',
  //     });
  //   }
  //   res.render('shop/product-detail', {
  //     path: '/products',
  //     pageTitle: products[0]?.title,
  //     product: products[0]
  //   });
  // });
};

exports.getIndex = (req, res, next) => {
  (async function () {
    Product.findAll().then(products => {
      console.log('getIndex! Here !');
      res.render('shop/index', {
        path: '/',
        pageTitle: 'Shop',
        isAuthenticated: req.session.isLoggedIn,
        prods: products
      });
    }).catch(err => console.log(err));
  })();
};

exports.postCart = (req, res, next) => {
  const id = +req.body.productId;
  let fetchedCart;
  let newQty = 1;
  req.user.getCart().then(cart => {
    fetchedCart = cart;
    return cart.getProducts({
      where: {
        id: {
          [Op.eq]: id
        }
      }
    });
  }).then(([product]) => {
    if (product) {
      newQty = product.cartItem.qty;
      newQty += 1;
      return product;
    }
    return Product.findByPk(id);
  }).then(product => {
    return fetchedCart.addProduct(product, {
      through: { //this will automatically add the <prodInst>.cartItem property to each Product instance of the cart
        qty: newQty
      }
    });
  }).then(() => {
    res.redirect('/cart');
  }).catch(err => console.log(err));
};

exports.postDeleteCartProduct = (req, res, next) => {
  const id = +req.body.productId;
  req.user.getCart().then(cart => {
    if (!cart) {
      res.redirect('/');
    }
    return cart.getProducts({
      where: {
        id: {
          [Op.eq]: id
        }
      }
    });
  }).then(([product]) => {
    if (!product) {
      res.redirect('/');
    }
    return product.cartItem.destroy();
  }).then(() => {
    res.redirect('/cart');
  }).catch(err => console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user.getCart().then(cart => {
    if (!cart) {
      res.redirect('/');
    }
    return cart.getProducts();
  }).then(products => {
    res.render('shop/cart', {
      path: '/cart',
      pageTitle: 'Your Cart',
      products,
      isAuthenticated: req.session.isLoggedIn
    });
  }).catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  let currCart;
  req.user.getCart().then(cart => {
    if (!cart) {
      res.redirect('/');
    }
    currCart = cart;
    return cart.getProducts();
  }).then(products => {
    return req.user.createOrder().then(order => {
      return order.addProducts(products.map(product => { // Returns the new detailed products list in the end with <orderItems>.qty set ! // for addProducts, set the orderItem manually and for addProduct, set the cartItem using extra param through: {qty: newQty} coz it needs only one qty value and here we need each products qty value
        product.orderItem = { qty: product.cartItem.qty };
        return product;
      }));
    }).then(prods => {
      return currCart.setProducts(null);
    }).then(() => res.redirect('/orders')).catch(err => console.log(err));
  }).then().catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  req.user.getOrders({ include: ['products'] }).then(orders => { //Eager loaded
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders,
      isAuthenticated: req.session.isLoggedIn
    });
  });
};


