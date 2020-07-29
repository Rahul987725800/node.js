const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector("[name=productId]").value;
    const csrf = document.getElementById("csrf").value;
    const productElement = btn.closest("article");
    fetch("/admin/product/" + prodId, {
        method: "DELETE",
        headers: {
            "csrf-token": csrf,
        },
    })
        .then((result) => result.json())
        .then((data) => {
            console.log(data);
            productElement.remove();
        })
        .catch((err) => console.log(err));
};

const addRandomProduct = async () => {
    const quote = await fetch("https://random-math-quote-api.herokuapp.com/")
        .then((result) => result.json())
        .catch((err) => console.log(err));
    let error = false;
    let imageUrl = await fetch(
        `https://pixabay.com/api/?key=17680077-5379330bb2bfdd84dbfbdb87f&id=${quote.id}&image_type=photo&pretty=true`
    )
        .then((result) => result.json())
        .then((data) => data.hits[0].webformatURL)
        .catch(err => {error = true});
    if (error){
        imageUrl = "https://new-img.patrika.com/upload/2019/06/13/disha2_4702636_835x547-m.jpg";
    }

    const csrf = document.getElementById("csrf").value;

   

    fetch("/admin/add-random-product", {
        method: "POST",
        body: JSON.stringify({
            title: quote.author,
            price: quote.id,
            imageUrl: imageUrl,
            description: quote.quote,
        }),
        headers: {
            "csrf-token": csrf,
            "Content-Type": "application/json",
        },
    })
        .then((result) => result.json())
        .then((data) => {
            console.log(data);
            const productList = document.getElementsByClassName("grid")[0];
            if (productList && productList.querySelector("article")) {
                const newProduct = productList.querySelector("article").cloneNode(true);
                newProduct.querySelector("#title").innerHTML = data.title;
                newProduct
                    .querySelector("#image")
                    .setAttribute("src", data.imageUrl);
                newProduct
                    .querySelector("#image")
                    .setAttribute("alt", data.title);
                newProduct.querySelector("#price").innerHTML = "$" + data.price;
                newProduct.querySelector("#description").innerHTML =
                    data.description;
                newProduct.querySelector("#_id").value = data._id;
                productList.appendChild(newProduct);
            } else {
                location.reload();
            }
            
        })
        .catch((err) => console.log(err));
};
const deleteAllProducts = () => {
    const csrf = document.getElementById("csrf").value;
    const productList = document.getElementsByClassName("grid")[0];
    fetch("/admin/products", {
        method: "DELETE",
        headers: {
            "csrf-token": csrf,
        },
    })
        .then((result) => result.json())
        .then((data) => {
            console.log(data);
            if (productList)
                productList.remove();
        })
        .catch((err) => console.log(err));
}