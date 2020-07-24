const path = require("path");
const User = require("./models/user");
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require('csurf');
const flash = require('connect-flash');

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

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
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
    if (!req.session.user) return next();
    User.findById(req.session.user._id)
        .then((user) => {
           req.user = user;
            next();
        })
        .catch((err) => console.log(err));
})

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    res.locals.errorMessage = null;
    res.locals.successMessage = null;
    next();
})
app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use(errorController.get404);

mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => {
        app.listen(3000);
    })
    .catch((err) => {
        console.log(err);
    });
