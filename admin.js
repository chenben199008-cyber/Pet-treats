const ADMIN_ORDER_KEY = "weiheDemoOrders";
const ORDER_STATUSES = ["待处理", "已确认", "已发货", "已完成", "已取消"];
const panels = [...document.querySelectorAll(".admin-panel")];
const navButtons = [...document.querySelectorAll("[data-panel]")];
const productEditor = document.querySelector("#product-editor");
const productForm = document.querySelector("#product-form");
let editingProductId = null;

function esc(value) {
  return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function money(cents) { return `¥${Math.round(Number(cents || 0) / 100)}`; }
function readJson(key, fallback) { try { const value=JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } }
function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function getOrders() { const orders=readJson(ADMIN_ORDER_KEY, []); return Array.isArray(orders)?orders:[]; }

function showPanel(name) {
  panels.forEach((panel) => { panel.hidden = panel.id !== `panel-${name}`; });
  navButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.panel === name));
  document.querySelector("#page-title").textContent = {overview:"数据概览",products:"商品管理",orders:"订单管理",users:"用户概览"}[name];
  if(name==="overview") renderOverview();
  if(name==="products") renderProducts();
  if(name==="orders") renderOrders();
  if(name==="users") renderUsers();
}
navButtons.forEach((button)=>button.addEventListener("click",()=>showPanel(button.dataset.panel)));

function renderOverview() {
  const products=WeiheProductStore.getAllProducts(), orders=getOrders();
  document.querySelector("#metric-products").textContent=products.length;
  document.querySelector("#metric-sales").textContent=products.reduce((n,p)=>n+Number(p.monthlySales||0),0).toLocaleString("zh-CN");
  document.querySelector("#metric-orders").textContent=orders.length;
  document.querySelector("#metric-revenue").textContent=money(orders.reduce((n,o)=>n+Number(o.totalCents||0),0));
  document.querySelector("#overview-top-products").innerHTML=[...products].sort((a,b)=>b.monthlySales-a.monthlySales).slice(0,4).map((p,i)=>`<div class="mini-row"><span>0${i+1} · ${esc(p.name)}</span><strong>月销 ${Number(p.monthlySales).toLocaleString("zh-CN")}</strong></div>`).join("");
  document.querySelector("#overview-orders").innerHTML=orders.length?orders.slice(0,4).map(o=>`<div class="mini-row"><span>${esc(o.id)} · ${esc(o.status)}</span><strong>${money(o.totalCents)}</strong></div>`).join(""):'<p class="empty-state">暂无本地演示订单</p>';
}

function fillFoodFilter() {
  const select=document.querySelector("#product-food-filter"), current=select.value;
  const categories=[...new Set(WeiheProductStore.getAllProducts().map(p=>p.foodCategory))];
  select.innerHTML='<option value="">全部食品</option>'+categories.map(c=>`<option>${esc(c)}</option>`).join("");
  select.value=current;
}
function filteredProducts() {
  const query=document.querySelector("#product-search").value.trim().toLowerCase();
  const pet=document.querySelector("#product-pet-filter").value, food=document.querySelector("#product-food-filter").value, status=document.querySelector("#product-status-filter").value;
  return WeiheProductStore.getAllProducts().filter(p=>(!query||p.name.toLowerCase().includes(query))&&(!pet||p.petTypes.includes(pet))&&(!food||p.foodCategory===food)&&(!status||p.status===status));
}
function renderProducts() {
  fillFoodFilter();
  const list=filteredProducts();
  document.querySelector("#product-result-count").textContent=`找到 ${list.length} 款商品`;
  document.querySelector("#product-table-body").innerHTML=list.map(p=>`<tr>
    <td><div class="product-cell"><img src="${esc(p.image)}" alt=""><strong>${esc(p.name)}</strong></div></td>
    <td>${esc(p.petTypes.join("、"))}</td><td>${esc(p.foodCategory)}</td><td>${esc(p.specification)}</td><td>${money(p.priceCents)}</td>
    <td>${Number(p.monthlySales).toLocaleString("zh-CN")}</td><td><span class="status ${p.status==="inactive"?"inactive":""}">${p.status==="inactive"?"下架":"上架"}</span></td>
    <td><div class="row-actions"><button data-edit="${p.id}">编辑</button><button data-toggle="${p.id}">${p.status==="inactive"?"上架":"下架"}</button><button data-delete="${p.id}">删除</button></div></td>
  </tr>`).join("")||'<tr><td colspan="8" class="empty-state">没有匹配商品</td></tr>';
}
["product-search","product-pet-filter","product-food-filter","product-status-filter"].forEach(id=>document.querySelector(`#${id}`).addEventListener("input",renderProducts));

