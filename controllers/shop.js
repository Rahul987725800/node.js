const Product = require("../models/product");
const Order = require("../models/order");
const { unsubscribe } = require("../routes/shop");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
exports.getProducts = (req, res, next) => {
    Product.find() // .cursor().next() can be used
        .then((products) => {
            res.render("shop/product-list", {
                prods: products,
                pageTitle: "All Products",
                path: "/products",
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            res.render("shop/product-detail", {
                product: product,
                pageTitle: product.title,
                path: "/products",
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};

exports.getIndex = (req, res, next) => {
    const successMessage = req.flash("success").pop();
    const errorMessage = req.flash("error").pop();
    Product.find()
        .then((products) => {
            res.render("shop/index", {
                prods: products,
                pageTitle: "Shop",
                path: "/",
                successMessage,
                errorMessage,
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then(async (user) => {
            const products = [];
            for (let item of user.cart.items) {
                if (item.productId) {
                    // if we able to populate data then only
                    products.push({
                        ...item.productId._doc,
                        quantity: item.quantity,
                    });
                }
            }

            if (products.length < user.cart.items.length) {
                await user.adjustCartForDeletedProducts(products);
            }
            return [products, user.cart.totalPrice];
        })
        .then(([products, totalPrice]) => {
            // console.log(products);
            res.render("shop/cart", {
                path: "/cart",
                pageTitle: "Your Cart",
                products: products,
                totalPrice: totalPrice,
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then((product) => {
            return req.user.addToCart(product);
        })
        .then((result) => {
            res.redirect("/cart");
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then((product) => {
            return req.user.removeFromCart(product);
        })
        .then((result) => {
            res.redirect("/cart");
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.getOrders = (req, res, next) => {
    Order.find({ "user._id": req.user._id })
        .then((orders) => {
            res.render("shop/orders", {
                path: "/orders",
                pageTitle: "Your Orders",
                orders: orders,
            });
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.postOrder = (req, res, next) => {
    req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then((user) => {
            const products = user.cart.items.map((item) => ({
                ...item.productId._doc,
                quantity: item.quantity,
            }));
            return [products, user.cart.totalPrice];
        })
        .then(([products, totalPrice]) => {
            const order = new Order({
                user: {
                    _id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                },
                products,
                totalPrice,
            });
            return order.save();
        })
        .then((res) => {
            return req.user.clearCart();
        })
        .then((result) => {
            res.redirect("/orders");
        })
        .catch((err) => {
            err.httpStatusCode = 500;
            return next(err);
        });
};
exports.getCheckout = (req, res, next) => {
    res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
    });
};
exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId)
        .then((order) => {
            if (!order) {
                return next(new Error("No order found"));
            }
            if (order.user._id.toString() !== req.user._id.toString()) {
                return next(new Error("Unauthorised"));
            }
            const invoiceName = "invoice-" + orderId + ".pdf";
            const invoicePath = path.join("data", "invoices", invoiceName);
            res.setHeader("Content-type", "application/pdf");
            // res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
            res.setHeader(
                "Content-Disposition",
                'inline; filename="' + invoiceName + '"'
            );

            if (fs.existsSync(invoicePath)) {
                // console.log('read existing file');
                file = fs.createReadStream(invoicePath);
                file.pipe(res);
            } else {
                // console.log('created new file');
                const pdfDoc = new PDFDocument();
                pdfDoc.pipe(fs.createWriteStream(invoicePath));
                pdfDoc.pipe(res);
                pdfDoc.fontSize(26).text("Invoice", {
                    underline: true,
                });
                pdfDoc.text("------------------------");
                order.products.forEach((prod) => {
                    pdfDoc
                        .fontSize(16)
                        .text(
                            prod.title +
                                " - " +
                                prod.quantity +
                                " x " +
                                prod.price +
                                " = " +
                                prod.quantity * prod.price
                        );
                });
                pdfDoc.text("------------------------");
                pdfDoc.fontSize(20).text("Total Price: " + order.totalPrice);
                pdfDoc.end();
            }

            /*
            // This will read entire file and then serve
            fs.readFile(invoicePath, (err, data) => {
                if (err) next(err);
                res.send(data);
            });
            */
        })
        .catch((err) => next(err));
};
