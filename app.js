const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.set('view engine', 'ejs');

const adminData = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminData.routes);
app.use(shopRoutes);

app.use((req, res, next) => {
    res.render('404', {docTitle: 'Page Not Found', path: ''})
});

app.listen(3000);
