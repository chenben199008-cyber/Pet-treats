const products = window.WeiheProductStore.getVisibleProducts();

const grid = document.querySelector("#product-grid");
const rankingList = document.querySelector("#ranking-list");
const modalBackdrop = document.querySelector("#product-modal");
const modal = modalBackdrop.querySelector(".product-modal");
const closeButton = modalBackdrop.querySelector(".modal-close");
const modalAddButton = modalBackdrop.querySelector(".modal-add");
const toast = document.querySelector("#toast");
const bagButton = document.querySelector(".bag-placeholder");
const petFilters = document.querySelector("#pet-filters");
const foodFilters = document.querySelector("#food-filters");
const filterCount = document.querySelector("#filter-count");
const productEmpty = document.querySelector("#product-empty");
const resetFiltersButton = document.querySelector("#reset-filters");
let lastFocusedElement = null;
let toastTimer = null;
let activeProduct = null;
let activePetType = "全部";
let activeFoodCategory = "全部食品";

const PET_TYPES = ["全部", "猫咪", "狗狗"];

function formatPrice(priceCents) {
  return `¥${(priceCents / 100).toFixed(0)}`;
}

function createProductCard(product, index) {
  const salesRank = [...products]
    .sort((a, b) => b.monthlySales - a.monthlySales)
    .findIndex((item) => item.id === product.id) + 1;
  const article = document.createElement("article");
  article.className = "product-card";
  article.style.animationDelay = `${index * 55}ms`;
  article.innerHTML = `
    <div class="product-image-wrap">
      <div class="product-tags">${product.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
      <img src="${product.image}" alt="${product.name}" loading="lazy">
    </div>
    <div class="product-info">
      <p class="product-pets">${product.petTypes.join(" · ")} / ${product.foodCategory}</p>
      <div class="product-title-row">
        <h3>${product.name}</h3>
        <strong>${formatPrice(product.priceCents)}</strong>
      </div>
      <p class="product-description">${product.description}</p>
      <div class="product-meta">
        <span>${product.specification}</span>
        <span class="monthly-sales">月销 ${product.monthlySales.toLocaleString("zh-CN")}</span>
      </div>
      <p class="sales-rank ${salesRank <= 3 ? "is-top" : ""}">热销第 ${salesRank} 名</p>
      <div class="product-actions">
        <button class="detail-button" type="button" data-detail="${product.id}" aria-label="查看${product.name}详情">查看详情</button>
        <button class="add-button" type="button" data-add="${product.id}" aria-label="将${product.name}加入购物车">＋</button>
      </div>
    </div>
  `;

  const image = article.querySelector("img");
  image.addEventListener("error", () => image.parentElement.classList.add("image-fallback"));
  return article;
}

function renderHotRanking() {
  const rankedProducts = [...products]
    .sort((a, b) => b.monthlySales - a.monthlySales)
    .slice(0, 3);

  rankingList.innerHTML = rankedProducts.map((product, index) => `
    <button class="ranking-item" type="button" data-ranking="${product.id}" aria-label="查看热销第${index + 1}名${product.name}">
      <span class="ranking-number">0${index + 1}</span>
      <img src="${product.image}" alt="">
      <span class="ranking-info">
        <small>TOP ${index + 1} · 月销 ${product.monthlySales.toLocaleString("zh-CN")}</small>
        <strong>${product.name}</strong>
      </span>
      <b>${formatPrice(product.priceCents)}</b>
    </button>
  `).join("");
}

function getAvailableFoodCategories() {
  const relevantProducts = activePetType === "全部"
    ? products
    : products.filter((product) => product.petTypes.includes(activePetType));
  return ["全部食品", ...new Set(relevantProducts.map((product) => product.foodCategory))];
}

function getFilteredProducts() {
  return products.filter((product) => {
    const matchesPet = activePetType === "全部" || product.petTypes.includes(activePetType);
    const matchesFood = activeFoodCategory === "全部食品" || product.foodCategory === activeFoodCategory;
    return matchesPet && matchesFood;
  });
}

function createFilterButton(label, type, activeValue) {
  const button = document.createElement("button");
  button.className = "filter-button";
  button.type = "button";
  button.textContent = label;
  button.dataset.filterType = type;
  button.dataset.filterValue = label;
  button.setAttribute("aria-pressed", String(label === activeValue));
  return button;
}

