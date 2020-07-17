const path = require('path');
const express= require('express');
const router = express.Router();
const rootDir = require('../util/path');
router.get('/', (req, res, next) => {
    // rootDir = C:\Users\Rahul Gupta\Desktop\node 2\Basics
    res.sendFile(path.join(rootDir, 'views', 'shop.html'));
})

module.exports = router;