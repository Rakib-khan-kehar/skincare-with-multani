// main.js — Skincare With Multani — Complete JS
const API = "/api";
const UPI_ID = "8396012896-2@ibl";

// ── State ─────────────────────────────────────────────────────────
let cart = [];
let selectedVariant = { weight:"500g", price:179, oldPrice:null, discount:null, img:"images/products/product-pouch.jpg" };
let chunkQty = 1;
let powderQty = 1;
let selectedRating = 5;
let authToken = localStorage.getItem("swm_token") || null;
let authUser  = JSON.parse(localStorage.getItem("swm_user") || "null");

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupSearch();
  setupCart();
  setupProductWeights();
  setupProductTabs();
  setupProductTypeTabs();
  setupProductGallery();
  setupQty();
  setupCartButtons();
  setupGallery();
  setupReviewCarousel();
  setupReviewForm();
  setupFAQ();
  setupPolicies();
  setupContactForm();
  setupNewsletterForm();
  setupScrollAnimations();
  setupBackToTop();
  setupAuthModal();
  setupOrderModal();
  setupUPIModal();
  updateAuthUI();
  loadReviews();
});

/* ════════════════════════════════════════════════════════════════
   AUTH — Login / Register
   ════════════════════════════════════════════════════════════════ */
function setupAuthModal() {
  const modal     = document.getElementById("authModal");
  const backdrop  = document.getElementById("modalBackdrop");
  const closeBtn  = document.getElementById("authModalClose");
  const loginNavBtn    = document.getElementById("loginNavBtn");
  const logoutNavBtn   = document.getElementById("logoutNavBtn");

  loginNavBtn?.addEventListener("click",  () => openModal("authModal"));
  closeBtn?.addEventListener("click",     () => closeModal("authModal"));
  backdrop?.addEventListener("click",     () => { closeModal("authModal"); closeModal("orderModal"); closeModal("upiModal"); });
  logoutNavBtn?.addEventListener("click", logout);

  document.getElementById("tabLogin")?.addEventListener("click",    () => switchTab("login"));
  document.getElementById("tabRegister")?.addEventListener("click", () => switchTab("register"));

  // Login form
  document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    btn.textContent = "Logging in..."; btn.disabled = true;
    const msg = document.getElementById("loginMsg");
    try {
      const res  = await fetch(`${API}/users/login`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email: document.getElementById("loginEmail").value, password: document.getElementById("loginPassword").value })
      });
      const json = await res.json();
      if (json.success) {
        authToken = json.token; authUser = json.user;
        localStorage.setItem("swm_token", authToken);
        localStorage.setItem("swm_user",  JSON.stringify(authUser));
        updateAuthUI();
        closeModal("authModal");
        showMsg("loginMsg", "Login successful! ✅", "success");
        syncCartToServer();
      } else {
        showMsg("loginMsg", json.message, "error");
      }
    } catch { showMsg("loginMsg", "Server error. Try again.", "error"); }
    btn.textContent = "Login"; btn.disabled = false;
  });

  // Register form
  document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button");
    btn.textContent = "Creating..."; btn.disabled = true;
    try {
      const res  = await fetch(`${API}/users/register`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          name:     document.getElementById("regName").value,
          email:    document.getElementById("regEmail").value,
          phone:    document.getElementById("regPhone").value,
          password: document.getElementById("regPassword").value
        })
      });
      const json = await res.json();
      if (json.success) {
        authToken = json.token; authUser = json.user;
        localStorage.setItem("swm_token", authToken);
        localStorage.setItem("swm_user",  JSON.stringify(authUser));
        updateAuthUI();
        closeModal("authModal");
      } else {
        showMsg("registerMsg", json.message, "error");
      }
    } catch { showMsg("registerMsg", "Server error. Try again.", "error"); }
    btn.textContent = "Create Account"; btn.disabled = false;
  });
}

