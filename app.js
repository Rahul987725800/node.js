const path = require("path");
const User = require('./models/user');
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const errorController = require("./controllers/error");
// const User = require("./models/user");
const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
    User.findById("5f18a8b67debc141f4b44708")
        .then((user) => {
            req.user = user;
            next();
        })
        .catch((err) => console.log(err));
});
app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use(errorController.get404);
const uri =
    "mongodb://localhost:27017/shop?readPreference=primary&appname=MongoDB%20Compass%20Community&ssl=false";
mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true})
.then(result => {
    return User.findOne().then(user => {
        if (!user){
            const user = new User({
                name: 'Rahul', 
                email: 'guptarahul@gmail.com',
                cart: {
                    items: [], 
                    totalPrice: 0
                }
            });
            return user.save();
        }
        return user;
    })
})
.then(user => {
    // console.log(user);
    app.listen(3000);
})
.catch(err => {
    console.log(err);
});
