const WEIHE_USER_KEY = "weiheDemoUser";
const WEIHE_SESSION_KEY = "weiheSession";
const WEIHE_PHONE_PATTERN = /^1\d{10}$/;

const gate = document.querySelector("#account-gate");
const accountCenter = document.querySelector("#account-center");
const gateForm = document.querySelector("#gate-login-form");
const gateMessage = document.querySelector("#gate-message");
const accountOpenButtons = [...document.querySelectorAll("[data-account-open]")];
const guestEntry = document.querySelector("#guest-entry");
const addressForm = document.querySelector("#address-form");
const addressList = document.querySelector("#address-list");
const addressCount = document.querySelector("#address-count");
let accountLastFocus = null;

function readStoredJson(storage, key, fallback = null) {
  try {
    return JSON.parse(storage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function getSession() {
  return readStoredJson(sessionStorage, WEIHE_SESSION_KEY);
}

function getUser() {
  return readStoredJson(localStorage, WEIHE_USER_KEY, {
    version: 1,
    profile: { nickname: "威禾会员", phone: "" },
    addressBook: [],
    defaultAddressId: null,
    createdAt: new Date().toISOString()
  });
}

function saveUser(user) {
  return writeStoredJson(localStorage, WEIHE_USER_KEY, user);
}

function maskPhone(phone) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setSession(role) {
  writeStoredJson(sessionStorage, WEIHE_SESSION_KEY, { role, startedAt: new Date().toISOString() });
  updateAccountButtons();
}

function setDialogOpen(dialog, open, trigger = null) {
  if (open) {
    accountLastFocus = trigger || document.activeElement;
    dialog.hidden = false;
    document.body.classList.add("account-open");
    window.setTimeout(() => dialog.querySelector("input, button, [tabindex]")?.focus(), 0);
  } else {
    dialog.hidden = true;
    if (gate.hidden && accountCenter.hidden) document.body.classList.remove("account-open");
    accountLastFocus?.focus();
  }
}

function updateAccountButtons() {
  const session = getSession();
  const label = session?.role === "user" ? "账户中心" : session?.role === "guest" ? "游客登录" : "登录 / 注册";
  accountOpenButtons.forEach((button) => {
    button.textContent = label;
    button.setAttribute("aria-label", label);
  });
}

function openLogin(message = "", trigger = null, closable = true) {
  if (message) gateMessage.textContent = message;
  gate.querySelector("[data-account-close]").hidden = !closable;
  setDialogOpen(gate, true, trigger);
}

function renderAddresses() {
  const user = getUser();
  const addresses = Array.isArray(user.addressBook) ? user.addressBook : [];
  addressCount.textContent = `${addresses.length} 个`;
  document.querySelector("#account-welcome").textContent = `${user.profile?.nickname || "威禾会员"}，你可以在这里管理收货地址。`;

  if (!addresses.length) {
    addressList.innerHTML = '<p class="address-empty">还没有地址，请先填写左侧表单。</p>';
    return;
  }

  addressList.innerHTML = addresses.map((address) => `
    <article class="address-item ${address.id === user.defaultAddressId ? "is-default" : ""}">
      <div class="address-item-head">
        <strong>${escapeHtml(address.recipient)} · ${escapeHtml(address.phone)}</strong>
        ${address.id === user.defaultAddressId ? '<span class="default-mark">默认地址</span>' : ""}
      </div>
      <p>${escapeHtml(address.province)}${escapeHtml(address.city)}${escapeHtml(address.district)}<br>${escapeHtml(address.detail)}</p>
      <div class="address-actions">
        ${address.id !== user.defaultAddressId ? `<button type="button" data-default-address="${address.id}">设为默认</button>` : ""}
        <button type="button" data-delete-address="${address.id}">删除</button>
      </div>
    </article>
  `).join("");
}

function openAccountCenter(trigger = null) {
  renderAddresses();
  setDialogOpen(accountCenter, true, trigger);
  if (!getUser().addressBook?.length) {
    document.querySelector("#address-form input")?.focus();
  }
}

accountOpenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (getSession()?.role === "user") openAccountCenter(button);
    else openLogin("登录后可以填写和管理多个收货地址。", button, true);
  });
});

gateForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const phone = gateForm.elements.phone;
  const password = gateForm.elements.password;
  const phoneError = document.querySelector("#gate-phone-error");
  const passwordError = document.querySelector("#gate-password-error");
  phoneError.textContent = WEIHE_PHONE_PATTERN.test(phone.value.trim()) ? "" : "请输入以 1 开头的 11 位手机号";
  passwordError.textContent = password.value.length >= 6 ? "" : "密码至少需要 6 位";
  if (phoneError.textContent || passwordError.textContent) {
    (phoneError.textContent ? phone : password).focus();
    return;
  }

  const user = getUser();
  if (!user.profile?.phone) user.profile.phone = maskPhone(phone.value.trim());
  saveUser(user);
  setSession("user");
  password.value = "";
  setDialogOpen(gate, false);
});

guestEntry.addEventListener("click", () => {
  setSession("guest");
  setDialogOpen(gate, false);
});

document.querySelector("[data-account-close]").addEventListener("click", () => setDialogOpen(gate, false));
document.querySelector("[data-account-center-close]").addEventListener("click", () => setDialogOpen(accountCenter, false));

document.querySelector("#account-logout").addEventListener("click", () => {
  try { sessionStorage.removeItem(WEIHE_SESSION_KEY); } catch {}
  setDialogOpen(accountCenter, false);
  updateAccountButtons();
  openLogin("你已退出登录，可以重新登录或以游客身份进入。", null, false);
});

addressForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(addressForm).entries());
  const error = document.querySelector("#address-error");
  if (Object.values(data).some((value) => !String(value).trim())) {
    error.textContent = "请完整填写收货人、手机号、地区和详细地址。";
    addressForm.querySelector("input:invalid, input")?.focus();
    return;
  }
  if (!WEIHE_PHONE_PATTERN.test(data.phone.trim())) {
    error.textContent = "请输入以 1 开头的 11 位手机号。";
    addressForm.elements.phone.focus();
    return;
  }

  const user = getUser();
  const address = {
    id: `address-${Date.now()}`,
    recipient: data.recipient.trim(),
    phone: data.phone.trim(),
    province: data.province.trim(),
    city: data.city.trim(),
    district: data.district.trim(),
    detail: data.detail.trim(),
    isDefault: false
  };
  user.addressBook = Array.isArray(user.addressBook) ? user.addressBook : [];
  user.addressBook.push(address);
  if (!user.defaultAddressId) user.defaultAddressId = address.id;
  address.isDefault = user.defaultAddressId === address.id;
  saveUser(user);
  addressForm.reset();
  error.textContent = "";
  renderAddresses();
});

addressList.addEventListener("click", (event) => {
  const defaultButton = event.target.closest("[data-default-address]");
  const deleteButton = event.target.closest("[data-delete-address]");
  if (!defaultButton && !deleteButton) return;
  const user = getUser();

  if (defaultButton) user.defaultAddressId = defaultButton.dataset.defaultAddress;
  if (deleteButton) {
    user.addressBook = user.addressBook.filter((address) => address.id !== deleteButton.dataset.deleteAddress);
    if (user.defaultAddressId === deleteButton.dataset.deleteAddress) {
      user.defaultAddressId = user.addressBook[0]?.id || null;
    }
  }
  user.addressBook.forEach((address) => { address.isDefault = address.id === user.defaultAddressId; });
  saveUser(user);
  renderAddresses();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!accountCenter.hidden) setDialogOpen(accountCenter, false);
  else if (!gate.hidden && getSession()) setDialogOpen(gate, false);
});

window.WeiheAccount = {
  requireLoginForPurchase(trigger) {
    if (getSession()?.role === "user") return true;
    openLogin("游客可以浏览商品，但购买和填写收货地址前需要先登录。", trigger, true);
    return false;
  },
  openAccountCenter
};

updateAccountButtons();
if (!getSession()) openLogin("", null, false);