function openEditor(product=null) {
  editingProductId=product?.id??null; productForm.reset();
  document.querySelector("#editor-title").textContent=product?"编辑商品":"新增商品";
  if(product){
    for(const name of ["id","name","specification","foodCategory","image","monthlySales","description","ingredients","feedingGuide","status"]) if(productForm.elements[name]) productForm.elements[name].value=product[name]??"";
    productForm.elements.priceYuan.value=product.priceCents/100; productForm.elements.tags.value=(product.tags||[]).join(", ");
    [...productForm.elements.petTypes].forEach(input=>input.checked=product.petTypes.includes(input.value));
  }
  productEditor.hidden=false; productForm.elements.name.focus();
}
document.querySelector("#add-product").addEventListener("click",()=>openEditor());
document.querySelector("#close-product-editor").addEventListener("click",()=>productEditor.hidden=true);
productEditor.addEventListener("click",e=>{if(e.target===productEditor)productEditor.hidden=true});
productForm.addEventListener("submit",e=>{
  e.preventDefault(); const data=new FormData(productForm), pets=data.getAll("petTypes"), error=document.querySelector("#product-form-error");
  if(!pets.length){error.textContent="请至少选择一种适用宠物。";return}
  const product={
    id:editingProductId??Date.now(), name:data.get("name").trim(), description:data.get("description").trim(),
    priceCents:Math.round(Number(data.get("priceYuan"))*100), specification:data.get("specification").trim(),
    tags:data.get("tags").split(/[,，]/).map(x=>x.trim()).filter(Boolean), petTypes:pets, foodCategory:data.get("foodCategory").trim(),
    image:data.get("image").trim()||"assets/brand-preview.png", ingredients:data.get("ingredients").trim(),
    feedingGuide:data.get("feedingGuide").trim(), featured:false, monthlySales:Math.max(0,Math.floor(Number(data.get("monthlySales")))), status:data.get("status")
  };
  if(!product.name||!product.foodCategory||!product.specification||product.priceCents<=0){error.textContent="请完整填写商品名称、价格、规格和分类。";return}
  WeiheProductStore.upsert(product); error.textContent=""; productEditor.hidden=true; renderProducts(); renderOverview();
});
document.querySelector("#product-table-body").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"),toggle=e.target.closest("[data-toggle]"),del=e.target.closest("[data-delete]");
  const id=Number((edit||toggle||del)?.dataset.edit??(edit||toggle||del)?.dataset.toggle??(edit||toggle||del)?.dataset.delete);
  if(!id)return; const product=WeiheProductStore.getAllProducts().find(p=>Number(p.id)===id); if(!product)return;
  if(edit)openEditor(product);
  if(toggle){product.status=product.status==="inactive"?"active":"inactive";WeiheProductStore.upsert(product);renderProducts();renderOverview()}
  if(del&&confirm(`确定删除“${product.name}”吗？删除后商城将不再显示该商品。`)){WeiheProductStore.remove(id);renderProducts();renderOverview()}
});
document.querySelector("#reset-product-data").addEventListener("click",()=>{if(confirm("确定恢复基础商品数据吗？本地新增和修改将被清除。")){WeiheProductStore.reset();renderProducts();renderOverview()}});

function renderOrders() {
  const query=document.querySelector("#order-search").value.trim().toLowerCase(), status=document.querySelector("#order-status-filter").value;
  const orders=getOrders().filter(o=>(!query||String(o.id).toLowerCase().includes(query))&&(!status||o.status===status));
  document.querySelector("#order-table-body").innerHTML=orders.map(o=>`<tr><td>${esc(o.id)}</td><td>${new Date(o.createdAt).toLocaleString("zh-CN")}</td><td>${esc((o.items||[]).map(i=>i.name).join("、"))}</td><td>${Number(o.quantity||0)}</td><td>${money(o.totalCents)}</td><td>${esc(o.region||"未填写")}</td><td><select class="order-status" data-order-status="${esc(o.id)}">${ORDER_STATUSES.map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></td></tr>`).join("")||'<tr><td colspan="7" class="empty-state">暂无匹配订单。请在商城完成一次模拟购买。</td></tr>';
}
["order-search","order-status-filter"].forEach(id=>document.querySelector(`#${id}`).addEventListener("input",renderOrders));
document.querySelector("#order-table-body").addEventListener("change",e=>{if(!e.target.matches("[data-order-status]"))return;const orders=getOrders(),order=orders.find(o=>o.id===e.target.dataset.orderStatus);if(order){order.status=e.target.value;writeJson(ADMIN_ORDER_KEY,orders);renderOverview()}});

function renderUsers() {
  const user=readJson("weiheDemoUser",null), target=document.querySelector("#user-overview");
  if(!user?.profile){target.innerHTML='<p class="empty-state">当前浏览器没有演示用户资料</p>';return}
  target.innerHTML=`<article class="user-card"><dl>
    <div><dt>演示昵称</dt><dd>${esc(user.profile.nickname||"未填写")}</dd></div>
    <div><dt>脱敏手机号</dt><dd>${esc(user.profile.phone||"未保存")}</dd></div>
    <div><dt>地址数量</dt><dd>${Array.isArray(user.addressBook)?user.addressBook.length:0} 个</dd></div>
    <div><dt>默认地址</dt><dd>${user.defaultAddressId?"已设置":"未设置"}</dd></div>
    <div><dt>创建时间</dt><dd>${user.createdAt?new Date(user.createdAt).toLocaleString("zh-CN"):"未记录"}</dd></div>
  </dl></article>`;
}

renderOverview();