function openModal(id)  { document.getElementById(id)?.classList.add("open"); document.getElementById("modalBackdrop")?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); document.getElementById("modalBackdrop")?.classList.remove("open"); }

function switchTab(tab) {
  document.getElementById("tabLogin")?.classList.toggle("active",    tab==="login");
  document.getElementById("tabRegister")?.classList.toggle("active", tab==="register");
  document.getElementById("loginForm")?.classList.toggle("active",    tab==="login");
  document.getElementById("registerForm")?.classList.toggle("active", tab==="register");
}

function logout() {
  fetch(`${API}/users/logout`, { method:"POST", headers:{"Authorization":"Bearer "+authToken} }).catch(()=>{});
  authToken = null; authUser = null;
  localStorage.removeItem("swm_token"); localStorage.removeItem("swm_user");
  updateAuthUI();
}

function updateAuthUI() {
  const navAuth = document.getElementById("navAuth");
  const navUser = document.getElementById("navUser");
  const navUsername = document.getElementById("navUsername");
  if (authUser) {
    if (navAuth) navAuth.style.display = "none";
    if (navUser) navUser.style.display = "flex";
    if (navUsername) navUsername.textContent = `Hi, ${authUser.name.split(" ")[0]}`;
  } else {
    if (navAuth) navAuth.style.display = "flex";
    if (navUser) navUser.style.display = "none";
  }
}

function showMsg(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className   = "auth-msg " + type;
}

/* ════════════════════════════════════════════════════════════════
   CART — local + sync to server if logged in
   ════════════════════════════════════════════════════════════════ */
function setupCart() {
  document.getElementById("cartBtn")?.addEventListener("click",      openCart);
  document.getElementById("cartClose")?.addEventListener("click",    closeCart);
  document.getElementById("drawerBackdrop")?.addEventListener("click", closeCart);
  document.getElementById("checkoutBtn")?.addEventListener("click",  () => { closeCart(); openModal("orderModal"); buildOrderSummary(); });
}

function openCart()  { document.getElementById("cartDrawer")?.classList.add("open"); document.getElementById("drawerBackdrop")?.classList.add("open"); }
function closeCart() { document.getElementById("cartDrawer")?.classList.remove("open"); document.getElementById("drawerBackdrop")?.classList.remove("open"); }

function addToCart(item) {
  const ex = cart.find(c => c.product_name===item.product_name && c.weight===item.weight);
  if (ex) ex.qty += item.qty;
  else cart.push({...item});
  renderCart();
  syncCartToServer();
}

async function syncCartToServer() {
  if (!authToken) return;
  // Sync each cart item to server
  try {
    await fetch(`${API}/cart/clear`, { method:"DELETE", headers:{"Authorization":"Bearer "+authToken} });
    for (const item of cart) {
      await fetch(`${API}/cart/add`, {
        method:"POST", headers:{"Content-Type":"application/json","Authorization":"Bearer "+authToken},
        body: JSON.stringify(item)
      });
    }
  } catch(e) { console.log("Cart sync error:", e); }
}

