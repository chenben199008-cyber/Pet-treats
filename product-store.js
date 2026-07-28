(function () {
  const STORAGE_KEY = "weiheAdminProducts";
  let memoryProducts = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isValidProduct(product) {
    return product && Number.isFinite(Number(product.id)) && typeof product.name === "string"
      && Number.isInteger(product.priceCents) && Array.isArray(product.petTypes);
  }

  function readStored() {
    if (memoryProducts) return clone(memoryProducts);
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(parsed) && parsed.every(isValidProduct)) {
        memoryProducts = parsed;
        return clone(parsed);
      }
    } catch {}
    memoryProducts = clone(window.WEIHE_BASE_PRODUCTS || []);
    return clone(memoryProducts);
  }

  function saveAll(products) {
    memoryProducts = clone(products);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryProducts)); } catch {}
    return clone(memoryProducts);
  }

  window.WeiheProductStore = {
    getAllProducts: readStored,
    getVisibleProducts() {
      return readStored().filter((product) => product.status !== "inactive");
    },
    saveAll,
    upsert(product) {
      const products = readStored();
      const index = products.findIndex((item) => Number(item.id) === Number(product.id));
      if (index >= 0) products[index] = clone(product);
      else products.push(clone(product));
      return saveAll(products);
    },
    remove(id) {
      return saveAll(readStored().filter((product) => Number(product.id) !== Number(id)));
    },
    reset() {
      memoryProducts = clone(window.WEIHE_BASE_PRODUCTS || []);
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      return clone(memoryProducts);
    }
  };
})();
