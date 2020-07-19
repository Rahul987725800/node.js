const express = require("express");
const shopController = require('../controllers/shop');
const router = express.Router();

router.get("/", shopController.getIndex);
router.get('/product-list', shopController.getProductList);
router.get('/cart', shopController.getCart);
router.get('/checkout', shopController.getCheckout);
router.get('/orders', shopController.getOrders);
module.exports = router;