function renderCart() {
  const countEl    = document.getElementById("cartCount");
  const itemsEl    = document.getElementById("cartItems");
  const subtotalEl = document.getElementById("cartSubtotal");
  const deliveryEl = document.getElementById("cartDelivery");
  const totalEl    = document.getElementById("cartTotal");

  const totalQty = cart.reduce((s,i) => s+i.qty, 0);
  if (countEl) countEl.textContent = totalQty;

  if (!itemsEl) return;
  if (cart.length === 0) {
    itemsEl.innerHTML = "<p class='cart-empty'>Your cart is empty.</p>";
    if (subtotalEl) subtotalEl.textContent = "₹0";
    if (deliveryEl) deliveryEl.textContent = "₹0";
    if (totalEl)    totalEl.textContent    = "₹0";
    return;
  }

  itemsEl.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-thumb">
        <img src="${item.image || 'images/products/pouch-new-photo.jpeg'}" alt="${item.product_name}" onerror="this.src='images/products/pouch-new-photo.jpeg'"/>
      </div>
      <div class="cart-item-info">
        <strong>${item.product_name}</strong>
        <span>${item.weight} × ${item.qty} = ₹${item.price * item.qty}</span>
        <div class="cart-qty-row">
          <button onclick="changeCartQty(${idx},-1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeCartQty(${idx},1)">+</button>
          <div class="cart-item-remove" onclick="removeFromCart(${idx})">✕</div>
        </div>
      </div>
    </div>
  `).join("");

  const subtotal = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const delivery = subtotal >= 499 ? 0 : (subtotal > 0 ? 50 : 0);
  const total    = subtotal + delivery;

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  if (deliveryEl) deliveryEl.textContent = delivery === 0 ? "FREE ✅" : `₹${delivery}`;
  if (totalEl)    totalEl.textContent    = `₹${total}`;
}

function changeCartQty(idx, delta) {
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  renderCart(); syncCartToServer();
}
function removeFromCart(idx) {
  cart.splice(idx, 1); renderCart(); syncCartToServer();
}

/* ════════════════════════════════════════════════════════════════
   ORDER MODAL
   ════════════════════════════════════════════════════════════════ */
function setupOrderModal() {
  document.getElementById("orderModalClose")?.addEventListener("click", () => closeModal("orderModal"));

  // Payment method selection
  document.querySelectorAll(".pay-opt").forEach(opt => {
    opt.addEventListener("click", () => {
      document.querySelectorAll(".pay-opt").forEach(o => o.classList.remove("active"));
      opt.classList.add("active");
      opt.querySelector("input").checked = true;
    });
  });

  document.getElementById("orderForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const method = document.querySelector("input[name='payment']:checked")?.value || "COD";

    if (method === "WhatsApp") {
      sendWhatsAppOrder(); closeModal("orderModal"); return;
    }
    if (method === "UPI") {
      closeModal("orderModal");
      openUPIModal(); return;
    }
    // COD
    await submitOrder("COD", "pending", "");
  });
}

function buildOrderSummary() {
  const el = document.getElementById("orderSummary");
  if (!el || cart.length === 0) return;
  const subtotal = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const delivery = subtotal >= 499 ? 0 : 50;
  const total    = subtotal + delivery;
  el.innerHTML = `
    ${cart.map(i => `<p><strong>${i.product_name} (${i.weight})</strong> × ${i.qty} = ₹${i.price*i.qty}</p>`).join("")}
    <p>Delivery: ${delivery === 0 ? "<strong style='color:var(--olive)'>FREE ✅</strong>" : `₹${delivery}`}</p>
    <p><strong>Total: ₹${total}</strong></p>
  `;
  // Set UPI amount
  document.getElementById("upiAmount") && (document.getElementById("upiAmount").textContent = `₹${total}`);
}

async function submitOrder(method, payStatus, upiRef) {
  const btn = document.getElementById("placeOrderBtn");
  const msg = document.getElementById("orderMsg");
  if (btn) { btn.textContent = "Placing Order..."; btn.disabled = true; }

  const subtotal = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const delivery = subtotal >= 499 ? 0 : 50;

  const data = {
    name:          document.getElementById("orderName")?.value,
    phone:         document.getElementById("orderPhone")?.value,
    email:         document.getElementById("orderEmail")?.value,
    address:       document.getElementById("orderAddress")?.value,
    city:          document.getElementById("orderCity")?.value,
    pincode:       document.getElementById("orderPincode")?.value,
    paymentMethod: method,
    paymentStatus: payStatus,
    upiRef:        upiRef,
    items: cart.map(i => ({
      product_name: i.product_name, weight: i.weight,
      price: i.price, qty: i.qty, image: i.image || ""
    }))
  };

  try {
    const res  = await fetch(`${API}/orders/`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.success) {
      if (msg) msg.textContent = `✅ Order placed! ID: ${json.order_id}`;
      cart = []; renderCart();
      setTimeout(() => {
        closeModal("orderModal"); closeModal("upiModal");
        alert(`✅ Order placed successfully!\nOrder ID: ${json.order_id}\nTotal: ₹${json.total}\nWe will contact you on WhatsApp to confirm.`);
      }, 1500);
    } else {
      if (msg) msg.textContent = "❌ " + json.message;
    }
  } catch {
    if (msg) msg.textContent = "Server error. Please try WhatsApp order.";
  }
  if (btn) { btn.textContent = "Place Order"; btn.disabled = false; }
}

function sendWhatsAppOrder() {
  const name    = document.getElementById("orderName")?.value    || "Customer";
  const phone   = document.getElementById("orderPhone")?.value   || "";
  const address = document.getElementById("orderAddress")?.value || "";
  const subtotal = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const delivery = subtotal >= 499 ? 0 : 50;
  const total    = subtotal + delivery;
  const lines    = cart.map(i => `• ${i.product_name} (${i.weight}) × ${i.qty} = ₹${i.price*i.qty}`).join("\n");
  const msg      = encodeURIComponent(`Hi! Order:\n\n${lines}\n\nSubtotal: ₹${subtotal}\nDelivery: ₹${delivery}\nTotal: ₹${total}\n\nNaam: ${name}\nPhone: ${phone}\nAddress: ${address}\n\nPlease confirm. Thank you!`);
  // Save to DB too
  submitOrder("WhatsApp","pending","").catch(()=>{});
  window.open(`https://wa.me/919253412896?text=${msg}`, "_blank");
}

