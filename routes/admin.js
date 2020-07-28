const path = require("path");
const { body } = require("express-validator");
const express = require("express");
const isAuth = require("../middleware/is-auth");
const adminController = require("../controllers/admin");

const router = express.Router();

router.get("/add-product", isAuth, adminController.getAddProduct);

router.post("/add-product",  [
    body('title').isString().isLength({min: 3, max: 20}).trim(),
    body('price').isNumeric(), // integers or floats
    body('description').isLength({min: 5, max: 400}).trim()
], isAuth, adminController.postAddProduct);



router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);
router.post("/edit-product", [
    body('title').isString().isLength({min: 3, max: 20}).trim(),
    body('price').isNumeric(), // integers or floats
    body('description').isLength({min: 5, max: 400}).trim()
], isAuth, adminController.postEditProduct);

router.get("/products", isAuth, adminController.getProducts);


router.post("/delete-product", isAuth, adminController.postDeleteProduct);
router.get("/profile", isAuth, adminController.getProfile);
module.exports = router;
