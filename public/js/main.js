const backdrop = document.querySelector(".backdrop");
const sideDrawer = document.querySelector(".mobile-nav");
const menuToggle = document.querySelector("#side-menu-toggle");

function backdropClickHandler() {
    backdrop.style.display = "none";
    sideDrawer.classList.remove("open");
}

function menuToggleClickHandler() {
    backdrop.style.display = "block";
    sideDrawer.classList.add("open");
}

backdrop.addEventListener("click", backdropClickHandler);
menuToggle.addEventListener("click", menuToggleClickHandler);

function addToCart(btn) {
  const prodId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;
    fetch("/cart", {
        method: "POST",
        body: JSON.stringify({
            productId: prodId
        }),
        headers: {
            "csrf-token": csrf,
            "Content-Type": "application/json",
        },
    })
        .then((result) => result.json())
        .then((data) => {
            console.log(data);
            alert("Added to cart")
        })
        .catch((err) => console.log(err));
}