/* ════════════════════════════════════════════════════════════════
   UPI PAYMENT MODAL
   ════════════════════════════════════════════════════════════════ */
function setupUPIModal() {
  document.getElementById("upiModalClose")?.addEventListener("click", () => closeModal("upiModal"));
  document.getElementById("upiIdDisplay") && (document.getElementById("upiIdDisplay").textContent = UPI_ID);
  document.getElementById("upiConfirmBtn")?.addEventListener("click", async () => {
    const ref = document.getElementById("upiRef")?.value?.trim();
    const msg = document.getElementById("upiMsg");
    if (!ref) { if (msg) msg.textContent = "❌ Please enter UTR/Reference number"; return; }
    if (msg) msg.textContent = "Verifying...";
    const name    = document.getElementById("orderName")?.value;
    const phone   = document.getElementById("orderPhone")?.value;
    const address = document.getElementById("orderAddress")?.value;
    if (!name || !phone || !address) {
      closeModal("upiModal");
      openModal("orderModal");
      if (msg) msg.textContent = "";
      alert("Please fill your name, phone and address first.");
      return;
    }
    await submitOrder("UPI", "paid", ref);
  });
}

function openUPIModal() {
  const subtotal = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const delivery = subtotal >= 499 ? 0 : 50;
  const total    = subtotal + delivery;
  const el = document.getElementById("upiAmount");
  if (el) el.textContent = `₹${total}`;
  openModal("upiModal");
}

function copyUPI() {
  navigator.clipboard?.writeText(UPI_ID).then(() => alert("UPI ID copied: " + UPI_ID));
}

/* ════════════════════════════════════════════════════════════════
   PRODUCT TYPE TABS (Powder / Chunk)
   ════════════════════════════════════════════════════════════════ */
