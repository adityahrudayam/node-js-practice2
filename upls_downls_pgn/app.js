const path = require('path');

const session = require('express-session');
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const express = require('express');
const bodyParser = require('body-parser');
const csrf = require('csurf');
const multer = require('multer');
// const PDFDoc = require('pdfkit'); used in shopjs for creating pdfs
// 'nodemailer', 'sendgridTransport' used in adminjs to send mails
// 'crypto' is used in adminjs to create tokens (Here, data starts out as Buffer, then convert it to a hex string!)
// const flash = require('connect-flash'); 

// const Session = require('./models/session');
const sequelize = require('./util/database');
const errorController = require('./controllers/error');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');

const app = express();

const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now().toString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
        cb(null, true);//accepts & saves the incoming file!
    } else {
        cb(null, false);//declines the incoming file
    }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(session({ secret: 'long string in prod', resave: false, saveUninitialized: false, store: new SequelizeStore({ db: sequelize, checkExpirationInterval: 15 * 60 * 1000, expiration: 60 * 60 * 1000 }) }));//session is stored in memory if we u dont specify the store prop.Dont forget!
app.use(csrfProtection);//they are automatically added to the session & are stored in session!
// app.use(flash());
app.use((req, res, next) => {
    if (!req.session.userId) {
        return next();
    }
    User.findByPk(req.session.userId).then(user => {//req.session gives fetches the session data via the session_id stored in the cookie !
        req.user = user;
        next();
    }).catch(err => console.log(err));
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn; //Now theres no need to pass this as a prop. in the render Obj. as it is always available
    res.locals.csrfToken = req.csrfToken();//for every req. these 2 are set for the views that are rendered!
    next();
});

app.use((req, res, next) => {
    if (req.user) {
        req.user.getOrders({
            include: Product
        }).then(orders => {
            if (orders) {
                orders.forEach(order => {
                    if (order.products.length === 0) {
                        order.destroy().then(result => console.log(`Empty Order - ${order.id} Destroyed!`)).catch(err => console.log(err));
                    }
                });
            }
        }).catch(err => console.log(err));
    }
    next();
});

app.use('/admin', adminRoutes);
app.use(authRoutes);
app.use(shopRoutes);

app.use(errorController.get404);
// By default, the association is considered optional. In other words, in below example, the userId is allowed to be null, meaning that one cart can exist without a user. Changing this can be done by specifying allowNull: false in the foreign key options
User.hasOne(Cart, {
    constraints: true,
    onDelete: 'CASCADE',
    // foreignKey: { allowNull: false } Dont use this as this means 1 user cant exist without a cart
}); //1user-1cart
Cart.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });

User.hasMany(Order, { constraints: true, onDelete: 'CASCADE' }); //1user-manyords
Order.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });

User.hasMany(Product, { constraints: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' }); //1user-manyprods
Product.belongsTo(User, { constraints: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' });

Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });

Order.belongsToMany(Product, { through: OrderItem, onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Product.belongsToMany(Order, { through: OrderItem, onDelete: 'CASCADE', onUpdate: 'CASCADE' });

sequelize.sync().then(res => {
    app.listen(3000);
}).catch(err => console.log(err));