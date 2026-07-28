const CART_STORAGE_KEY = "weiheCart";
const CART_MAX_QUANTITY = 20;

const cartBackdrop = document.querySelector("#cart-backdrop");
const cartDrawer = document.querySelector("#cart-drawer");
const cartItemsElement = document.querySelector("#cart-items");
const cartTotalElement = document.querySelector("#cart-total");
const cartClearButton = document.querySelector("#cart-clear");
const cartCheckoutButton = document.querySelector("#cart-checkout");
const checkoutBackdrop = document.querySelector("#checkout-backdrop");
const checkoutAddresses = document.querySelector("#checkout-addresses");
const checkoutSummary = document.querySelector("#checkout-summary");
const checkoutError = document.querySelector("#checkout-error");
const orderSuccess = document.querySelector("#order-success");
const bagCount = document.querySelector(".bag-placeholder b");
let cartMemory = [];
let cartLastFocus = null;

function readCart() {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY));
    cartMemory = Array.isArray(stored) ? stored : cartMemory;
  } catch {}
  return cartMemory;
}

function saveCart(items) {
  cartMemory = items;
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)); } catch {}
}

function formatCartPrice(cents) {
  return `¥${Math.round(cents / 100)}`;
}

function getCartDetails() {
  return readCart().map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) return null;
    return { ...item, product, subtotalCents: product.priceCents * item.quantity };
  }).filter(Boolean);
}

function getCartTotals() {
  return getCartDetails().reduce((totals, item) => ({
    quantity: totals.quantity + item.quantity,
    totalCents: totals.totalCents + item.subtotalCents
  }), { quantity: 0, totalCents: 0 });
}

function updateBagCount() {
  bagCount.textContent = String(getCartTotals().quantity);
}

function renderCart() {
  const items = getCartDetails();
  const totals = getCartTotals();
  if (!items.length) {
    cartItemsElement.innerHTML = '<p class="cart-empty">购物袋还是空的。<br>去挑一份毛孩子喜欢的零食吧。</p>';
  } else {
    cartItemsElement.innerHTML = items.map(({ product, quantity, subtotalCents }) => `
      <article class="cart-item">
        <img src="${product.image}" alt="">
        <div>
          <div class="cart-item-head">
            <strong>${product.name}</strong>
            <span>${formatCartPrice(subtotalCents)}</span>
          </div>
          <p class="cart-item-spec">${product.specification} · 单价 ${formatCartPrice(product.priceCents)}</p>
          <div class="cart-item-bottom">
            <div class="quantity-control" aria-label="${product.name}数量">
              <button type="button" data-cart-decrease="${product.id}" aria-label="减少${product.name}数量">−</button>
              <span>${quantity}</span>
              <button type="button" data-cart-increase="${product.id}" aria-label="增加${product.name}数量">＋</button>
            </div>
            <button class="cart-remove" type="button" data-cart-remove="${product.id}">删除</button>
          </div>
        </div>
      </article>
    `).join("");
  }
  cartTotalElement.textContent = formatCartPrice(totals.totalCents);
  cartCheckoutButton.disabled = items.length === 0;
  cartClearButton.hidden = items.length === 0;
  updateBagCount();
}

function setCartOpen(open, trigger = null) {
  if (open) {
    cartLastFocus = trigger || document.activeElement;
    renderCart();
    cartBackdrop.hidden = false;
    document.body.classList.add("cart-open");
    cartDrawer.focus();
  } else {
    cartBackdrop.hidden = true;
    if (checkoutBackdrop.hidden && orderSuccess.hidden) document.body.classList.remove("cart-open");
    cartLastFocus?.focus();
  }
}

function addProduct(product, trigger) {
  if (!window.WeiheAccount?.requireLoginForPurchase(trigger)) return;
  const items = readCart();
  const existing = items.find((item) => item.productId === product.id);
  if (existing) existing.quantity = Math.min(CART_MAX_QUANTITY, existing.quantity + 1);
  else items.push({ productId: product.id, quantity: 1 });
  saveCart(items);
  renderCart();
  setCartOpen(true, trigger);
}

function changeQuantity(productId, change) {
  const items = readCart();
  const item = items.find((candidate) => candidate.productId === productId);
  if (!item) return;
  item.quantity = Math.max(1, Math.min(CART_MAX_QUANTITY, item.quantity + change));
  saveCart(items);
  renderCart();
}

function removeItem(productId) {
  saveCart(readCart().filter((item) => item.productId !== productId));
  renderCart();
}

function escapeCartHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCheckoutAddresses() {
  const user = window.WeiheAccount.getUser();
  const addresses = Array.isArray(user.addressBook) ? user.addressBook : [];
  checkoutAddresses.innerHTML = addresses.map((address) => `
    <label class="checkout-address-option">
      <input type="radio" name="checkout-address" value="${address.id}" ${address.id === user.defaultAddressId ? "checked" : ""}>
      <span class="checkout-address-card">
        <strong>${escapeCartHtml(address.recipient)} · ${escapeCartHtml(address.phone)}</strong>
        <span>${escapeCartHtml(address.province)}${escapeCartHtml(address.city)}${escapeCartHtml(address.district)}<br>${escapeCartHtml(address.detail)}</span>
      </span>
    </label>
  `).join("");
  if (addresses.length && !checkoutAddresses.querySelector(":checked")) {
    checkoutAddresses.querySelector("input").checked = true;
  }
  return addresses.length;
}

function openCheckout() {
  if (!window.WeiheAccount?.isLoggedIn()) {
    setCartOpen(false);
    window.WeiheAccount?.requireLoginForPurchase(cartCheckoutButton);
    return;
  }
  const user = window.WeiheAccount.getUser();
  if (!user.addressBook?.length) {
    setCartOpen(false);
    window.WeiheAccount.openAccountCenter(cartCheckoutButton);
    return;
  }
  const totals = getCartTotals();
  checkoutSummary.textContent = `共 ${totals.quantity} 件商品 · 合计 ${formatCartPrice(totals.totalCents)}`;
  checkoutError.textContent = "";
  renderCheckoutAddresses();
  checkoutBackdrop.hidden = false;
  document.body.classList.add("cart-open");
  checkoutBackdrop.querySelector(".checkout-dialog").focus();
}

function closeCheckout() {
  checkoutBackdrop.hidden = true;
  if (cartBackdrop.hidden && orderSuccess.hidden) document.body.classList.remove("cart-open");
}

function confirmOrder() {
  const selectedAddress = checkoutAddresses.querySelector('input[name="checkout-address"]:checked');
  if (!selectedAddress) {
    checkoutError.textContent = "请选择一个收货地址。";
    return;
  }
  const orderNumber = `WH${Date.now().toString().slice(-10)}`;
  saveCart([]);
  renderCart();
  closeCheckout();
  document.querySelector("#success-order-number").textContent = `演示订单编号：${orderNumber}`;
  orderSuccess.hidden = false;
  document.body.classList.add("cart-open");
  orderSuccess.querySelector(".success-dialog").focus();
}

cartItemsElement.addEventListener("click", (event) => {
  const increase = event.target.closest("[data-cart-increase]");
  const decrease = event.target.closest("[data-cart-decrease]");
  const remove = event.target.closest("[data-cart-remove]");
  if (increase) changeQuantity(Number(increase.dataset.cartIncrease), 1);
  if (decrease) changeQuantity(Number(decrease.dataset.cartDecrease), -1);
  if (remove) removeItem(Number(remove.dataset.cartRemove));
});

cartClearButton.addEventListener("click", () => {
  saveCart([]);
  renderCart();
});
cartCheckoutButton.addEventListener("click", openCheckout);
cartBackdrop.querySelector(".cart-close").addEventListener("click", () => setCartOpen(false));
cartBackdrop.addEventListener("click", (event) => {
  if (event.target === cartBackdrop) setCartOpen(false);
});
checkoutBackdrop.querySelector(".checkout-close").addEventListener("click", closeCheckout);
checkoutBackdrop.addEventListener("click", (event) => {
  if (event.target === checkoutBackdrop) closeCheckout();
});
document.querySelector("#checkout-manage-address").addEventListener("click", () => {
  closeCheckout();
  window.WeiheAccount.openAccountCenter(document.querySelector("#checkout-manage-address"));
});
document.querySelector("#checkout-confirm").addEventListener("click", confirmOrder);
orderSuccess.querySelector(".success-close").addEventListener("click", () => {
  orderSuccess.hidden = true;
  document.body.classList.remove("cart-open");
});

document.addEventListener("keydown", (event) => {
  const activeDialog = !orderSuccess.hidden
    ? orderSuccess.querySelector(".success-dialog")
    : !checkoutBackdrop.hidden
      ? checkoutBackdrop.querySelector(".checkout-dialog")
      : !cartBackdrop.hidden
        ? cartDrawer
        : null;

  if (event.key === "Escape") {
    if (!orderSuccess.hidden) {
      orderSuccess.hidden = true;
      document.body.classList.remove("cart-open");
    } else if (!checkoutBackdrop.hidden) closeCheckout();
    else if (!cartBackdrop.hidden) setCartOpen(false);
    return;
  }

  if (event.key === "Tab" && activeDialog) {
    const focusable = [...activeDialog.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
    )].filter((element) => !element.hidden);
    if (!focusable.length) {
      event.preventDefault();
      activeDialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

window.WeiheCart = {
  addProduct,
  open(trigger) {
    if (!window.WeiheAccount?.requireLoginForPurchase(trigger)) return;
    setCartOpen(true, trigger);
  }
};

updateBagCount();