function setupProductTypeTabs() {
  document.querySelectorAll(".ptype-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".ptype-tab").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".product-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.type)?.classList.add("active");
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   PRODUCT WEIGHTS (Powder)
   ════════════════════════════════════════════════════════════════ */
const WEIGHTS = [
  { weight:"250g", price:99,  oldPrice:149, discount:34, img:"images/products/pouch-new-photo.jpeg" },
  { weight:"500g", price:179, oldPrice:null, discount:null, img:"images/products/pouch-new-photo.jpeg" },
  { weight:"1kg",  price:299, oldPrice:null, discount:null, img:"images/products/pouch-new-photo.jpeg" },
];

function setupProductWeights() {
  const wrap = document.getElementById("weightOptions");
  if (!wrap) return;
  wrap.querySelectorAll(".weight-opt").forEach(btn => {
    btn.addEventListener("click", () => {
      wrap.querySelectorAll(".weight-opt").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedVariant = WEIGHTS.find(v => v.weight===btn.dataset.weight)
        || { weight:btn.dataset.weight, price:parseInt(btn.dataset.price), oldPrice:null, discount:null, img:"images/products/product-pouch.jpg" };
      updatePriceDisplay();
      const mainImg = document.getElementById("pdMainImg");
      if (mainImg && selectedVariant.img) mainImg.src = selectedVariant.img;
    });
  });
  updatePriceDisplay();
}

function updatePriceDisplay() {
  const v = selectedVariant;
  const priceEl = document.getElementById("pdPrice");
  const oldEl   = document.getElementById("pdPriceOld");
  const discEl  = document.getElementById("pdDiscount");
  if (priceEl) priceEl.textContent = `₹${v.price}`;
  if (oldEl)  { oldEl.style.display  = v.oldPrice  ? "" : "none"; if(v.oldPrice)  oldEl.textContent  = `₹${v.oldPrice}`; }
  if (discEl) { discEl.style.display = v.discount ? "" : "none"; if(v.discount) discEl.textContent = `${v.discount}% OFF`; }
}

/* ════════════════════════════════════════════════════════════════
   QTY SELECTORS
   ════════════════════════════════════════════════════════════════ */
function setupQty() {
  // Powder qty
  document.getElementById("qtyMinus")?.addEventListener("click", () => { if(powderQty>1){powderQty--;document.getElementById("qtyValue").textContent=powderQty;} });
  document.getElementById("qtyPlus")?.addEventListener("click",  () => { powderQty++;document.getElementById("qtyValue").textContent=powderQty; });
  // Chunk qty
  document.getElementById("chunkQtyMinus")?.addEventListener("click", () => { if(chunkQty>1){chunkQty--;document.getElementById("chunkQtyValue").textContent=chunkQty;} });
  document.getElementById("chunkQtyPlus")?.addEventListener("click",  () => { chunkQty++;document.getElementById("chunkQtyValue").textContent=chunkQty; });
}

/* ════════════════════════════════════════════════════════════════
   CART BUTTONS
   ════════════════════════════════════════════════════════════════ */
function setupCartButtons() {
  // Powder — Add to Cart
  document.getElementById("addToCartBtn")?.addEventListener("click", () => {
    addToCart({ product_name:"Premium Multani Mitti Powder", weight:selectedVariant.weight, price:selectedVariant.price, qty:powderQty, image:"images/products/product-pouch.jpg" });
    openCart(); powderQty=1; document.getElementById("qtyValue").textContent=1;
  });
  // Powder — Buy Now
  document.getElementById("buyNowBtn")?.addEventListener("click", () => {
    cart = []; addToCart({ product_name:"Premium Multani Mitti Powder", weight:selectedVariant.weight, price:selectedVariant.price, qty:powderQty, image:"images/products/product-pouch.jpg" });
    buildOrderSummary(); openModal("orderModal"); powderQty=1; document.getElementById("qtyValue").textContent=1;
  });
  // Chunk — Add to Cart
  document.getElementById("addChunkToCartBtn")?.addEventListener("click", () => {
    addToCart({ product_name:"Natural Multani Mitti Stone Chunk", weight:"1kg", price:149, qty:chunkQty, image:"images/gallery/stone-raw.jpg" });
    openCart(); chunkQty=1; document.getElementById("chunkQtyValue").textContent=1;
  });
  // Chunk — Buy Now
  document.getElementById("buyChunkNowBtn")?.addEventListener("click", () => {
    cart = []; addToCart({ product_name:"Natural Multani Mitti Stone Chunk", weight:"1kg", price:149, qty:chunkQty, image:"images/gallery/stone-raw.jpg" });
    buildOrderSummary(); openModal("orderModal"); chunkQty=1; document.getElementById("chunkQtyValue").textContent=1;
  });
}

/* ════════════════════════════════════════════════════════════════
   PRODUCT IMAGE GALLERY
   ════════════════════════════════════════════════════════════════ */
function setupProductGallery() {
  // Powder gallery
  document.querySelectorAll("#panel-powder .pd-thumb").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll("#panel-powder .pd-thumb").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      const mainImg = document.getElementById("pdMainImg");
      if (mainImg && t.dataset.img) mainImg.src = t.dataset.img;
    });
  });
  // Chunk gallery
  document.querySelectorAll("#panel-chunk .pd-thumb").forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll("#panel-chunk .pd-thumb").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      const mainImg = document.getElementById("chunkMainImg");
      if (mainImg && t.dataset.img) mainImg.src = t.dataset.img;
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   PRODUCT TABS (Description/Benefits/Specs/Packaging)
   ════════════════════════════════════════════════════════════════ */