function renderFilters() {
  petFilters.replaceChildren(...PET_TYPES.map((label) => createFilterButton(label, "pet", activePetType)));
  const foodCategories = getAvailableFoodCategories();
  if (!foodCategories.includes(activeFoodCategory)) activeFoodCategory = "全部食品";
  foodFilters.replaceChildren(
    ...foodCategories.map((label) => createFilterButton(label, "food", activeFoodCategory))
  );
}

function renderProducts(productList = products) {
  const fragment = document.createDocumentFragment();
  productList.forEach((product, index) => fragment.appendChild(createProductCard(product, index)));
  grid.replaceChildren(fragment);
  grid.hidden = productList.length === 0;
  productEmpty.hidden = productList.length !== 0;
  filterCount.textContent = productList.length
    ? `找到 ${productList.length} 款商品`
    : "暂时没有匹配商品";
}

function applyFilters() {
  renderFilters();
  renderProducts(getFilteredProducts());
}

function handleFilterClick(event) {
  const button = event.target.closest("[data-filter-type]");
  if (!button) return;
  if (button.dataset.filterType === "pet") {
    activePetType = button.dataset.filterValue;
    const availableFoods = getAvailableFoodCategories();
    if (!availableFoods.includes(activeFoodCategory)) activeFoodCategory = "全部食品";
  } else {
    activeFoodCategory = button.dataset.filterValue;
  }
  applyFilters();
}

petFilters.addEventListener("click", handleFilterClick);
foodFilters.addEventListener("click", handleFilterClick);
resetFiltersButton.addEventListener("click", () => {
  activePetType = "全部";
  activeFoodCategory = "全部食品";
  applyFilters();
  petFilters.querySelector('[aria-pressed="true"]')?.focus();
});

rankingList.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-ranking]");
  if (!trigger) return;
  const product = products.find((item) => item.id === Number(trigger.dataset.ranking));
  if (product) openProductModal(product, trigger);
});

function openProductModal(product, trigger) {
  activeProduct = product;
  lastFocusedElement = trigger;
  document.querySelector("#modal-image").src = product.image;
  document.querySelector("#modal-image").alt = product.name;
  document.querySelector("#modal-category").textContent = `${product.petTypes.join(" · ")} / ${product.foodCategory}`;
  document.querySelector("#modal-title").textContent = product.name;
  document.querySelector("#modal-price").textContent = formatPrice(product.priceCents);
  document.querySelector("#modal-description").textContent = product.description;
  document.querySelector("#modal-ingredients").textContent = product.ingredients;
  document.querySelector("#modal-pets").textContent = product.petTypes.join("、");
  document.querySelector("#modal-spec").textContent = product.specification;
  document.querySelector("#modal-feeding").textContent = product.feedingGuide;
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  modal.focus();
}

function closeProductModal() {
  modalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
  activeProduct = null;
  lastFocusedElement?.focus();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function showCartPlaceholder(product) {
  if (!window.WeiheCart) return;
  if (product) window.WeiheCart.addProduct(product, document.activeElement);
  else window.WeiheCart.open(document.activeElement);
}

grid.addEventListener("click", (event) => {
  const detailTrigger = event.target.closest("[data-detail]");
  const addTrigger = event.target.closest("[data-add]");
  if (detailTrigger) {
    const product = products.find((item) => item.id === Number(detailTrigger.dataset.detail));
    if (product) openProductModal(product, detailTrigger);
  }
  if (addTrigger) {
    const product = products.find((item) => item.id === Number(addTrigger.dataset.add));
    if (product) showCartPlaceholder(product);
  }
});

closeButton.addEventListener("click", closeProductModal);
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeProductModal();
});
modalAddButton.addEventListener("click", () => showCartPlaceholder(activeProduct));
bagButton.addEventListener("click", () => showCartPlaceholder(null));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.hidden) {
    closeProductModal();
  }
  if (event.key === "Tab" && !modalBackdrop.hidden) {
    const focusable = [...modal.querySelectorAll("button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.disabled);
    if (!focusable.length) return;
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

renderHotRanking();
applyFilters();
