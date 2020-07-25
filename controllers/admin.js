const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
        pageTitle: "Add Product",
        path: "/admin/add-product",
        editing: false,
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
    // userId: req.user._id not needed
    const product = new Product({
        title,
        price,
        description,
        imageUrl,
        userId: req.user,
    });

    product
        .save()
        .then((result) => {
            // console.log(result);
            res.redirect("/admin/products");
        })
        .catch((err) => console.log(err));
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit === "true"; // "true"
    if (!editMode) return res.redirect("/"); // we reached edit with setting edit query param
    const prodId = req.params.productId;
    Product.findOne({ _id: prodId, userId: req.user._id })
        .then((product) => {
            if (!product) {
                // we don't take user to edit page
                req.flash(
                    "error",
                    "You are not authorised to edit that product."
                );
                return res.redirect("/");
            }
            res.render("admin/edit-product", {
                pageTitle: "Edit Product",
                path: "/admin/edit-product",
                editing: editMode,
                product: product,
            });
        })
        .catch((err) => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageUrl = req.body.imageUrl;
    const updatedDescription = req.body.description;
    Product.findById(prodId)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                // we don't move forward with post edit request too
                req.flash(
                    "error",
                    "You are not authorised to edit that product."
                );
                return res.redirect("/");
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.imageUrl = updatedImageUrl;
            product.description = updatedDescription;
            return product.save().then((result) => {
                // console.log(result); // saved product
                res.redirect("/admin/products");
            });
        })

        .catch((err) => console.log(err));
};

exports.getProducts = (req, res, next) => {
    const successMessage = req.flash("success").pop();
    // we only show the products which user has added and thereby authorised to 
    // edit and delete
    Product.find({ userId: req.user._id })
        // .select('title price -_id') // selecting particular fields that we want
        // .populate('userId', 'name') // populted userId with user information
        .then((products) => {
            res.render("admin/products", {
                prods: products,
                pageTitle: "Admin Products",
                path: "/admin/products",
                successMessage,
            });
        })
        .catch((err) => console.log(err));
};
exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    // giving condition userId: req.user._id ensures that 
    // product is deleted only if created by logged in user.
    Product.deleteOne({ _id: prodId, userId: req.user._id }, (err) => {
        if (err) console.log(err);
        req.flash("success", "Product deleted successfully");
        res.redirect("/admin/products");
    });
};
exports.getProfile = (req, res, next) => {
    res.render("admin/profile", {
        path: "/admin/profile",
        pageTitle: req.user.name,
        name: req.user.name,
        email: req.user.email,
    });
};