function setupProductTabs() {
  document.querySelectorAll(".pdt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const panel = btn.closest(".pd-info");
      panel.querySelectorAll(".pdt-btn").forEach(b => b.classList.remove("active"));
      panel.querySelectorAll(".pdt-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("pdt-" + btn.dataset.pdt)?.classList.add("active");
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   GALLERY
   ════════════════════════════════════════════════════════════════ */
function setupGallery() {
  document.querySelectorAll(".gf-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".gf-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      document.querySelectorAll(".gal-item").forEach(item => {
        item.style.display = (f==="all" || item.dataset.cat===f) ? "" : "none";
      });
    });
  });
  const track = document.getElementById("galleryTrack");
  document.getElementById("galPrev")?.addEventListener("click", () => track?.scrollBy({left:-260,behavior:"smooth"}));
  document.getElementById("galNext")?.addEventListener("click", () => track?.scrollBy({left: 260,behavior:"smooth"}));
}

/* ════════════════════════════════════════════════════════════════
   REVIEWS — load from API
   ════════════════════════════════════════════════════════════════ */
let tIndex = 0;

async function loadReviews() {
  try {
    const res  = await fetch(`${API}/reviews/`);
    const json = await res.json();
    if (!json.success || json.data.length===0) return;
    const track = document.getElementById("tTrack");
    if (!track) return;
    track.innerHTML = json.data.map(r => `
      <div class="t-card">
        <div class="t-stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
        <p>"${r.review}"</p>
        <div class="t-author">
          <div class="t-avatar">${(r.initials||r.name.substring(0,2)).toUpperCase()}</div>
          <div><strong>${r.name}</strong><span>${r.location||"Verified Buyer"}</span></div>
        </div>
      </div>
    `).join("");
    tIndex = 0;
    track.style.transform = "translateX(0)";
    requestAnimationFrame(() => {
      buildDots(track.querySelectorAll(".t-card").length);
    });
  } catch(e) { console.log(e); }
}
function setupReviewCarousel() {
  document.getElementById("tPrev")?.addEventListener("click", () => goSlide(tIndex-1));
  document.getElementById("tNext")?.addEventListener("click", () => goSlide(tIndex+1));
}

function buildDots(count) {
  const wrap = document.getElementById("tDots"); if(!wrap) return;
  const vis = window.innerWidth<=900?1:3;
  const max = Math.max(0,count-vis);
  wrap.innerHTML="";
  for(let i=0;i<=max;i++){
    const d=document.createElement("span");
    if(i===0)d.classList.add("active");
    d.addEventListener("click",()=>goSlide(i));
    wrap.appendChild(d);
  }
}

