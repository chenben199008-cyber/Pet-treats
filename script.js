const products = [
  {
    id: 1,
    name: "原切鸡胸肉条",
    description: "低温慢烘，保留鸡胸肉自然纤维与清淡肉香。",
    priceCents: 3900,
    specification: "80g / 袋",
    tags: ["推荐", "单一肉源"],
    petTypes: ["猫咪", "狗狗"],
    foodCategory: "鸡肉",
    image: "assets/chicken.jpg",
    ingredients: "鸡胸肉 100%",
    feedingGuide: "每日 3–8 条，按宠物体型酌量调整。",
    featured: true,
    monthlySales: 1286
  },
  {
    id: 2,
    name: "冻干鸭肉粒",
    description: "小颗易取，适合训练互动，也可以捏碎拌入主粮。",
    priceCents: 4200,
    specification: "60g / 罐",
    tags: ["冻干", "训练奖励"],
    petTypes: ["猫咪", "狗狗"],
    foodCategory: "鸭肉",
    image: "assets/duck.jpg",
    ingredients: "鸭胸肉 100%",
    feedingGuide: "每日 5–12 粒，零食热量计入每日总量。",
    featured: true,
    monthlySales: 962
  },
  {
    id: 3,
    name: "三文鱼脆粒",
    description: "轻盈酥脆，鱼香自然，为挑剔味蕾增加新鲜感。",
    priceCents: 4600,
    specification: "55g / 罐",
    tags: ["鱼肉", "拌粮"],
    petTypes: ["猫咪"],
    foodCategory: "鱼类",
    image: "assets/salmon.jpg",
    ingredients: "三文鱼 98%、蛋黄 2%",
    feedingGuide: "每日 3–6 粒，首次食用请少量尝试。",
    featured: false,
    monthlySales: 738
  },
  {
    id: 4,
    name: "蛋黄鸡肉冻干",
    description: "酥松小方块，鸡肉与蛋黄组合，适口又方便分食。",
    priceCents: 4300,
    specification: "50g / 罐",
    tags: ["猫咪", "冻干"],
    petTypes: ["猫咪"],
    foodCategory: "冻干",
    image: "assets/freeze-dried.jpg",
    ingredients: "鸡胸肉 85%、蛋黄 15%",
    feedingGuide: "每日 3–6 粒，并保证宠物有充足饮水。",
    featured: false,
    monthlySales: 611
  },
  {
    id: 5,
    name: "牛筋磨牙棒",
    description: "紧实耐嚼，适合作为狗狗独处或陪伴时的小奖励。",
    priceCents: 5200,
    specification: "3 支 / 袋",
    tags: ["狗狗", "磨牙"],
    petTypes: ["狗狗"],
    foodCategory: "磨牙",
    image: "assets/chew.jpg",
    ingredients: "牛筋 100%",
    feedingGuide: "每次 10–20 分钟，进食过程需要主人陪同。",
    featured: false,
    monthlySales: 584
  },
  {
    id: 6,
    name: "兔肉温烘肉方",
    description: "单一动物蛋白，柔韧易掰，适合日常温和奖励。",
    priceCents: 5600,
    specification: "70g / 袋",
    tags: ["新品", "单一肉源"],
    petTypes: ["猫咪", "狗狗"],
    foodCategory: "兔肉",
    image: "assets/rabbit.jpg",
    ingredients: "兔肉 100%",
    feedingGuide: "每日 2–6 块，第一次尝试请观察适应情况。",
    featured: false,
    monthlySales: 326
  }
];

const grid = document.querySelector("#product-grid");
const rankingList = document.querySelector("#ranking-list");
const modalBackdrop = document.querySelector("#product-modal");
const modal = modalBackdrop.querySelector(".product-modal");
const closeButton = modalBackdrop.querySelector(".modal-close");
const modalAddButton = modalBackdrop.querySelector(".modal-add");
const toast = document.querySelector("#toast");
const bagButton = document.querySelector(".bag-placeholder");
let lastFocusedElement = null;
let toastTimer = null;
let activeProduct = null;

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

function renderProducts() {
  const fragment = document.createDocumentFragment();
  products.forEach((product, index) => fragment.appendChild(createProductCard(product, index)));
  grid.replaceChildren(fragment);
}

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
  const suffix = product ? `“${product.name}”已记录，` : "";
  showToast(`${suffix}购物车将在下一阶段开放`);
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
renderProducts();
