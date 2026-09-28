const products = [
  { id: 1, name: "Laptop", category: "Electronics", price: 60000 },
  { id: 2, name: "Headphones", category: "Electronics", price: 2500 },
  { id: 3, name: "Backpack", category: "Accessories", price: 1800 },
  { id: 4, name: "Smart Watch", category: "Electronics", price: 4500 },
  { id: 5, name: "Sneakers", category: "Fashion", price: 3200 },
  { id: 6, name: "T-Shirt", category: "Fashion", price: 900 },
];
let cart = JSON.parse(localStorage.cart || "[]"),
  wishlist = JSON.parse(localStorage.wishlist || "[]"),
  orders = JSON.parse(localStorage.orders || "[]"),
  user = JSON.parse(localStorage.user || "null"),
  page = "home";
const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
function save() {
  localStorage.cart = JSON.stringify(cart);
  localStorage.wishlist = JSON.stringify(wishlist);
  localStorage.orders = JSON.stringify(orders);
  localStorage.user = JSON.stringify(user);
}
function go(p) {
  page = p;
  render();
}
function toast(m) {
  let t = document.getElementById("toast");
  t.textContent = m;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), 1200);
}
function add(id) {
  let x = cart.find((i) => i.id === id);
  x ? x.qty++ : cart.push({ id, qty: 1 });
  save();
  render();
  toast("Added to cart");
}
function removeItem(id) {
  cart = cart.filter((i) => i.id !== id);
  save();
  render();
}
function qty(id, d) {
  let x = cart.find((i) => i.id === id);
  if (!x) return;
  x.qty += d;
  if (x.qty <= 0) removeItem(id);
  else {
    save();
    render();
  }
}
function wish(id) {
  wishlist.includes(id)
    ? (wishlist = wishlist.filter((x) => x !== id))
    : wishlist.push(id);
  save();
  render();
}
function card(p) {
  let w = wishlist.includes(p.id);
  return `<div class="card"><span class="tag">${p.category}</span><h3>${p.name}</h3><p class="price">${money(p.price)}</p><button onclick="add(${p.id})">Add to Cart</button> <button class="${w ? "danger" : "secondary"}" onclick="wish(${p.id})">${w ? "♥" : "♡"} Wishlist</button></div>`;
}
function home() {
  return `<div class="container"><section class="hero"><h2>Welcome to Bug Hunt Shop</h2><p>Debug this e-commerce application, test it in Chrome, and submit your fix.</p><button onclick="go('products')">Shop Now</button></section><h2>Featured Products</h2><div class="grid">${products.slice(0, 4).map(card).join("")}</div></div>`;
}
function productsPage() {
  return `<div class="container"><div class="row"><h2>Products</h2><input id="search" class="input" style="max-width:350px" placeholder="Search products" oninput="filterProducts()"></div><div id="grid" class="grid">${products.map(card).join("")}</div></div>`;
}
function filterProducts() {
  let q = document.getElementById("search").value.toLowerCase();
  document.getElementById("grid").innerHTML =
    products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      )
      .map(card)
      .join("") || '<div class="empty">No products found.</div>';
}
function wishlistPage() {
  let a = products.filter((p) => wishlist.includes(p.id));
  return `<div class="container"><h2>Wishlist</h2>${a.length ? '<div class="grid">' + a.map(card).join("") + "</div>" : '<div class="empty">Your wishlist is empty.</div>'}`;
}
async function getTotals() {
  let subtotal = cart.reduce((s, i) => {
    let p = products.find((p) => p.id === i.id);
    return s + p.price * i.qty;
  }, 0);
  let r = await fetch(`/api/calculate?subtotal=${subtotal}`);
  return await r.json();
}
async function cartPage() {
  if (!cart.length)
    return '<div class="container"><h2>Cart</h2><div class="empty">Your cart is empty.</div></div>';
  let t = await getTotals();
  document.getElementById("app").innerHTML =
    `<div class="container"><h2>Shopping Cart</h2>${cart
      .map((i) => {
        let p = products.find((p) => p.id === i.id);
        return `<div class="card" style="margin:10px 0"><div class="row"><b>${p.name}</b>
        <span>${money(p.price * i.qty)}</span><span><button onclick="qty(${p.id},-1)">−</button> ${i.qty} <button onclick="qty(${p.id},1)">+</button></span><button class="danger" onclick="removeItem(${p.id})">Remove</button></div></div>`;
      })
      .join(
        "",
      )}<div class="summary"><p>Subtotal: ${money(t.subtotal)}</p>
      <p>Discount: −${money(t.discount)}</p><p>Tax: ${money(t.tax)}</p>
      <h2>Grand Total: ${money(t.total)}</h2>
      <button onclick="checkout()">Checkout</button></div></div>`;
}
async function checkout() {
  if (!user) {
    go("login");
    toast("Please login first");
    return;
  }
  let t = await getTotals(),
    a = prompt("Enter delivery address:");
  if (!a || a.trim().length < 10) {
    toast("Enter a valid address");
    return;
  }
  orders.unshift({
    id: Date.now(),
    date: new Date().toLocaleString("en-IN"),
    items: [...cart],
    total: t.total,
    status: "Confirmed",
    address: a,
  });
  cart = [];
  save();
  go("orders");
  toast("Order placed");
}
function ordersPage() {
  return `<div class="container"><h2>Order History</h2>${orders.length ? orders.map((o) => `<div class="card" style="margin:10px 0"><b>Order #${o.id}</b> <span class="tag">${o.status}</span><p>${o.date}</p><h3>${money(o.total)}</h3><p>${o.address}</p></div>`).join("") : '<div class="empty">No orders yet.</div>'}</div>`;
}
function loginPage() {
  return `<div class="container"><div class="card" style="max-width:480px;margin:auto"><h2>${user ? "Account" : "Login / Register"}</h2>${user ? `<p>Logged in as <b>${user.name}</b> (${user.email})</p><button class="danger" onclick="user=null;save();render()">Logout</button>` : `<input id="name" class="input" placeholder="Full name"><input id="email" class="input" placeholder="Email"><input id="pass" class="input" type="password" placeholder="Password"><button onclick="login()">Login</button>`}</div></div>`;
}
function login() {
  let n = document.getElementById("name").value.trim(),
    e = document.getElementById("email").value.trim(),
    p = document.getElementById("pass").value;
  if (n.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || p.length < 6) {
    toast("Invalid details");
    return;
  }
  user = { name: n, email: e };
  save();
  go("home");
  toast("Login successful");
}
async function render() {
  document.getElementById("count").textContent = cart.reduce(
    (s, i) => s + i.qty,
    0,
  );
  let a = document.getElementById("app");
  if (page === "cart") {
    await cartPage();
    return;
  }
  a.innerHTML =
    page === "home"
      ? home()
      : page === "products"
        ? productsPage()
        : page === "wishlist"
          ? wishlistPage()
          : page === "orders"
            ? ordersPage()
            : loginPage();
}
render();