function goSlide(i) {
  const cards=document.querySelectorAll(".t-card");
  const vis=window.innerWidth<=900?1:3;
  const max=Math.max(0,cards.length-vis);
  tIndex=Math.max(0,Math.min(i,max));
  const w=(cards[0]?.offsetWidth||0)+24;
  const track=document.getElementById("tTrack");
  if(track) track.style.transform=`translateX(-${tIndex*w}px)`;
  document.querySelectorAll("#tDots span").forEach((d,idx)=>d.classList.toggle("active",idx===tIndex));
}

/* ════════════════════════════════════════════════════════════════
   REVIEW FORM
   ════════════════════════════════════════════════════════════════ */
function setupReviewForm() {
  const stars = document.querySelectorAll(".stars-input i");
  stars.forEach(s => {
    s.addEventListener("mouseenter", () => stars.forEach(x => x.classList.toggle("active", x.dataset.val<=s.dataset.val)));
    s.addEventListener("mouseleave", () => stars.forEach(x => x.classList.toggle("active", x.dataset.val<=selectedRating)));
    s.addEventListener("click",      () => { selectedRating=parseInt(s.dataset.val); stars.forEach(x=>x.classList.toggle("active",x.dataset.val<=selectedRating)); });
  });
  document.getElementById("reviewForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn=e.target.querySelector("button"); const orig=btn.textContent;
    btn.textContent="Submitting..."; btn.disabled=true;
    try {
      const res=await fetch(`${API}/reviews/`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:document.getElementById("reviewName").value,location:document.getElementById("reviewLocation").value,rating:selectedRating,review:document.getElementById("reviewText").value})});
      const json=await res.json();
      btn.textContent=json.success?"✓ Submitted! Awaiting approval.":"Try Again";
    } catch { btn.textContent="✓ Submitted!"; }
    e.target.reset(); selectedRating=5; stars.forEach(s=>s.classList.add("active"));
    setTimeout(()=>{btn.textContent=orig;btn.disabled=false;},3500);
  });
}

/* ════════════════════════════════════════════════════════════════
   FAQ ACCORDION
   ════════════════════════════════════════════════════════════════ */
function setupFAQ() {
  document.querySelectorAll(".faq-q").forEach(btn => {
    btn.addEventListener("click", () => {
      const item=btn.closest(".faq-item"); const was=item.classList.contains("open");
      document.querySelectorAll(".faq-item").forEach(i=>i.classList.remove("open"));
      if(!was) item.classList.add("open");
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   POLICIES
   ════════════════════════════════════════════════════════════════ */
function setupPolicies() {
  document.querySelectorAll(".policy-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".policy-tab").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".policy-content").forEach(c=>c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("policy-"+btn.dataset.policy)?.classList.add("active");
    });
  });
}

function openPolicy(name) {
  setTimeout(() => {
    document.querySelectorAll(".policy-tab").forEach(b=>b.classList.toggle("active",b.dataset.policy===name));
    document.querySelectorAll(".policy-content").forEach(c=>c.classList.remove("active"));
    document.getElementById("policy-"+name)?.classList.add("active");
  },400);
}

/* ════════════════════════════════════════════════════════════════
   CONTACT FORM
   ════════════════════════════════════════════════════════════════ */
function setupContactForm() {
  document.getElementById("contactForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn=e.target.querySelector("button[type='submit']");
    btn.textContent="Sending..."; btn.disabled=true;
    const data={
      name:e.target.querySelector("[name='name']").value,
      email:e.target.querySelector("[name='email']").value,
      phone:e.target.querySelector("[name='phone']").value,
      inquiryType:e.target.querySelector("[name='inquiryType']").value,
      message:e.target.querySelector("[name='message']").value,
    };
    try {
      const res=await fetch(`${API}/contact/`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const json=await res.json();
      btn.textContent=json.success?"✓ Message Sent!":"Try Again";
      if(json.success){e.target.reset();setTimeout(()=>{btn.textContent="Send Message";btn.disabled=false;},3000);}
      else btn.disabled=false;
    } catch { btn.textContent="✓ Message Sent!"; e.target.reset(); setTimeout(()=>{btn.textContent="Send Message";btn.disabled=false;},3000); }
  });
}

/* ════════════════════════════════════════════════════════════════
   NEWSLETTER
   ════════════════════════════════════════════════════════════════ */
function setupNewsletterForm() {
  document.getElementById("newsletterBtn")?.addEventListener("click", async () => {
    const email=document.getElementById("newsletterEmail")?.value?.trim(); if(!email) return;
    const btn=document.getElementById("newsletterBtn"); btn.innerHTML='<i class="fas fa-check"></i>';
    try { await fetch(`${API}/newsletter/`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})}); } catch{}
    setTimeout(()=>{ btn.innerHTML='<i class="fas fa-paper-plane"></i>'; document.getElementById("newsletterEmail").value=""; },2000);
  });
}

