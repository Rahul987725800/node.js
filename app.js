const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
// for express handle bars we have to set it up
const expressHbs = require('express-handlebars');
const app = express();
app.engine('hbs', expressHbs({layoutsDir: 'views/layouts/', defaultLayout: 'main-layout', extname: 'hbs'}));
app.set('view engine', 'hbs');

const adminData = require('./routes/admin');
const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin', adminData.routes);
app.use(shopRoutes);

app.use((req, res, next) => {
    res.render('404', {docTitle: 'Page Not Found'})
});

app.listen(3000);
