const path = require("path");
const User = require("./models/user");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");

const errorController = require("./controllers/error");
// const User = require("./models/user");
const app = express();
const uri =
    "mongodb://localhost:27017/shop?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
const store = new MongoDBStore({
    uri: uri,
    collection: "sessions",
});

const csrfProtection = csrf();
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
        // make sure to create images folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' +file.originalname);
    },
});
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};
app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");


app.use(bodyParser.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
})
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"));

app.use(express.static(path.join(__dirname, "public")));
app.use('/images', express.static(path.join(__dirname, "images")));
app.use(
    session({
        secret: "my secret",
        resave: false,
        saveUninitialized: false,
        store: store,
    })
);
app.use(csrfProtection);

// this must be after setting up session
app.use(flash());

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    res.locals.errorMessage = null;
    res.locals.successMessage = null;
    next();
});
 
app.use((req, res, next) => {
    // throw new Error('Sync Dummy');
    /* Very Important
        in case of synchronous code just throwing an error
        works and it is catched by error handling middleware
        for asynchronous code, using promises(in then and catch blocks) and callbacks
        use next(err); 
    */
    if (!req.session.user) return next();
    // if no user in the session we exit
    User.findById(req.session.user._id)
        .then((user) => {
            // throw new Error('Dummy');
            if (!user) {
                // if user present in session but not available in database
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            next(err);
            // technical issue, we are unable to connect to database
        });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get("/500", errorController.get500);
app.use(errorController.get404);

// error handling middleware
// handles throw in synchronous code
// next(error) in asynchronous code in Promises and callbacks
app.use((error, req, res, next) => {
    if (error.httpStatusCode) res.status(error.httpStatusCode);
    res.render("500", {
        pageTitle: "Error!",
        path: "/500",
        error: error ? error : "" 
    });
});
// we can have multiple middlewares they will be handled sequentially
mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        app.listen(3000);
    })
    .catch((err) => {
        console.log(err);
    });