/* ════════════════════════════════════════════════════════════════
   NAVBAR
   ════════════════════════════════════════════════════════════════ */
function setupNav() {
  const ham=document.getElementById("hamburger"); const nav=document.getElementById("mainNav");
  ham?.addEventListener("click",()=>nav?.classList.toggle("open"));
  nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
  const secs=document.querySelectorAll("section[id]"); const links=document.querySelectorAll(".main-nav a");
  window.addEventListener("scroll",()=>{
    let cur=""; secs.forEach(s=>{if(window.scrollY>=s.offsetTop-130)cur=s.id;});
    links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+cur));
  },{passive:true});
  document.querySelectorAll("a[href^='#']").forEach(a=>{
    a.addEventListener("click",e=>{
      const t=document.querySelector(a.getAttribute("href")); if(!t) return;
      e.preventDefault();
      window.scrollTo({top:t.offsetTop-(document.querySelector(".navbar")?.offsetHeight||70)-10,behavior:"smooth"});
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   SEARCH
   ════════════════════════════════════════════════════════════════ */
function setupSearch() {
  const ov=document.getElementById("searchOverlay");
  document.getElementById("searchBtn")?.addEventListener("click",()=>{ov?.classList.add("open");setTimeout(()=>document.getElementById("searchInput")?.focus(),200);});
  document.getElementById("searchClose")?.addEventListener("click",()=>ov?.classList.remove("open"));
  ov?.addEventListener("click",e=>{if(e.target===ov)ov.classList.remove("open");});
}

/* ════════════════════════════════════════════════════════════════
   SCROLL ANIMATIONS
   ════════════════════════════════════════════════════════════════ */
function setupScrollAnimations() {
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        setTimeout(()=>entry.target.classList.add("aos-show"),parseInt(entry.target.dataset.delay||0));
        obs.unobserve(entry.target);
      }
    });
  },{threshold:0.1,rootMargin:"0px 0px -50px 0px"});
  document.querySelectorAll("[data-aos]").forEach(el=>obs.observe(el));
}

/* ════════════════════════════════════════════════════════════════
   BACK TO TOP
   ════════════════════════════════════════════════════════════════ */
function setupBackToTop() {
  const btn=document.getElementById("backToTop");
  window.addEventListener("scroll",()=>btn?.classList.toggle("visible",window.scrollY>400),{passive:true});
  btn?.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
}

/* ════════════════════════════════════════════════════════════════
   CART QTY ROW CSS (inline)
   ════════════════════════════════════════════════════════════════ */
const style = document.createElement("style");
style.textContent = `
  .cart-qty-row{display:flex;align-items:center;gap:.4rem;margin-top:.3rem}
  .cart-qty-row button{width:24px;height:24px;border-radius:50%;background:var(--ivory-deep);border:1px solid var(--border);font-size:.9rem;display:flex;align-items:center;justify-content:center;cursor:pointer}
  .cart-qty-row span{font-size:.82rem;font-weight:600;min-width:20px;text-align:center}
  .cart-item-remove{margin-left:.5rem;color:#C0584B;font-size:.75rem;cursor:pointer;font-weight:600}
`;
document.head.appendChild(style);
