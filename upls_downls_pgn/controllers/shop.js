const fs = require('fs');
const path = require('path');

const { Op } = require('sequelize');
const PDFDoc = require('pdfkit');

const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');

const ITEMS_PER_PG = 2;

// const Cart = require('../models/cart');
// const Order = require('../models/order');


exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let items;
  Product.count().then(count => {
    items = count;
    return Product.findAll({
      limit: ITEMS_PER_PG,
      offset: (page - 1) * ITEMS_PER_PG
    });
  }).then(products => {
    res.render('shop/product-list', {
      path: '/products',
      pageTitle: 'All Products',
      isAuthenticated: req.session.isLoggedIn,
      prods: products,
      currentPage: page,
      hasNextPage: ITEMS_PER_PG * page < items,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(items / ITEMS_PER_PG)
    });
  }).catch(err => console.log(err));
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
  const page = +req.query.page || 1;
  let items;
  Product.count().then(prodCount => {
    items = prodCount;
    return Product.findAll({
      limit: ITEMS_PER_PG,
      offset: (page - 1) * ITEMS_PER_PG
    });
  }).then(products => {
    // console.log('getIndex! Here !');
    res.render('shop/index', {
      path: '/',
      pageTitle: 'Shop',
      isAuthenticated: req.session.isLoggedIn,
      prods: products,
      currentPage: page,
      hasNextPage: ITEMS_PER_PG * page < items,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(items / ITEMS_PER_PG)
    });
  }).catch(err => console.log(err));
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

exports.getInvoice = (req, res, next) => {
  const orderId = +req.params.orderId;
  Order.findByPk(orderId, { //an order belongs to one user => order.user field will be available now! and the foreign key referencing the user.id field of 'users' table will be placed in the orders table!
    include: [User, Product]
  }).then(order => {
    if (!order) {
      return res.render('admin/edit-product', {
        path: 'admin/add-product',
        pageTitle: 'Add Product',
        errorMsg: 'An Error Occurred! Regret the inconvenience! Try Again!',
        editing: false
      });
    }
    if (order.user.id !== req.user.id) {
      return res.render('admin/edit-product', {
        path: 'admin/add-product',
        pageTitle: 'Add Product',
        errorMsg: 'Not Authorized! Try Again!',
        editing: false
      });
    }
    const invoiceName = 'invoice-' + orderId.toString() + '.pdf';
    const invoicePath = path.join('invoices', invoiceName);
    const pdfdoc = new PDFDoc(); //this is also a readable stream!
    res.setHeader('Content-Type', 'application/pdf');//to set pdf document view and type!
    res.setHeader('Content-Disposition', 'inline'); //for setting browser view of the invoice pdf
    pdfdoc.pipe(fs.createWriteStream(invoicePath)); //pipe this to writable file stream to save it to that path in the system! This also gets stored on the server and not just served to the client!
    pdfdoc.pipe(res);//Now this data is also piped into the browser/<res object>!
    // pdfdoc.text('Hello World!'); // adds a single line of text into the pdf doc
    pdfdoc.fontSize(25).text('Invoice', {
      underline: true,
      align: 'center',
      lineGap: 10
    });
    let total = 0;
    order.products.forEach(product => {
      total += product.orderItem.qty * product.price;
      pdfdoc.fontSize(15).fillColor('black').font('Times-Roman').text(product.title + ' - ' + product.orderItem.qty + ': ' + ' $' + product.price + ' Each', { align: 'center', oblique: true, lineGap: 10 });
    });
    pdfdoc.fontSize(18).fillColor('black').text('Total Cost: $' + total, { align: 'center' });
    pdfdoc.end();//ends writing to that stream and will be closed so that the response is sent!
    // fs.readFile(invoicePath, (err, data) => { //Preloading the Data takes a lot of Time for bigger files and to serve such files the memory might overflow!Hence streaming the Data is a better approach!
    //   if (err) {
    //     return res.render('admin/edit-product', {
    //       path: 'admin/add-product',
    //       pageTitle: 'Add Product',
    //       errorMsg: 'An Error Occurred! Regret the inconvenience! Try Again!',
    //       editing: false
    //     });
    //   }
    //   res.setHeader('Content-Type', 'application/pdf');//to set pdf document view and type!
    //   res.setHeader('Content-Disposition', 'inline'); //for setting browser view of the invoice pdf
    //   // res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');//for setting the name of the downloaded attachment!
    //   res.send(data);
    // });

    // const file = fs.createReadStream(invoicePath);//better way is to stream the data!
    // file.pipe(res);//the readable stream data of file above is now piped into the res object which is a writable stream & hence this is possible!
  }).catch(err => {
    res.render('admin/edit-product', {
      path: 'admin/add-product',
      pageTitle: 'Add Product',
      errorMsg: 'An Error Occurred! Regret the inconvenience! Try Again!',
      editing: false
    });
  });
}


