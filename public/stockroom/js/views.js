"use strict";

/* ------------------------------------------------------------------ */
/* Overview                                                           */
/* ------------------------------------------------------------------ */

function overviewTemplate() {
  const stats = getStats();
  const attention = attentionProducts();
  const flow = lastSevenDaysFlow();
  const recent = recentMovements(6);
  const categories = categoryBreakdown();
  const maxCategory = Math.max(1, ...categories.map((category) => category.value));
  const avgPerSku = stats.skus ? Math.round(stats.units / stats.skus) : 0;
  const yMax = Math.max(40, Math.ceil(Math.max(1, ...flow.days.map((day) => Math.max(day.in, day.out))) / 40) * 40);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((fraction) => Math.round(yMax * fraction));

  return `
    <div class="view">
      <section class="snapshot" aria-label="Inventory snapshot">
        <div class="snapshot__cell">
          <span class="stat-label">Active SKUs</span>
          <span class="stat-value">${num(stats.skus)}</span>
          <span class="stat-meta">${stats.categories} ${plural(stats.categories, "category", "categories")} · ${stats.suppliers} suppliers</span>
        </div>
        <div class="snapshot__cell">
          <span class="stat-label">Units on hand</span>
          <span class="stat-value">${num(stats.units)}</span>
          <span class="stat-meta">${avgPerSku} units per SKU on average</span>
        </div>
        <div class="snapshot__cell">
          <span class="stat-label">Inventory value</span>
          <span class="stat-value">${money(stats.value)}</span>
          <span class="stat-meta">At cost · ${money(stats.retail)} at retail</span>
        </div>
        <div class="snapshot__cell snapshot__cell--attention">
          <span class="stat-label">Needs attention</span>
          <span class="stat-value">${stats.attention}</span>
          <span class="stat-meta">${attentionSummary()}</span>
          <a class="stat-link" href="#/inventory" data-action="review-attention">Review restock queue <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg></a>
        </div>
      </section>

      <div class="overview-grid">
        <section class="panel flow-panel" aria-labelledby="flow-title">
          <header class="panel__head">
            <div>
              <h2 class="panel__title" id="flow-title">Unit flow</h2>
              <p class="panel__sub">Received vs. dispatched · last 7 days</p>
            </div>
            <div class="legend" aria-label="Chart legend">
              <span><i class="in"></i>Received</span>
              <span><i class="out"></i>Dispatched</span>
            </div>
          </header>
          <div class="chart">
            <div class="chart__body">
              <div class="chart__y" aria-hidden="true">${ticks.map((tick) => `<span>${num(tick)}</span>`).join("")}</div>
              <div class="chart__main">
                <div class="chart__plot">
                  <div class="chart__groups">
                    ${flow.days.map((day) => `
                      <div class="chart__group" role="img" aria-label="${esc(day.dateLabel)}: ${day.in} received, ${day.out} dispatched">
                        <span class="chart__tip">${num(day.in)} in · ${num(day.out)} out</span>
                        <span class="chart__bar chart__bar--in" style="height:${Math.max(0, (day.in / yMax) * 100).toFixed(1)}%"></span>
                        <span class="chart__bar chart__bar--out" style="height:${Math.max(0, (day.out / yMax) * 100).toFixed(1)}%"></span>
                      </div>`).join("")}
                  </div>
                </div>
                <div class="chart__x" aria-hidden="true">
                  ${flow.days.map((day, index) => `<span class="${index === flow.days.length - 1 ? "today" : ""}">${esc(day.dateLabel)}</span>`).join("")}
                </div>
              </div>
            </div>
            <div class="chart__foot">
              <div class="chart__stat"><span>Received</span><strong class="positive">+${num(flow.totalIn)}</strong></div>
              <div class="chart__stat"><span>Dispatched</span><strong class="negative">−${num(flow.totalOut)}</strong></div>
              <div class="chart__stat"><span>Net change</span><strong class="${flow.net > 0 ? "positive" : flow.net < 0 ? "negative" : "neutral"}">${flow.net > 0 ? "+" : flow.net < 0 ? "−" : ""}${num(Math.abs(flow.net))}</strong></div>
            </div>
          </div>
        </section>

        <section class="panel restock-panel" aria-labelledby="restock-title">
          <header class="panel__head">
            <div>
              <h2 class="panel__title" id="restock-title">Restock queue</h2>
              <p class="panel__sub">${attention.length ? `${attention.length} ${plural(attention.length, "item")} below reorder point` : "All stock above reorder point"}</p>
            </div>
            <button class="panel__link" type="button" data-action="review-attention">View all <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg></button>
          </header>
          ${attention.length ? `<div class="restock-list">
            ${attention.slice(0, 5).map((product) => {
              const status = statusOf(product);
              return `
                <button class="restock-row" type="button" data-action="receive-stock" data-id="${esc(product.id)}">
                  <span class="sr-only">Receive stock for </span>
                  <span class="tile tile--${categoryClass(product.category)}" aria-hidden="true">${esc(initials(product.name))}</span>
                  <span class="restock-row__main">
                    <span class="restock-row__name">${esc(product.name)}</span>
                    <span class="restock-row__meta"><span class="mono">${esc(product.sku)}</span> · ${esc(product.supplier)}</span>
                    ${railMarkup(product)}
                  </span>
                  <span class="restock-row__qty">
                    <strong class="is-${status}">${num(product.stock)}</strong>
                    <span>/ ${num(product.reorder)}</span>
                  </span>
                  <span class="restock-row__chev" aria-hidden="true"><svg class="icon"><use href="#i-arrow-right"/></svg></span>
                </button>`;
            }).join("")}
          </div>` : `
            <div class="restock-empty">
              <svg class="icon" aria-hidden="true"><use href="#i-check-circle"/></svg>
              <strong>Nothing to reorder</strong>
              <span>Every product is above its reorder point.</span>
            </div>`}
        </section>

        <section class="panel recent-panel" aria-labelledby="recent-title">
          <header class="panel__head">
            <div>
              <h2 class="panel__title" id="recent-title">Recent movement</h2>
              <p class="panel__sub">Latest receipts, dispatches, and counts</p>
            </div>
            <a class="panel__link" href="#/movements">View history <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg></a>
          </header>
          <div class="recent-list">
            ${recent.length ? recent.map((movement) => `
              <div class="recent-row">
                <span class="movement-icon movement-icon--${movement.type}" aria-hidden="true"><svg class="icon"><use href="#${movementIcon(movement.type)}"/></svg></span>
                <span class="recent-row__main">
                  <span class="recent-row__name">${esc(movement.productName)}</span>
                  <span class="recent-row__meta"><span class="mono">${esc(movement.ref)}</span> · ${esc(relativeWhen(movement.at))}</span>
                </span>
                <span class="recent-row__qty ${qtyClass(movement.type)}">${signedQty(movement.qty, movement.type)}<small>${esc(movement.unit)}</small></span>
              </div>`).join("") : `
              <div class="empty-state"><div class="empty-state__icon"><svg class="icon"><use href="#i-flow"/></svg></div><h3>No movement recorded</h3><p>Receive or remove stock and it will appear here.</p></div>`}
          </div>
        </section>

        <section class="panel category-panel" aria-labelledby="category-title">
          <header class="panel__head">
            <div>
              <h2 class="panel__title" id="category-title">Value by category</h2>
              <p class="panel__sub">Inventory at cost · ${money(stats.value)} total</p>
            </div>
          </header>
          <div class="category-list">
            ${categories.length ? categories.map((category) => `
              <div class="category-row">
                <span class="category-row__name">${esc(category.name)} <span class="mono" style="font-family:var(--font-mono);font-size:9px;color:var(--ink-3);">· ${category.count}</span></span>
                <span class="category-row__value">${money(category.value)}</span>
                <span class="category-row__bar"><span class="category-row__fill" style="width:${Math.max(2, (category.value / maxCategory) * 100).toFixed(1)}%"></span></span>
              </div>`).join("") : `<div class="empty-state"><p>No categories yet.</p></div>`}
          </div>
        </section>
      </div>

      <section class="overview-centres" aria-labelledby="overview-centres-title">
        <div class="overview-centres__head">
          <div>
            <h2 class="overview-centres__title" id="overview-centres-title">Satsang Place</h2>
            <p class="overview-centres__sub">Every Satsang Place and its item requirements at a glance.</p>
          </div>
          <a class="panel__link" href="#/centres">Open Satsang Places <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg></a>
        </div>
        ${centreMasterMarkup()}
      </section>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Inventory                                                          */
/* ------------------------------------------------------------------ */

function inventoryFilteredProducts() {
  const filters = ui.inventory;
  const query = filters.q.trim().toLowerCase();
  const filtered = state.products.filter((product) => {
    const status = statusOf(product);
    const statusMatch = filters.status === "all"
      || (filters.status === "attention" ? status !== "healthy" : status === filters.status);
    const categoryMatch = filters.category === "all" || product.category === filters.category;
    const supplierMatch = filters.supplier === "all" || product.supplier === filters.supplier;
    const queryMatch = !query || [product.name, product.sku, product.category, product.supplier]
      .join(" ").toLowerCase().includes(query);
    return statusMatch && categoryMatch && supplierMatch && queryMatch;
  });
  const direction = filters.dir === "desc" ? -1 : 1;
  filtered.sort((a, b) => {
    if (filters.sort === "stock") return (a.stock - b.stock) * direction || a.name.localeCompare(b.name);
    if (filters.sort === "price") return (a.price - b.price) * direction || a.name.localeCompare(b.name);
    if (filters.sort === "updated") return (new Date(a.updatedAt) - new Date(b.updatedAt)) * direction;
    return a.name.localeCompare(b.name) * direction;
  });
  return filtered;
}

function inventoryHasFilters() {
  const { q, category, supplier, status } = ui.inventory;
  return Boolean(q || category !== "all" || supplier !== "all" || status !== "all");
}

function statusTabsMarkup() {
  const stats = getStats();
  const tabs = [
    { key: "all", label: "All stock", count: stats.skus },
    { key: "attention", label: "Needs attention", count: stats.attention },
    { key: "healthy", label: "Healthy", count: stats.skus - stats.attention },
    { key: "low", label: "Low", count: stats.low },
    { key: "out", label: "Out", count: stats.out }
  ];
  return tabs.map((tab) => `
    <button class="status-tab ${ui.inventory.status === tab.key ? "is-active" : ""}" type="button" data-action="filter-status" data-status="${tab.key}" aria-pressed="${ui.inventory.status === tab.key}">
      ${tab.label}<span class="status-tab__count">${tab.count}</span>
    </button>`).join("");
}

function inventoryTemplate() {
  const categories = [...new Set(state.products.map((product) => product.category))].sort();
  const suppliers = [...new Set(state.products.map((product) => product.supplier))].sort();
  const locked = isSectionLocked("inventory");
  return `
    <div class="view">
      <div class="page-tools">
        <p class="page-tools__note">Manage stock levels, pricing, and reorder points. Changes are saved in this browser.</p>
        <div class="page-tools__actions">
          <button class="btn btn--secondary" type="button" data-action="export-csv"><svg class="icon" aria-hidden="true"><use href="#i-download"/></svg>Export CSV</button>
          <button class="btn btn--primary" type="button" data-action="add-product" ${locked ? "disabled title=\"Inventory is locked by an administrator.\"" : ""}><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>Add product</button>
        </div>
      </div>

      <section class="panel inventory-panel" aria-label="Product inventory">
        <div class="inventory-head">
          <div class="status-tabs" role="group" aria-label="Filter by stock status">
            ${statusTabsMarkup()}
          </div>
          <div class="inventory-toolbar">
            <div class="text-input">
              <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
              <input class="input" id="inventory-search" type="search" placeholder="Search product, SKU, or supplier" aria-label="Search inventory" value="${esc(ui.inventory.q)}" autocomplete="off" />
            </div>
            <div class="select-wrap">
              <select class="input" id="inventory-category" aria-label="Filter by category">
                <option value="all">All categories</option>
                ${categories.map((category) => `<option value="${esc(category)}" ${ui.inventory.category === category ? "selected" : ""}>${esc(category)}</option>`).join("")}
              </select>
              <svg class="icon" aria-hidden="true"><use href="#i-chevron-down"/></svg>
            </div>
            <div class="select-wrap select-wrap--wide">
              <select class="input" id="inventory-supplier" aria-label="Filter by supplier">
                <option value="all">All suppliers</option>
                ${suppliers.map((supplier) => `<option value="${esc(supplier)}" ${ui.inventory.supplier === supplier ? "selected" : ""}>${esc(supplier)}</option>`).join("")}
              </select>
              <svg class="icon" aria-hidden="true"><use href="#i-chevron-down"/></svg>
            </div>
          </div>
        </div>
        <div class="table-wrap" id="inventory-table"></div>
        <div class="table-foot">
          <span id="inventory-count"></span>
          <span class="table-foot__right">
            <span class="foot-note">Values in INR</span>
            <button class="text-btn" type="button" data-action="clear-filters" id="inventory-clear" hidden>Clear filters</button>
          </span>
        </div>
      </section>
    </div>`;
}

function sortButton(label, key, extraClass = "") {
  const active = ui.inventory.sort === key;
  const direction = active ? ui.inventory.dir : "asc";
  return `
    <button class="th-sort ${active ? "is-sorted" : ""} ${direction === "desc" ? "is-desc" : ""}" type="button" data-action="sort-inventory" data-sort="${key}" aria-label="Sort by ${esc(label)}" aria-pressed="${active}">
      ${esc(label)}<svg class="icon" aria-hidden="true"><use href="#i-sort"/></svg>
    </button>`;
}

function inventoryTableMarkup() {
  const products = inventoryFilteredProducts();
  const total = state.products.length;
  if (!products.length) {
    const filtered = inventoryHasFilters();
    return `
      <div class="empty-state">
        <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#${filtered ? "i-search" : "i-box"}"/></svg></div>
        <h3>${filtered ? "No products match these filters" : "Your inventory is empty"}</h3>
        <p>${filtered ? "Try a different search, or clear the filters to see the full catalog." : "Add your first product to start tracking stock and reorder points."}</p>
        <button class="btn ${filtered ? "btn--secondary" : "btn--primary"}" type="button" data-action="${filtered ? "clear-filters" : "add-product"}">
          ${filtered ? "Clear filters" : `<svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>Add product`}
        </button>
      </div>`;
  }
  return `
    <table class="data-table inventory-table">
      <thead>
        <tr>
          <th scope="col">${sortButton("Product", "name")}</th>
          <th scope="col">Category</th>
          <th scope="col">Supplier</th>
          <th scope="col" class="num">${sortButton("Price", "price")}</th>
          <th scope="col">${sortButton("On hand", "stock")}</th>
          <th scope="col">Status</th>
          <th scope="col"><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        ${products.map((product) => {
          const status = statusOf(product);
          const statusInfo = STATUS[status];
          return `
            <tr data-id="${esc(product.id)}">
              <td>
                <div class="product-cell">
                  <span class="tile tile--${categoryClass(product.category)}" aria-hidden="true">${esc(initials(product.name))}</span>
                  <span class="product-cell__text">
                    <span class="product-cell__name">${esc(product.name)}</span>
                    <span class="product-cell__sku">${esc(product.sku)}</span>
                  </span>
                </div>
              </td>
              <td><span class="cat-label">${esc(product.category)}</span></td>
              <td><span class="supplier-label" title="${esc(product.supplier)}">${esc(product.supplier)}</span></td>
              <td class="num"><span class="price-label">${money(product.price, 2)}</span></td>
              <td>
                <div class="stock-cell">
                  <div class="stock-cell__top"><strong>${num(product.stock)}</strong><span>${esc(product.unit)}</span></div>
                  ${railMarkup(product)}
                  <div class="stock-cell__meta">Reorder at ${num(product.reorder)}</div>
                </div>
              </td>
              <td><span class="status ${statusInfo.className}"><i></i>${statusInfo.label}</span></td>
              <td>
                <button class="row-action" type="button" data-action="row-menu" data-id="${esc(product.id)}" aria-label="Actions for ${esc(product.name)}" aria-haspopup="menu" aria-expanded="false">
                  <svg class="icon" aria-hidden="true"><use href="#i-more"/></svg>
                </button>
              </td>
            </tr>`;
        }).join("")}
      </tbody>
    </table>`;
}

function mobileInventoryMarkup(products) {
  return `
    <div class="mobile-product-list">
      ${products.map((product) => {
        const status = statusOf(product);
        const statusInfo = STATUS[status];
        return `
          <article class="m-product" data-id="${esc(product.id)}">
            <div class="m-product__head">
              <span class="tile tile--${categoryClass(product.category)}" aria-hidden="true">${esc(initials(product.name))}</span>
              <span class="m-product__id">
                <strong>${esc(product.name)}</strong>
                <span class="mono">${esc(product.sku)}</span>
              </span>
              <button class="row-action" type="button" data-action="row-menu" data-id="${esc(product.id)}" aria-label="Actions for ${esc(product.name)}" aria-haspopup="menu" aria-expanded="false">
                <svg class="icon" aria-hidden="true"><use href="#i-more"/></svg>
              </button>
            </div>
            <p class="m-product__meta">${esc(product.category)} · ${esc(product.supplier)}</p>
            <div class="m-product__facts">
              <div><span>On hand</span><strong>${num(product.stock)} <em>${esc(product.unit)}</em></strong></div>
              <div><span>Price</span><strong>${money(product.price, 2)}</strong></div>
              <div><span>Status</span><span class="status ${statusInfo.className}"><i></i>${statusInfo.label}</span></div>
            </div>
            ${railMarkup(product)}
            <div class="m-product__foot">
              <span>Reorder at ${num(product.reorder)}</span>
              <button class="text-btn" type="button" data-action="adjust-stock" data-id="${esc(product.id)}">Adjust stock →</button>
            </div>
          </article>`;
      }).join("")}
    </div>`;
}

function renderInventoryTable() {
  const table = document.getElementById("inventory-table");
  const count = document.getElementById("inventory-count");
  const clear = document.getElementById("inventory-clear");
  if (!table) return;
  const products = inventoryFilteredProducts();
  table.innerHTML = inventoryTableMarkup() + (products.length ? mobileInventoryMarkup(products) : "");
  if (count) {
    count.innerHTML = `Showing <b>${products.length}</b> of ${state.products.length} ${plural(state.products.length, "product")}`;
  }
  if (clear) clear.hidden = !inventoryHasFilters();
  document.querySelectorAll(".status-tab").forEach((tab) => {
    const active = tab.dataset.status === ui.inventory.status;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
}

function wireInventory() {
  renderInventoryTable();
  const search = document.getElementById("inventory-search");
  const category = document.getElementById("inventory-category");
  const supplier = document.getElementById("inventory-supplier");
  if (search) {
    search.addEventListener("input", () => {
      ui.inventory.q = search.value;
      renderInventoryTable();
    });
  }
  if (category) {
    category.addEventListener("change", () => {
      ui.inventory.category = category.value;
      renderInventoryTable();
    });
  }
  if (supplier) {
    supplier.addEventListener("change", () => {
      ui.inventory.supplier = supplier.value;
      renderInventoryTable();
    });
  }
}

/* ------------------------------------------------------------------ */
/* Movements                                                          */
/* ------------------------------------------------------------------ */

function movementsFiltered() {
  const query = ui.movements.q.trim().toLowerCase();
  return [...state.movements]
    .filter((movement) => {
      const typeMatch = ui.movements.type === "all" || movement.type === ui.movements.type;
      const queryMatch = !query || [movement.productName, movement.sku, movement.ref, movement.note, movement.user]
        .join(" ").toLowerCase().includes(query);
      return typeMatch && queryMatch;
    })
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

function movementTypeCounts() {
  return {
    all: state.movements.length,
    in: state.movements.filter((movement) => movement.type === "in").length,
    out: state.movements.filter((movement) => movement.type === "out").length,
    adjust: state.movements.filter((movement) => movement.type === "adjust").length
  };
}

function movementsTemplate() {
  const flow = lastSevenDaysFlow();
  const counts = movementTypeCounts();
  const locked = isSectionLocked("movements") || isSectionLocked("inventory");
  const weekCount = state.movements.filter((movement) => new Date(movement.at).getTime() >= Date.now() - 7 * 86400000).length;
  const tabs = [
    { key: "all", label: "All", count: counts.all },
    { key: "in", label: "Received", count: counts.in },
    { key: "out", label: "Dispatched", count: counts.out },
    { key: "adjust", label: "Adjusted", count: counts.adjust }
  ];
  return `
    <div class="view">
      <div class="page-tools">
        <p class="page-tools__note">Every change is time-stamped and tied to a person.</p>
        <div class="page-tools__actions">
          <button class="btn btn--primary" type="button" data-action="log-movement" ${locked ? "disabled title=\"Movements are locked by an administrator.\"" : ""}><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>Log movement</button>
        </div>
      </div>

      <section class="movement-summary" aria-label="Movement summary, last 7 days">
        <div class="movement-summary__cell"><span>Received</span><strong class="positive">+${num(flow.totalIn)}</strong><em>units in</em></div>
        <div class="movement-summary__cell"><span>Dispatched</span><strong>−${num(flow.totalOut)}</strong><em>units out</em></div>
        <div class="movement-summary__cell"><span>Net change</span><strong class="${flow.net > 0 ? "positive" : flow.net < 0 ? "negative" : ""}">${flow.net > 0 ? "+" : flow.net < 0 ? "−" : ""}${num(Math.abs(flow.net))}</strong><em>units</em></div>
        <div class="movement-summary__cell"><span>Movements</span><strong>${weekCount}</strong><em>this week</em></div>
      </section>

      <section class="panel movements-panel" aria-label="Stock movement history">
        <div class="inventory-head">
          <div class="status-tabs" role="group" aria-label="Filter by movement type">
            ${tabs.map((tab) => `
              <button class="status-tab ${ui.movements.type === tab.key ? "is-active" : ""}" type="button" data-action="filter-movements" data-type="${tab.key}" aria-pressed="${ui.movements.type === tab.key}">
                ${tab.label}<span class="status-tab__count">${tab.count}</span>
              </button>`).join("")}
          </div>
          <div class="inventory-toolbar">
            <div class="text-input">
              <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
              <input class="input" id="movements-search" type="search" placeholder="Search product, SKU, or reference" aria-label="Search movements" value="${esc(ui.movements.q)}" autocomplete="off" />
            </div>
          </div>
        </div>
        <div class="table-wrap" id="movements-table"></div>
        <div class="table-foot">
          <span id="movements-count"></span>
          <span class="table-foot__right"><span class="foot-note">Newest first</span></span>
        </div>
      </section>
    </div>`;
}

function movementsTableMarkup() {
  const movements = movementsFiltered();
  if (!movements.length) {
    const filtered = Boolean(ui.movements.q) || ui.movements.type !== "all";
    return `
      <div class="empty-state">
        <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#${filtered ? "i-search" : "i-flow"}"/></svg></div>
        <h3>${filtered ? "No movements match" : "No stock movement yet"}</h3>
        <p>${filtered ? "Try another search or clear the movement type filter." : "Log a receipt, dispatch, or count to begin the audit trail."}</p>
        <button class="btn btn--primary" type="button" data-action="log-movement"><svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>Log movement</button>
      </div>`;
  }
  return `
    <table class="data-table movements-table">
      <thead>
        <tr>
          <th scope="col">When</th>
          <th scope="col">Product</th>
          <th scope="col">Type</th>
          <th scope="col" class="num">Change</th>
          <th scope="col">Reference</th>
          <th scope="col">Logged by</th>
        </tr>
      </thead>
      <tbody>
        ${movements.map((movement) => {
          const qty = Number(movement.qty);
          return `
            <tr data-id="${esc(movement.id)}">
              <td><div class="when-cell"><time datetime="${esc(movement.at)}" title="${esc(formatFullDate(movement.at))}">${esc(relativeWhen(movement.at))}</time><span>${esc(formatDateShort(movement.at))}</span></div></td>
              <td>
                <div class="product-cell">
                  <span class="tile tile--tiny" aria-hidden="true">${esc(initials(movement.productName))}</span>
                  <span class="product-cell__text">
                    <span class="product-cell__name">${esc(movement.productName)}</span>
                    <span class="product-cell__sku">${esc(movement.sku)}</span>
                  </span>
                </div>
              </td>
              <td><span class="type-chip type-chip--${movement.type}"><svg class="icon" aria-hidden="true"><use href="#${movementIcon(movement.type)}"/></svg>${movementLabel(movement.type)}</span></td>
              <td class="num"><span class="change-label ${qtyClass(movement.type)}">${signedQty(qty, movement.type)}<small>${esc(movement.unit)}</small></span></td>
              <td><span class="mono">${esc(movement.ref)}</span></td>
              <td><span class="user-label"><i aria-hidden="true">${esc(initials(movement.user))}</i>${esc(movement.user)}</span></td>
            </tr>`;
        }).join("")}
      </tbody>
    </table>`;
}

function mobileMovementsMarkup(movements) {
  return `
    <div class="mobile-movement-list">
      ${movements.map((movement) => `
        <article class="m-movement">
          <div class="m-movement__head">
            <span class="movement-icon movement-icon--${movement.type}" aria-hidden="true"><svg class="icon"><use href="#${movementIcon(movement.type)}"/></svg></span>
            <span class="m-movement__id">
              <strong>${esc(movement.productName)}</strong>
              <span class="mono">${esc(movement.sku)} · ${esc(movement.ref)}</span>
            </span>
            <span class="m-movement__qty ${qtyClass(movement.type)}">${signedQty(movement.qty, movement.type)}<small>${esc(movement.unit)}</small></span>
          </div>
          <div class="m-movement__foot">
            <span class="type-chip type-chip--${movement.type}"><svg class="icon" aria-hidden="true"><use href="#${movementIcon(movement.type)}"/></svg>${movementLabel(movement.type)}</span>
            <span>${esc(relativeWhen(movement.at))}</span>
            <span class="m-movement__user">${esc(initials(movement.user))} · ${esc(movement.user)}</span>
          </div>
        </article>`).join("")}
    </div>`;
}

function renderMovementsTable() {
  const table = document.getElementById("movements-table");
  const count = document.getElementById("movements-count");
  if (!table) return;
  const movements = movementsFiltered();
  table.innerHTML = movementsTableMarkup() + (movements.length ? mobileMovementsMarkup(movements) : "");
  if (count) count.innerHTML = `Showing <b>${movements.length}</b> of ${state.movements.length} ${plural(state.movements.length, "movement")}`;
  document.querySelectorAll("[data-action='filter-movements']").forEach((tab) => {
    const active = tab.dataset.type === ui.movements.type;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
}

function wireMovements() {
  renderMovementsTable();
  const search = document.getElementById("movements-search");
  if (search) {
    search.addEventListener("input", () => {
      ui.movements.q = search.value;
      renderMovementsTable();
    });
  }
}

/* ------------------------------------------------------------------ */
/* Suppliers                                                          */
/* ------------------------------------------------------------------ */

function suppliersTemplate() {
  const suppliers = supplierBreakdown();
  const stats = getStats();
  const withAlerts = suppliers.filter((supplier) => supplier.low > 0).length;
  const lowestLead = Math.min(...Object.values(SUPPLIER_DIRECTORY).map((supplier) => supplier.lead));
  return `
    <div class="view">
      <div class="page-tools">
        <p class="page-tools__note">Lead times, contacts, and current stock exposure across ${suppliers.length} supply partners.</p>
        <div class="page-tools__actions">
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg>Shortest lead: ${lowestLead} days</span>
        </div>
      </div>

      <div class="supplier-grid">
        ${suppliers.map((supplier) => {
          const directory = SUPPLIER_DIRECTORY[supplier.name] || { contact: "Primary contact", email: "", lead: "—", initials: initials(supplier.name) };
          const lowProducts = supplier.lowItems
            .sort((a, b) => (statusOf(a) === "out" ? -1 : 0) - (statusOf(b) === "out" ? -1 : 0))
            .map((product) => product.name);
          const lowPreview = lowProducts.slice(0, 2).join(", ");
          const more = lowProducts.length > 2 ? ` +${lowProducts.length - 2} more` : "";
          return `
            <article class="supplier-card">
              <header class="supplier-card__head">
                <span class="supplier-mark" aria-hidden="true">${esc(directory.initials)}</span>
                <div class="supplier-card__id">
                  <h3>${esc(supplier.name)}</h3>
                  <p class="supplier-card__contact">${esc(directory.contact)}</p>
                </div>
                <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-clock"/></svg>${esc(directory.lead)}-day lead</span>
              </header>
              <div class="supplier-card__stats">
                <div class="supplier-card__stat"><span>SKUs</span><strong>${supplier.count}</strong></div>
                <div class="supplier-card__stat"><span>On hand</span><strong>${num(supplier.units)}</strong></div>
                <div class="supplier-card__stat"><span>Value</span><strong>${money(supplier.value)}</strong></div>
              </div>
              ${supplier.low ? `
                <div class="supplier-alert supplier-alert--attention">
                  <svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>
                  <span><strong>${supplier.low} ${plural(supplier.low, "item")} below reorder:</strong> ${esc(lowPreview)}${esc(more)}</span>
                </div>` : `
                <div class="supplier-alert supplier-alert--clear">
                  <svg class="icon" aria-hidden="true"><use href="#i-check-circle"/></svg>
                  <span>All stock is above its reorder point.</span>
                </div>`}
              <div class="supplier-card__foot">
                <span class="supplier-contact">${directory.email ? `Orders: <a href="mailto:${esc(directory.email)}">${esc(directory.email)}</a>` : "No email on file"}</span>
                <button class="text-btn" type="button" data-action="view-supplier" data-supplier="${esc(supplier.name)}">View products →</button>
              </div>
            </article>`;
        }).join("")}
      </div>
      ${!suppliers.length ? `<div class="panel"><div class="empty-state"><div class="empty-state__icon"><svg class="icon"><use href="#i-truck"/></svg></div><h3>No suppliers yet</h3><p>Add a product and assign a supplier to see it here.</p><button class="btn btn--primary" type="button" data-action="add-product">Add product</button></div></div>` : ""}
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Centre Master                                                      */
/* ------------------------------------------------------------------ */

function centreFiltered() {
  const query = ui.centres.q.trim().toLowerCase();
  return CENTRES.filter((centre) => {
    const statusMatch = ui.centres.status === "all"
      || (ui.centres.status === "needs" ? centre.status !== "healthy" : centre.status === "healthy");
    const typeMatch = ui.centres.type === "all" || centre.type === ui.centres.type;
    const queryMatch = !query || [centre.name, centre.code, centre.parent || ""]
      .join(" ").toLowerCase().includes(query);
    return statusMatch && typeMatch && queryMatch;
  });
}

function centreTypeClass(type) {
  return String(type || "Centre").toLowerCase();
}

function centreFilterTabsMarkup() {
  const tabs = [
    { key: "all", label: "All Satsang Places", count: CENTRE_STATS.total },
    { key: "needs", label: "Needs stock", count: CENTRE_STATS.withNeeds },
    { key: "ready", label: "Ready", count: CENTRE_STATS.ready }
  ];
  return tabs.map((tab) => `
    <button class="status-tab ${ui.centres.status === tab.key ? "is-active" : ""}" type="button" data-action="filter-centres" data-status="${tab.key}" aria-pressed="${ui.centres.status === tab.key}">
      ${tab.label}<span class="status-tab__count">${tab.count}</span>
    </button>`).join("");
}

function centreCoverageClass(centre) {
  if (centre.status === "critical") return "is-out";
  if (centre.status === "needs") return "is-low";
  return "is-ready";
}

function centreCardMarkup(centre) {
  const health = CENTRE_HEALTH[centre.status];
  const needing = centre.shortCount + centre.missingCount;
  const parent = getCentreParent(centre);
  const children = getCentreChildren(centre);
  const branchNote = parent
    ? `Under ${parent.name}`
    : children.length
      ? `${children.length} ${plural(children.length, "branch", "branches")}`
      : "Standalone centre";
  return `
    <a class="centre-card" href="#/centres/${esc(centre.slug)}">
      <span class="centre-card__head">
        <span class="centre-mark" aria-hidden="true">${esc(initials(centre.name))}</span>
        <span class="centre-card__id">
          <strong>${esc(centre.name)}</strong>
          <span>${centre.lines.length} ${plural(centre.lines.length, "item")} tracked · ${centre.coverage}% covered</span>
          <span class="centre-card__meta">
            <span class="centre-type centre-type--${centreTypeClass(centre.type)}">${esc(centre.type)}</span>
            <span>Badge ${esc(centre.code)} · ${esc(branchNote)}</span>
          </span>
        </span>
        <span class="status ${health.className}"><i></i>${health.label}</span>
      </span>
      <span class="centre-card__stats">
        <span class="centre-card__stat"><span>On hand</span><strong>${num(centre.onHandUnits)}</strong></span>
        <span class="centre-card__stat"><span>Required</span><strong>${num(centre.requiredUnits)}</strong></span>
        <span class="centre-card__stat"><span>Shortfall</span><strong class="${centre.shortfallUnits ? "is-short" : ""}">${centre.shortfallUnits ? `−${num(centre.shortfallUnits)}` : "0"}</strong></span>
      </span>
      <span class="centre-card__bar" aria-hidden="true"><span class="centre-card__fill ${centreCoverageClass(centre)}" style="width:${centre.coverage}%"></span></span>
      <span class="centre-card__foot">
        <span>${needing ? `${needing} ${plural(needing, "item")} ${needing === 1 ? "needs" : "need"} restocking` : "All requirements covered"}</span>
        <span class="centre-card__open">Open Satsang Place <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg></span>
      </span>
    </a>`;
}

function centreMasterMarkup() {
  return `
      <div class="page-tools">
        <p class="page-tools__note">${CENTRE_STATS.centreCount} centres, ${CENTRE_STATS.subCentreCount} sub-centres, and ${CENTRE_STATS.pointCount} points. Open a Satsang Place to see its branches and item requirements.</p>
        <div class="page-tools__actions">
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-centre"/></svg>${CENTRE_STATS.total} unique Satsang Places</span>
        </div>
      </div>

      <section class="centre-summary" aria-label="Satsang Place overview summary">
        <div class="centre-summary__cell"><span>Satsang Places</span><strong>${CENTRE_STATS.total}</strong><em>${CENTRE_STATS.centreCount} centres · ${CENTRE_STATS.subCentreCount} sub-centres · ${CENTRE_STATS.pointCount} points</em></div>
        <div class="centre-summary__cell"><span>Items tracked</span><strong>${num(CENTRE_STATS.trackedItems)}</strong><em>across all Satsang Places</em></div>
        <div class="centre-summary__cell"><span>Need stock</span><strong class="${CENTRE_STATS.withNeeds ? "negative" : "positive"}">${CENTRE_STATS.withNeeds}</strong><em>${CENTRE_STATS.critical} critical</em></div>
        <div class="centre-summary__cell"><span>Units short</span><strong class="${CENTRE_STATS.shortfallUnits ? "negative" : "positive"}">${num(CENTRE_STATS.shortfallUnits)}</strong><em>below requirement</em></div>
      </section>

      <section class="panel centres-panel" aria-label="Satsang Place list">
        <div class="inventory-head">
          <div class="status-tabs" role="group" aria-label="Filter Satsang Places by stock status">
            ${centreFilterTabsMarkup()}
          </div>
          <div class="inventory-toolbar">
            <div class="text-input">
              <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
              <input class="input" id="centre-search" type="search" placeholder="Search Satsang Places, badge codes, or parents" aria-label="Search Satsang Places" value="${esc(ui.centres.q)}" autocomplete="off" />
            </div>
            <div class="select-wrap select-wrap--wide">
              <select id="centre-type-filter" class="input" aria-label="Filter Satsang Places by type">
                <option value="all"${ui.centres.type === "all" ? " selected" : ""}>All Satsang Places (${CENTRE_STATS.total})</option>
                <option value="Centre"${ui.centres.type === "Centre" ? " selected" : ""}>Centres (${CENTRE_STATS.centreCount})</option>
                <option value="SubCentre"${ui.centres.type === "SubCentre" ? " selected" : ""}>Sub-centres (${CENTRE_STATS.subCentreCount})</option>
                <option value="Point"${ui.centres.type === "Point" ? " selected" : ""}>Points (${CENTRE_STATS.pointCount})</option>
              </select>
              <svg class="icon" aria-hidden="true"><use href="#i-chevron-down"/></svg>
            </div>
          </div>
        </div>
        <div class="centres-grid" id="centres-grid"></div>
        <div class="table-foot">
          <span id="centres-count"></span>
          <span class="table-foot__right"><span class="foot-note">Source names and badge codes deduplicated</span></span>
        </div>
      </section>`;
}

const CENTRE_TYPE_LABEL = { Centre: "CENTRE", SubCentre: "SUB CENTRE", Point: "POINT" };

function centreMasterRows() {
  const query = ui.centres.q.trim().toLowerCase();
  const direction = ui.centres.dir === "desc" ? -1 : 1;
  const sort = ui.centres.sort || "name";
  return CENTRES
    .filter((centre) => !query || [centre.name, centre.code, centre.type, centre.parent || "", centre.incharge || "", centre.inchargePhone || "", centre.gmail || ""].join(" ").toLowerCase().includes(query))
    .slice()
    .sort((a, b) => {
      let result;
      if (sort === "type") result = (CENTRE_TYPE_ORDER[a.type] - CENTRE_TYPE_ORDER[b.type]) || a.name.localeCompare(b.name);
      else if (sort === "parent") result = String(a.parent || "").localeCompare(String(b.parent || "")) || a.name.localeCompare(b.name);
      else result = a.name.localeCompare(b.name);
      return result * direction;
    });
}

function centreMasterRowMarkup(centre) {
  return `
    <tr>
      <td>
        <a class="masters-table__name" href="#/centres/${esc(centre.slug)}">${esc(centre.name)}</a>
        ${centre.parent ? `<span class="masters-table__parent-sub">${esc(centre.parent)}</span>` : ""}
        <span class="masters-table__type-sub"><span class="master-type master-type--${centreTypeClass(centre.type)}">${esc(CENTRE_TYPE_LABEL[centre.type] || centre.type)}</span></span>
      </td>
      <td><span class="master-type master-type--${centreTypeClass(centre.type)}">${esc(CENTRE_TYPE_LABEL[centre.type] || centre.type)}</span></td>
      <td class="masters-table__parent">${centre.parent ? esc(centre.parent) : "–"}</td>
      <td class="masters-table__area">${esc(centre.areaName || CENTRE_AREA_NAME)}</td>
      <td class="masters-table__incharge${centre.incharge ? "" : " masters-table__incharge--empty"}">
        <span class="masters-table__incharge-name">${centre.incharge ? esc(centre.incharge) : "–"}</span>
        ${centre.inchargePhone ? `<span class="masters-table__phone-sub">${esc(centre.inchargePhone)}</span>` : ""}
      </td>
      <td class="masters-table__phone${centre.inchargePhone ? "" : " masters-table__phone--empty"}">${centre.inchargePhone ? esc(centre.inchargePhone) : "–"}</td>
      <td class="masters-table__actions">
        <button class="master-row-btn" type="button" data-action="edit-centre" data-centre="${esc(centre.slug)}" aria-label="Edit ${esc(centre.name)}">Edit</button>
        <button class="master-row-btn master-row-btn--danger" type="button" data-action="delete-centre" data-centre="${esc(centre.slug)}" aria-label="Delete ${esc(centre.name)}">
          <svg class="icon" aria-hidden="true"><use href="#i-close"/></svg>
        </button>
      </td>
    </tr>`;
}

function renderCentreMasterRows() {
  const rows = document.getElementById("masters-centre-rows");
  const count = document.getElementById("masters-centre-count");
  if (!rows) return;
  const centres = centreMasterRows();
  rows.innerHTML = centres.length
    ? centres.map(centreMasterRowMarkup).join("")
    : `<tr class="masters-table__empty"><td colspan="7">No centres match this search.</td></tr>`;
  if (count) count.textContent = `${centres.length} of ${CENTRES.length}`;
  document.querySelectorAll("[data-action='sort-centres']").forEach((button) => {
    const active = button.dataset.sort === (ui.centres.sort || "name");
    button.classList.toggle("is-sorted", active);
    button.classList.toggle("is-desc", active && ui.centres.dir === "desc");
    button.closest("th")?.setAttribute("aria-sort", active ? (ui.centres.dir === "desc" ? "descending" : "ascending") : "none");
  });
}

function wireCentreMasterPage() {
  renderCentreMasterRows();
  const search = document.getElementById("centre-search");
  if (search) {
    search.addEventListener("input", () => {
      ui.centres.q = search.value;
      renderCentreMasterRows();
    });
  }
}

function centresTemplate() {
  return `
    <div class="view masters-view">
      <section class="masters-hero" aria-labelledby="masters-hero-title">
        <div class="masters-hero__copy">
          <h1 class="masters-hero__title" id="masters-hero-title">Inventory Masters</h1>
          <p class="masters-hero__sub">Centre master with hierarchy, item catalogue with requirement codes, and document references for GRN and SOI forms.</p>
        </div>
        <div class="masters-hero__actions">
          <button class="btn btn--secondary" type="button" data-action="export-centres">
            <svg class="icon" aria-hidden="true"><use href="#i-download"/></svg>Export<svg class="icon masters-btn__chevron" aria-hidden="true"><use href="#i-chevron-down"/></svg>
          </button>
          <button class="btn btn--primary" type="button" data-action="add-product">
            <svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>Add Item
          </button>
        </div>
      </section>

      <section class="masters-panel" aria-labelledby="masters-centre-title">
        <header class="masters-panel__head">
          <div class="masters-panel__identity">
            <span class="masters-tag" id="masters-centre-title">Centre Master</span>
          </div>
          <div class="masters-panel__actions">
            <span class="masters-count" id="masters-centre-count">${CENTRES.length} of ${CENTRES.length}</span>
            <button class="btn btn--primary btn--compact" type="button" data-action="add-centre">
              <svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>Add Satsang Place
            </button>
          </div>
        </header>
        <div class="masters-search">
          <div class="text-input">
            <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
            <input class="input" id="centre-search" type="search" placeholder="C/SC/SP" aria-label="Search centres" value="${esc(ui.centres.q)}" autocomplete="off" />
          </div>
        </div>
        <div class="masters-table-wrap">
          <table class="masters-table">
            <thead>
              <tr>
                <th scope="col"><button class="masters-sort" type="button" data-action="sort-centres" data-sort="name">Centre <svg class="icon" aria-hidden="true"><use href="#i-sort"/></svg></button></th>
                <th scope="col"><button class="masters-sort" type="button" data-action="sort-centres" data-sort="type">Type <svg class="icon" aria-hidden="true"><use href="#i-sort"/></svg></button></th>
                <th scope="col"><button class="masters-sort" type="button" data-action="sort-centres" data-sort="parent">Parent Centre <svg class="icon" aria-hidden="true"><use href="#i-sort"/></svg></button></th>
                <th scope="col" class="masters-table__area-col">Area Name</th>
                <th scope="col" class="masters-table__incharge-col">Incharge Name</th>
                <th scope="col" class="masters-table__phone-col">Ph No.</th>
                <th scope="col" class="masters-table__actions"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody id="masters-centre-rows"></tbody>
          </table>
        </div>
      </section>
    </div>`;
}

function renderCentresGrid() {
  const grid = document.getElementById("centres-grid");
  const count = document.getElementById("centres-count");
  if (!grid) return;
  const centres = centreFiltered();
  if (!centres.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#i-centre"/></svg></div>
        <h3>No Satsang Places match this view</h3>
        <p>Try a different search, or show every Satsang Place in the master list.</p>
        <button class="btn btn--secondary" type="button" data-action="clear-centre-filters">Show all Satsang Places</button>
      </div>`;
  } else {
    grid.innerHTML = centres.map(centreCardMarkup).join("");
  }
  if (count) count.innerHTML = `Showing <b>${centres.length}</b> of ${CENTRES.length} Satsang Places`;
  document.querySelectorAll("[data-action='filter-centres']").forEach((tab) => {
    const active = tab.dataset.status === ui.centres.status;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
}

function wireCentres() {
  renderCentresGrid();
  const search = document.getElementById("centre-search");
  if (search) {
    search.addEventListener("input", () => {
      ui.centres.q = search.value;
      renderCentresGrid();
    });
  }
  const type = document.getElementById("centre-type-filter");
  if (type) {
    type.addEventListener("change", () => {
      ui.centres.type = type.value;
      renderCentresGrid();
    });
  }
}

function sortedCentreLines(centre) {
  const rank = { missing: 0, short: 1, covered: 2 };
  return centre.lines.slice().sort((a, b) => (
    rank[a.status] - rank[b.status]
    || b.shortfall - a.shortfall
    || a.name.localeCompare(b.name)
  ));
}

function centreItemsTableMarkup(centre, lines) {
  return `
    <div class="table-wrap">
      <table class="data-table centre-items-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Category</th>
            <th scope="col" class="num">On hand</th>
            <th scope="col" class="num">Required</th>
            <th scope="col" class="num">Shortfall</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map((line) => {
            const status = CENTRE_LINE_STATUS[line.status];
            return `
              <tr>
                <td>
                  <div class="product-cell">
                    <span class="tile tile--${categoryClass(line.category)}" aria-hidden="true">${esc(initials(line.name))}</span>
                    <span class="product-cell__text">
                      <a class="item-link" href="#/items/${esc(line.slug)}">${esc(line.name)}</a>
                      <span class="product-cell__sku">${esc(line.sku)}</span>
                    </span>
                  </div>
                </td>
                <td><span class="cat-label">${esc(line.category)}</span></td>
                <td class="num"><span class="centre-qty">${num(line.onHand)}</span> <span class="centre-unit">${esc(line.unit)}</span></td>
                <td class="num"><span class="centre-qty">${num(line.required)}</span> <span class="centre-unit">${esc(line.unit)}</span></td>
                <td class="num"><span class="shortfall ${line.shortfall ? "is-short" : ""}">${line.shortfall ? `−${num(line.shortfall)}` : "—"}</span></td>
                <td><span class="status ${status.className}"><i></i>${status.label}</span></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function centreItemCardsMarkup(centre, lines) {
  return `
    <div class="centre-item-cards">
      ${lines.map((line) => {
        const status = CENTRE_LINE_STATUS[line.status];
        return `
          <article class="c-item">
            <div class="c-item__head">
              <span class="tile tile--tiny tile--${categoryClass(line.category)}" aria-hidden="true">${esc(initials(line.name))}</span>
              <span class="c-item__id">
                <a class="item-link item-link--strong" href="#/items/${esc(line.slug)}">${esc(line.name)}</a>
                <span>${esc(line.sku)} · ${esc(line.category)}</span>
              </span>
              <span class="status ${status.className}"><i></i>${status.label}</span>
            </div>
            <div class="c-item__facts">
              <div><span>On hand</span><strong>${num(line.onHand)} <em>${esc(line.unit)}</em></strong></div>
              <div><span>Required</span><strong>${num(line.required)} <em>${esc(line.unit)}</em></strong></div>
              <div><span>Shortfall</span><strong class="${line.shortfall ? "is-short" : ""}">${line.shortfall ? `−${num(line.shortfall)}` : "0"}</strong></div>
            </div>
          </article>`;
      }).join("")}
    </div>`;
}

function centreChildRowMarkup(child) {
  const health = CENTRE_HEALTH[child.status];
  const needing = child.shortCount + child.missingCount;
  return `
    <a class="centre-child" href="#/centres/${esc(child.slug)}">
      <span class="centre-type centre-type--${centreTypeClass(child.type)}">${esc(child.type)}</span>
      <span class="centre-child__id">
        <strong>${esc(child.name)}</strong>
        <span>Badge ${esc(child.code)} · ${child.lines.length} items · ${needing ? `${needing} need restocking` : "all covered"}</span>
      </span>
      <span class="centre-child__shortfall ${child.shortfallUnits ? "is-short" : "is-clear"}">${child.shortfallUnits ? `−${num(child.shortfallUnits)}` : "0"}<em>short</em></span>
      <span class="status ${health.className}"><i></i>${health.label}</span>
      <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>
    </a>`;
}

function centreChildrenPanelMarkup(centre) {
  const children = getCentreChildren(centre);
  if (!children.length) return "";
  const subCentres = children.filter((child) => child.type === "SubCentre").length;
  const points = children.filter((child) => child.type === "Point").length;
  const breakdown = [
    subCentres ? `${subCentres} ${plural(subCentres, "sub-centre")}` : "",
    points ? `${points} ${plural(points, "point")}` : ""
  ].filter(Boolean).join(" · ");
  return `
    <section class="panel centre-children-panel" aria-labelledby="centre-children-title">
      <header class="panel__head">
        <div>
          <h2 class="panel__title" id="centre-children-title">Sub-centres &amp; points</h2>
          <p class="panel__sub">${children.length} ${plural(children.length, "location")} report under ${esc(centre.name)}. Open one to see its item requirements.</p>
        </div>
        <span class="lead-chip">${breakdown}</span>
      </header>
      <div class="centre-child-list">
        ${children.map(centreChildRowMarkup).join("")}
      </div>
    </section>`;
}

function centreDetailTemplate() {
  const centre = currentCentre();
  if (!centre) {
    return `
      <div class="view">
        <div class="centre-detail-bar">
          <a class="back-link" href="#/centres">← All locations</a>
        </div>
        <section class="panel">
          <div class="empty-state">
            <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#i-centre"/></svg></div>
            <h3>Centre not found</h3>
            <p>The centre in this link is not part of the master list. Open Centre Master to choose a centre.</p>
            <a class="btn btn--primary" href="#/centres">Back to Centre Master</a>
          </div>
        </section>
      </div>`;
  }

  const health = CENTRE_HEALTH[centre.status];
  const lines = sortedCentreLines(centre);
  const needing = centre.shortCount + centre.missingCount;
  const parent = getCentreParent(centre);
  return `
    <div class="view">
      <div class="centre-detail-bar">
        <a class="back-link" href="#/centres">← All locations</a>
        <div class="centre-detail-bar__right">
          ${parent ? `<a class="lead-chip" href="#/centres/${esc(parent.slug)}"><svg class="icon" aria-hidden="true"><use href="#i-centre"/></svg>Up: ${esc(parent.name)}</a>` : ""}
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-centre"/></svg>Centre Master</span>
        </div>
      </div>

      <section class="centre-hero" aria-labelledby="centre-name">
        <header class="centre-hero__head">
          <span class="centre-mark centre-mark--lg" aria-hidden="true">${esc(initials(centre.name))}</span>
          <div class="centre-hero__id">
            <p class="centre-hero__kicker">Centre Master</p>
            <h2 id="centre-name">${esc(centre.name)}</h2>
            <p>${parent ? `Under <a class="inline-link" href="#/centres/${esc(parent.slug)}">${esc(parent.name)}</a> · ` : ""}Badge ${esc(centre.code)} · ${centre.lines.length} ${plural(centre.lines.length, "item")} tracked · ${centre.coverage}% of item lines covered</p>
          </div>
          <div class="centre-hero__badges">
            <span class="centre-type centre-type--${centreTypeClass(centre.type)}">${esc(centre.type)}</span>
            <span class="status ${health.className}"><i></i>${health.label}</span>
          </div>
        </header>
        <div class="centre-hero__stats">
          <div class="centre-hero__stat"><span>Items tracked</span><strong>${centre.lines.length}</strong><em>${needing} ${plural(needing, "line")} need restocking</em></div>
          <div class="centre-hero__stat"><span>Units on hand</span><strong>${num(centre.onHandUnits)}</strong><em>Across all item lines</em></div>
          <div class="centre-hero__stat"><span>Units required</span><strong>${num(centre.requiredUnits)}</strong><em>Target holding</em></div>
          <div class="centre-hero__stat centre-hero__stat--alert"><span>Shortfall</span><strong class="${centre.shortfallUnits ? "is-short" : ""}">${centre.shortfallUnits ? `−${num(centre.shortfallUnits)}` : "0"}</strong><em>${centre.missingCount} missing · ${centre.shortCount} short</em></div>
        </div>
      </section>

      ${centreChildrenPanelMarkup(centre)}

      <section class="panel centre-items-panel" aria-labelledby="centre-items-title">
        <header class="panel__head">
          <div>
            <h2 class="panel__title" id="centre-items-title">Items held and required</h2>
            <p class="panel__sub">On-hand stock compared with this location's requirement. The most urgent lines are first.</p>
          </div>
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>${centre.coveredCount}/${lines.length} covered</span>
        </header>
        ${centreItemsTableMarkup(centre, lines)}
        ${centreItemCardsMarkup(centre, lines)}
        <div class="table-foot">
          <span><b>${lines.length}</b> ${plural(lines.length, "item")} · ${needing} ${plural(needing, "line")} need restocking</span>
          <span class="table-foot__right"><span class="foot-note">Requirement = location target holding</span></span>
        </div>
      </section>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Departments                                                        */
/* ------------------------------------------------------------------ */

function departmentFiltered() {
  const query = ui.departments.q.trim().toLowerCase();
  return DEPARTMENTS.filter((dept) => {
    const statusMatch = ui.departments.status === "all"
      || (ui.departments.status === "needs" ? dept.status !== "healthy" : dept.status === "healthy");
    const queryMatch = !query || [dept.name, dept.description, ...dept.items.flatMap((item) => [item.name, item.sku, item.category])]
      .join(" ").toLowerCase().includes(query);
    return statusMatch && queryMatch;
  });
}

function departmentFilterTabsMarkup() {
  const tabs = [
    { key: "all", label: "All departments", count: DEPARTMENT_STATS.total },
    { key: "needs", label: "Needs stock", count: DEPARTMENT_STATS.withNeeds },
    { key: "ready", label: "Covered", count: DEPARTMENT_STATS.ready }
  ];
  return tabs.map((tab) => `
    <button class="status-tab ${ui.departments.status === tab.key ? "is-active" : ""}" type="button" data-action="filter-departments" data-status="${tab.key}" aria-pressed="${ui.departments.status === tab.key}">
      ${tab.label}<span class="status-tab__count">${tab.count}</span>
    </button>`).join("");
}

function departmentCoverageClass(dept) {
  if (dept.status === "critical") return "is-out";
  if (dept.status === "needs") return "is-low";
  return "is-ready";
}

function departmentCardMarkup(dept) {
  const health = CENTRE_HEALTH[dept.status];
  const needing = dept.shortCount + dept.missingCount;
  return `
    <a class="centre-card dept-card" href="#/departments/${esc(dept.slug)}">
      <span class="centre-card__head">
        <span class="centre-mark dept-mark dept-mark--${esc(dept.id)}" aria-hidden="true">${esc(initials(dept.name))}</span>
        <span class="centre-card__id">
          <strong>${esc(dept.name)}</strong>
          <span>${esc(dept.description)}</span>
          <span class="centre-card__meta">
            <span class="centre-type centre-type--department">Department</span>
            <span>${dept.itemCount} ${plural(dept.itemCount, "item")} · ${dept.lines.length} requirement lines</span>
          </span>
        </span>
        <span class="status ${health.className}"><i></i>${health.label}</span>
      </span>
      <span class="dept-card__items" aria-label="Items in ${esc(dept.name)}">
        ${dept.items.map((item) => `<span class="dept-item-chip">${esc(item.name)}</span>`).join("")}
      </span>
      <span class="centre-card__stats">
        <span class="centre-card__stat"><span>On hand</span><strong>${num(dept.onHandUnits)}</strong></span>
        <span class="centre-card__stat"><span>Required</span><strong>${num(dept.requiredUnits)}</strong></span>
        <span class="centre-card__stat"><span>Shortfall</span><strong class="${dept.shortfallUnits ? "is-short" : ""}">${dept.shortfallUnits ? `−${num(dept.shortfallUnits)}` : "0"}</strong></span>
      </span>
      <span class="centre-card__bar" aria-hidden="true"><span class="centre-card__fill ${departmentCoverageClass(dept)}" style="width:${dept.coverage}%"></span></span>
      <span class="centre-card__foot">
        <span>${needing ? `${needing} of ${dept.lines.length} item lines need stock` : "All department requirements covered"}</span>
        <span class="centre-card__open">Open department <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg></span>
      </span>
    </a>`;
}

function departmentsTemplate() {
  return `
    <div class="view">
      <div class="page-tools">
        <p class="page-tools__note">Departments group the shared catalogue by how stock is used. Open one to see its items, stock cover, and locations that need restocking.</p>
        <div class="page-tools__actions">
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-departments"/></svg>${DEPARTMENT_STATS.total} departments · ${DEPARTMENT_STATS.items} items</span>
        </div>
      </div>

      <section class="centre-summary department-summary" aria-label="Department summary">
        <div class="centre-summary__cell"><span>Departments</span><strong>${DEPARTMENT_STATS.total}</strong><em>grouped by use</em></div>
        <div class="centre-summary__cell"><span>Item assignments</span><strong>${DEPARTMENT_STATS.assignments}</strong><em>${DEPARTMENT_STATS.items} unique items</em></div>
        <div class="centre-summary__cell"><span>Need stock</span><strong class="${DEPARTMENT_STATS.withNeeds ? "negative" : "positive"}">${DEPARTMENT_STATS.withNeeds}</strong><em>${DEPARTMENT_STATS.critical} critical</em></div>
        <div class="centre-summary__cell"><span>Units short</span><strong class="${DEPARTMENT_STATS.shortfallUnits ? "negative" : "positive"}">${num(DEPARTMENT_STATS.shortfallUnits)}</strong><em>across assignments</em></div>
      </section>

      <section class="panel departments-panel" aria-label="Department list">
        <div class="inventory-head">
          <div class="status-tabs" role="group" aria-label="Filter departments by stock status">
            ${departmentFilterTabsMarkup()}
          </div>
          <div class="inventory-toolbar">
            <div class="text-input">
              <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
              <input class="input" id="department-search" type="search" placeholder="Search departments or items" aria-label="Search departments" value="${esc(ui.departments.q)}" autocomplete="off" />
            </div>
          </div>
        </div>
        <div class="centres-grid departments-grid" id="departments-grid"></div>
        <div class="table-foot">
          <span id="departments-count"></span>
          <span class="table-foot__right"><span class="foot-note">Items can belong to more than one department</span></span>
        </div>
      </section>
    </div>`;
}

function renderDepartmentsGrid() {
  const grid = document.getElementById("departments-grid");
  const count = document.getElementById("departments-count");
  if (!grid) return;
  const departments = departmentFiltered();
  if (!departments.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#i-departments"/></svg></div>
        <h3>No departments match this view</h3>
        <p>Try a different search, or show every department in the master list.</p>
        <button class="btn btn--secondary" type="button" data-action="clear-department-filters">Show all departments</button>
      </div>`;
  } else {
    grid.innerHTML = departments.map(departmentCardMarkup).join("");
  }
  if (count) count.innerHTML = `Showing <b>${departments.length}</b> of ${DEPARTMENTS.length} departments`;
  document.querySelectorAll("[data-action='filter-departments']").forEach((tab) => {
    const active = tab.dataset.status === ui.departments.status;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
}

function wireDepartments() {
  renderDepartmentsGrid();
  const search = document.getElementById("department-search");
  if (search) {
    search.addEventListener("input", () => {
      ui.departments.q = search.value;
      renderDepartmentsGrid();
    });
  }
}

function sortedDepartmentItems(dept) {
  const rank = { critical: 0, needs: 1, healthy: 2 };
  return dept.items.slice().sort((a, b) => (
    rank[a.status] - rank[b.status]
    || b.shortfallUnits - a.shortfallUnits
    || a.name.localeCompare(b.name)
  ));
}

function departmentItemsTableMarkup(items) {
  return `
    <div class="table-wrap">
      <table class="data-table dept-items-table">
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Category</th>
            <th scope="col" class="num">Locations short</th>
            <th scope="col" class="num">On hand</th>
            <th scope="col" class="num">Required</th>
            <th scope="col" class="num">Shortfall</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => {
            const health = ITEM_HEALTH[item.status];
            return `
              <tr>
                <td>
                  <div class="product-cell">
                    <span class="tile tile--${categoryClass(item.category)}" aria-hidden="true">${esc(initials(item.name))}</span>
                    <span class="product-cell__text">
                      <a class="item-link" href="#/items/${esc(item.slug)}">${esc(item.name)}</a>
                      <span class="product-cell__sku">${esc(item.sku)}</span>
                    </span>
                  </div>
                </td>
                <td><span class="cat-label">${esc(item.category)}</span></td>
                <td class="num"><span class="centre-qty">${item.shortCentreCount}</span> <span class="centre-unit">of ${item.lines.length}</span></td>
                <td class="num"><span class="centre-qty">${num(item.onHandUnits)}</span> <span class="centre-unit">${esc(item.unit)}</span></td>
                <td class="num"><span class="centre-qty">${num(item.requiredUnits)}</span> <span class="centre-unit">${esc(item.unit)}</span></td>
                <td class="num"><span class="shortfall ${item.shortfallUnits ? "is-short" : ""}">${item.shortfallUnits ? `−${num(item.shortfallUnits)}` : "—"}</span></td>
                <td><span class="status ${health.className}"><i></i>${health.label}</span></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function departmentItemCardsMarkup(items) {
  return `
    <div class="centre-item-cards dept-item-cards">
      ${items.map((item) => {
        const health = ITEM_HEALTH[item.status];
        return `
          <article class="c-item">
            <div class="c-item__head">
              <span class="tile tile--tiny tile--${categoryClass(item.category)}" aria-hidden="true">${esc(initials(item.name))}</span>
              <span class="c-item__id">
                <a class="item-link item-link--strong" href="#/items/${esc(item.slug)}">${esc(item.name)}</a>
                <span>${esc(item.sku)} · ${item.shortCentreCount} of ${item.lines.length} locations short</span>
              </span>
              <span class="status ${health.className}"><i></i>${health.label}</span>
            </div>
            <div class="c-item__facts">
              <div><span>On hand</span><strong>${num(item.onHandUnits)} <em>${esc(item.unit)}</em></strong></div>
              <div><span>Required</span><strong>${num(item.requiredUnits)} <em>${esc(item.unit)}</em></strong></div>
              <div><span>Shortfall</span><strong class="${item.shortfallUnits ? "is-short" : ""}">${item.shortfallUnits ? `−${num(item.shortfallUnits)}` : "0"}</strong></div>
            </div>
          </article>`;
      }).join("")}
    </div>`;
}

function departmentLocationRowMarkup(location) {
  const healthKey = location.status === "covered" ? "healthy" : location.status === "missing" ? "critical" : "needs";
  const health = CENTRE_HEALTH[healthKey];
  return `
    <a class="centre-child dept-location" href="#/centres/${esc(location.centreSlug)}">
      <span class="centre-type centre-type--${centreTypeClass(location.centreType)}">${esc(location.centreType)}</span>
      <span class="centre-child__id">
        <strong>${esc(location.centreName)}</strong>
        <span>Badge ${esc(location.centreCode)} · ${location.coveredCount}/${location.lineCount} items covered</span>
      </span>
      <span class="centre-child__shortfall is-short">−${num(location.shortfall)}<em>short</em></span>
      <span class="status ${health.className}"><i></i>${health.label}</span>
      <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>
    </a>`;
}

function departmentDetailTemplate() {
  const dept = currentDepartment();
  if (!dept) {
    return `
      <div class="view">
        <div class="centre-detail-bar">
          <a class="back-link" href="#/departments">← All departments</a>
        </div>
        <section class="panel">
          <div class="empty-state">
            <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#i-departments"/></svg></div>
            <h3>Department not found</h3>
            <p>The department in this link is not part of the master list. Open Departments to choose one.</p>
            <a class="btn btn--primary" href="#/departments">Back to Departments</a>
          </div>
        </section>
      </div>`;
  }

  const health = CENTRE_HEALTH[dept.status];
  const items = sortedDepartmentItems(dept);
  const needing = dept.shortCount + dept.missingCount;
  const locations = dept.locations.filter((location) => location.shortfall > 0);
  return `
    <div class="view">
      <div class="centre-detail-bar">
        <a class="back-link" href="#/departments">← All departments</a>
        <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-departments"/></svg>Department view</span>
      </div>

      <section class="centre-hero dept-hero" aria-labelledby="department-name">
        <header class="centre-hero__head">
          <span class="centre-mark centre-mark--lg dept-mark dept-mark--${esc(dept.id)}" aria-hidden="true">${esc(initials(dept.name))}</span>
          <div class="centre-hero__id">
            <h2 id="department-name">${esc(dept.name)}</h2>
            <p>${esc(dept.description)}</p>
            <p class="dept-hero__meta">${dept.itemCount} ${plural(dept.itemCount, "item")} · ${dept.lines.length} requirement lines · ${dept.coverage}% covered</p>
          </div>
          <div class="centre-hero__badges">
            <span class="centre-type centre-type--department">Department</span>
            <span class="status ${health.className}"><i></i>${health.label}</span>
          </div>
        </header>
        <div class="centre-hero__stats">
          <div class="centre-hero__stat"><span>Items assigned</span><strong>${dept.itemCount}</strong><em>${dept.withNeeds} need stock</em></div>
          <div class="centre-hero__stat"><span>Units on hand</span><strong>${num(dept.onHandUnits)}</strong><em>Across assigned items</em></div>
          <div class="centre-hero__stat"><span>Units required</span><strong>${num(dept.requiredUnits)}</strong><em>Combined location target</em></div>
          <div class="centre-hero__stat centre-hero__stat--alert"><span>Shortfall</span><strong class="${dept.shortfallUnits ? "is-short" : ""}">${dept.shortfallUnits ? `−${num(dept.shortfallUnits)}` : "0"}</strong><em>${dept.missingCount} missing · ${dept.shortCount} short</em></div>
        </div>
      </section>

      <section class="panel dept-items-panel" aria-labelledby="dept-items-title">
        <header class="panel__head">
          <div>
            <h2 class="panel__title" id="dept-items-title">Items in this department</h2>
            <p class="panel__sub">On-hand stock and location coverage for each assigned catalogue item.</p>
          </div>
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>${dept.itemCount - dept.withNeeds}/${dept.itemCount} covered</span>
        </header>
        ${departmentItemsTableMarkup(items)}
        ${departmentItemCardsMarkup(items)}
        <div class="table-foot">
          <span><b>${dept.itemCount}</b> ${plural(dept.itemCount, "item")} · ${needing} of ${dept.lines.length} item lines need stock</span>
          <span class="table-foot__right"><span class="foot-note">Totals span all ${CENTRES.length} locations</span></span>
        </div>
      </section>

      <section class="panel dept-locations-panel" aria-labelledby="dept-locations-title">
        <header class="panel__head">
          <div>
            <h2 class="panel__title" id="dept-locations-title">Locations needing stock</h2>
            <p class="panel__sub">${locations.length ? `${locations.length} of ${dept.locations.length} locations have a shortfall in this department.` : "Every location meets the department requirement."}</p>
          </div>
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>${locations.length} short</span>
        </header>
        ${locations.length ? `<div class="centre-child-list">${locations.map(departmentLocationRowMarkup).join("")}</div>` : `
          <div class="empty-state dept-empty">
            <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#i-check-circle"/></svg></div>
            <h3>All locations covered</h3>
            <p>No centre, sub-centre, or point is short in this department.</p>
          </div>`}
      </section>
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Item Master                                                        */
/* ------------------------------------------------------------------ */

function itemFiltered() {
  const query = ui.items.q.trim().toLowerCase();
  return ITEMS.filter((item) => {
    const statusMatch = ui.items.status === "all"
      || (ui.items.status === "needs" ? item.status !== "healthy" : item.status === "healthy");
    const queryMatch = !query || [item.name, item.sku, item.category]
      .join(" ").toLowerCase().includes(query);
    return statusMatch && queryMatch;
  });
}

function itemFilterTabsMarkup() {
  const tabs = [
    { key: "all", label: "All items", count: ITEM_STATS.total },
    { key: "needs", label: "Needs stock", count: ITEM_STATS.withNeeds },
    { key: "ready", label: "Covered", count: ITEM_STATS.ready }
  ];
  return tabs.map((tab) => `
    <button class="status-tab ${ui.items.status === tab.key ? "is-active" : ""}" type="button" data-action="filter-items" data-status="${tab.key}" aria-pressed="${ui.items.status === tab.key}">
      ${tab.label}<span class="status-tab__count">${tab.count}</span>
    </button>`).join("");
}

function itemCoverageClass(item) {
  if (item.status === "critical") return "is-out";
  if (item.status === "needs") return "is-low";
  return "is-ready";
}

function itemCardMarkup(item) {
  const health = ITEM_HEALTH[item.status];
  return `
    <a class="item-card" href="#/items/${esc(item.slug)}">
      <span class="item-card__head">
        <span class="tile tile--${categoryClass(item.category)}" aria-hidden="true">${esc(initials(item.name))}</span>
        <span class="item-card__id">
          <strong>${esc(item.name)}</strong>
          <span>${esc(item.sku)} · ${esc(item.category)}</span>
        </span>
        <span class="status ${health.className}"><i></i>${health.label}</span>
      </span>
      <span class="item-card__stats">
        <span class="item-card__stat"><span>Unit cost</span><strong>${money(item.cost, 2)}</strong></span>
        <span class="item-card__stat"><span>Required</span><strong>${num(item.requiredUnits)}</strong></span>
        <span class="item-card__stat"><span>Locations short</span><strong class="${item.shortCentreCount ? "is-short" : ""}">${item.shortCentreCount}</strong></span>
      </span>
      <span class="item-card__bar" aria-hidden="true"><span class="item-card__fill ${itemCoverageClass(item)}" style="width:${item.coverage}%"></span></span>
      <span class="item-card__foot">
        <span>${item.shortCentreCount ? `${item.shortCentreCount} of ${item.lines.length} locations need stock` : "Every location requirement covered"}</span>
        <span class="item-card__open">Open item <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg></span>
      </span>
    </a>`;
}

function itemsTemplate() {
  return `
    <div class="view">
      <div class="page-tools">
        <p class="page-tools__note">One row per catalogue item. Open an item to see its cost and requirement in every centre, sub-centre, and point.</p>
        <div class="page-tools__actions">
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-items"/></svg>${ITEM_STATS.total} catalogue items</span>
        </div>
      </div>

      <section class="item-summary" aria-label="Item master summary">
        <div class="item-summary__cell"><span>Items</span><strong>${ITEM_STATS.total}</strong><em>shared catalogue</em></div>
        <div class="item-summary__cell"><span>Locations</span><strong>${ITEM_STATS.centres}</strong><em>requirements tracked</em></div>
        <div class="item-summary__cell"><span>Need stock</span><strong class="${ITEM_STATS.withNeeds ? "negative" : "positive"}">${ITEM_STATS.withNeeds}</strong><em>${ITEM_STATS.critical} critical</em></div>
        <div class="item-summary__cell"><span>Units short</span><strong class="${ITEM_STATS.shortfallUnits ? "negative" : "positive"}">${num(ITEM_STATS.shortfallUnits)}</strong><em>below requirement</em></div>
      </section>

      <section class="panel items-panel" aria-label="Item master list">
        <div class="inventory-head">
          <div class="status-tabs" role="group" aria-label="Filter items by stock status">
            ${itemFilterTabsMarkup()}
          </div>
          <div class="inventory-toolbar">
            <div class="text-input">
              <svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>
              <input class="input" id="item-search" type="search" placeholder="Search items, SKU, or category" aria-label="Search items" value="${esc(ui.items.q)}" autocomplete="off" />
            </div>
          </div>
        </div>
        <div class="items-grid" id="items-grid"></div>
        <div class="table-foot">
          <span id="items-count"></span>
          <span class="table-foot__right"><span class="foot-note">Quantities shown across locations</span></span>
        </div>
      </section>
    </div>`;
}

function renderItemsGrid() {
  const grid = document.getElementById("items-grid");
  const count = document.getElementById("items-count");
  if (!grid) return;
  const items = itemFiltered();
  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#i-items"/></svg></div>
        <h3>No items match this view</h3>
        <p>Try a different search, or show every item in the catalogue.</p>
        <button class="btn btn--secondary" type="button" data-action="clear-item-filters">Show all items</button>
      </div>`;
  } else {
    grid.innerHTML = items.map(itemCardMarkup).join("");
  }
  if (count) count.innerHTML = `Showing <b>${items.length}</b> of ${ITEMS.length} ${plural(ITEMS.length, "item")}`;
  document.querySelectorAll("[data-action='filter-items']").forEach((tab) => {
    const active = tab.dataset.status === ui.items.status;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
}

function wireItems() {
  renderItemsGrid();
  const search = document.getElementById("item-search");
  if (search) {
    search.addEventListener("input", () => {
      ui.items.q = search.value;
      renderItemsGrid();
    });
  }
}

/* ------------------------------------------------------------------ */
/* Document Master                                                    */
/* ------------------------------------------------------------------ */

function documentCardMarkup(document, index) {
  return `
    <a class="doc-card" href="${esc(referenceDocumentHref(document))}" target="_blank" rel="noreferrer">
      <span class="doc-card__top">
        <span class="doc-card__badge" aria-hidden="true">PDF</span>
        <span class="doc-card__index" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
      </span>
      <span class="doc-card__title">${esc(document.title)}</span>
      <span class="doc-card__desc">${esc(document.description)}</span>
      <span class="doc-card__foot">
        <span>${esc(document.category)} · ${document.pages} ${plural(document.pages, "page")}</span>
        <span class="doc-card__open">Open PDF <svg class="icon" aria-hidden="true"><use href="#i-arrow-up-right"/></svg></span>
      </span>
    </a>`;
}

function documentsTemplate() {
  const categories = new Set(REFERENCE_DOCUMENTS.map((document) => document.category)).size;
  const pages = REFERENCE_DOCUMENTS.reduce((total, document) => total + document.pages, 0);

  return `
    <div class="view">
      <div class="page-tools">
        <p class="page-tools__note">Signed-in users can open every reference PDF. The document master is a read-only library and is capped at ${MAX_REFERENCE_DOCUMENTS} documents.</p>
        <div class="page-tools__actions">
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-document"/></svg>${REFERENCE_DOCUMENTS.length} of ${MAX_REFERENCE_DOCUMENTS} reference PDFs</span>
        </div>
      </div>

      <section class="doc-summary" aria-label="Document master summary">
        <div class="doc-summary__cell"><span>Reference PDFs</span><strong>${REFERENCE_DOCUMENTS.length}</strong><em>limit ${MAX_REFERENCE_DOCUMENTS} documents</em></div>
        <div class="doc-summary__cell"><span>Categories</span><strong>${categories}</strong><em>guides, procedures, references</em></div>
        <div class="doc-summary__cell"><span>Pages</span><strong>${pages}</strong><em>across the library</em></div>
        <div class="doc-summary__cell"><span>Format</span><strong>PDF</strong><em>opens in a new tab</em></div>
      </section>

      <section class="panel docs-panel" aria-label="Document master list">
        <header class="panel__head">
          <div>
            <h2 class="panel__title">Reference library</h2>
            <p class="panel__sub">Guides and quick references for receiving, dispatching, counting, and master data. Only the six listed PDFs are part of this library.</p>
          </div>
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-lock"/></svg>Read-only</span>
        </header>
        ${REFERENCE_DOCUMENTS.length ? `
          <div class="doc-grid">${REFERENCE_DOCUMENTS.map(documentCardMarkup).join("")}</div>
        ` : `
          <div class="empty-state">
            <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#i-document"/></svg></div>
            <h3>No reference documents yet</h3>
            <p>Add the reference PDFs to the library, then publish this section.</p>
          </div>
        `}
        <div class="table-foot">
          <span>Showing <b>${REFERENCE_DOCUMENTS.length}</b> of ${MAX_REFERENCE_DOCUMENTS} reference PDFs</span>
          <span class="table-foot__right"><span class="foot-note">Reference PDFs open in a new tab</span></span>
        </div>
      </section>
    </div>`;
}

function sortedItemLines(item) {
  const rank = { missing: 0, short: 1, covered: 2 };
  return item.lines.slice().sort((a, b) => (
    rank[a.status] - rank[b.status]
    || b.shortfall - a.shortfall
    || a.centreName.localeCompare(b.centreName)
  ));
}

function itemCentreTableMarkup(item, lines) {
  return `
    <div class="table-wrap">
      <table class="data-table item-centre-table">
        <thead>
          <tr>
            <th scope="col">Location</th>
            <th scope="col" class="num">Required</th>
            <th scope="col" class="num">On hand</th>
            <th scope="col" class="num">Shortfall</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map((line) => {
            const status = CENTRE_LINE_STATUS[line.status];
            return `
              <tr>
                <td>
                  <div class="product-cell">
                    <span class="tile tile--tiny tile--storage" aria-hidden="true">${esc(initials(line.centreName))}</span>
                    <span class="product-cell__text">
                      <a class="name-link" href="#/centres/${esc(line.centreSlug)}">${esc(line.centreName)}</a>
                      <span class="product-cell__sku">${esc(line.centreType)} · Badge ${esc(line.centreCode)}</span>
                    </span>
                  </div>
                </td>
                <td class="num"><span class="centre-qty">${num(line.required)}</span> <span class="centre-unit">${esc(item.unit)}</span></td>
                <td class="num"><span class="centre-qty">${num(line.onHand)}</span> <span class="centre-unit">${esc(item.unit)}</span></td>
                <td class="num"><span class="shortfall ${line.shortfall ? "is-short" : ""}">${line.shortfall ? `−${num(line.shortfall)}` : "—"}</span></td>
                <td><span class="status ${status.className}"><i></i>${status.label}</span></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function itemCentreCardsMarkup(item, lines) {
  return `
    <div class="centre-item-cards">
      ${lines.map((line) => {
        const status = CENTRE_LINE_STATUS[line.status];
        return `
          <article class="c-item">
            <div class="c-item__head">
              <span class="tile tile--tiny tile--storage" aria-hidden="true">${esc(initials(line.centreName))}</span>
              <span class="c-item__id">
                <a class="item-link item-link--strong" href="#/centres/${esc(line.centreSlug)}">${esc(line.centreName)}</a>
                <span>${esc(line.centreType)} · Badge ${esc(line.centreCode)}</span>
              </span>
              <span class="status ${status.className}"><i></i>${status.label}</span>
            </div>
            <div class="c-item__facts">
              <div><span>Required</span><strong>${num(line.required)} <em>${esc(item.unit)}</em></strong></div>
              <div><span>On hand</span><strong>${num(line.onHand)} <em>${esc(item.unit)}</em></strong></div>
              <div><span>Shortfall</span><strong class="${line.shortfall ? "is-short" : ""}">${line.shortfall ? `−${num(line.shortfall)}` : "0"}</strong></div>
            </div>
          </article>`;
      }).join("")}
    </div>`;
}

function itemDetailTemplate() {
  const item = currentItem();
  if (!item) {
    return `
      <div class="view">
        <div class="centre-detail-bar">
          <a class="back-link" href="#/items">← All items</a>
        </div>
        <section class="panel">
          <div class="empty-state">
            <div class="empty-state__icon"><svg class="icon" aria-hidden="true"><use href="#i-items"/></svg></div>
            <h3>Item not found</h3>
            <p>The item in this link is not part of the master catalogue. Open Item Master to choose an item.</p>
            <a class="btn btn--primary" href="#/items">Back to Item Master</a>
          </div>
        </section>
      </div>`;
  }

  const health = ITEM_HEALTH[item.status];
  const lines = sortedItemLines(item);
  const departments = departmentsForItem(item);
  return `
    <div class="view">
      <div class="centre-detail-bar">
        <a class="back-link" href="#/items">← All items</a>
        <div class="centre-detail-bar__right">
          ${departments.map((dept) => `<a class="lead-chip" href="#/departments/${esc(dept.slug)}"><svg class="icon" aria-hidden="true"><use href="#i-departments"/></svg>${esc(dept.name)}</a>`).join("")}
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-items"/></svg>Item Master</span>
        </div>
      </div>

      <section class="centre-hero item-hero" aria-labelledby="item-name">
        <header class="centre-hero__head">
          <span class="tile item-tile-lg tile--${categoryClass(item.category)}" aria-hidden="true">${esc(initials(item.name))}</span>
          <div class="centre-hero__id">
            <p class="centre-hero__kicker">Item Master</p>
            <h2 id="item-name">${esc(item.name)}</h2>
            <p>${esc(item.sku)} · ${esc(item.category)} · ${esc(item.unit)}</p>
          </div>
          <span class="status ${health.className}"><i></i>${health.label}</span>
        </header>
        <div class="centre-hero__stats">
          <div class="centre-hero__stat"><span>Unit cost</span><strong>${money(item.cost, 2)}</strong><em>Per ${esc(item.unit)}</em></div>
          <div class="centre-hero__stat"><span>Locations tracked</span><strong>${item.lines.length}</strong><em>Every location in the master</em></div>
          <div class="centre-hero__stat"><span>Units required</span><strong>${num(item.requiredUnits)}</strong><em>Combined location target</em></div>
          <div class="centre-hero__stat centre-hero__stat--alert"><span>Shortfall</span><strong class="${item.shortfallUnits ? "is-short" : ""}">${item.shortfallUnits ? `−${num(item.shortfallUnits)}` : "0"}</strong><em>${item.shortCentreCount} locations need stock</em></div>
        </div>
      </section>

      <section class="panel item-centres-panel" aria-labelledby="item-centres-title">
        <header class="panel__head">
          <div>
            <h2 class="panel__title" id="item-centres-title">Requirement by location</h2>
            <p class="panel__sub">Required quantity and on-hand stock for this item in every centre, sub-centre, and point. The most urgent lines are first.</p>
          </div>
          <span class="lead-chip"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>${item.coveredCount}/${item.lines.length} covered</span>
        </header>
        ${itemCentreTableMarkup(item, lines)}
        ${itemCentreCardsMarkup(item, lines)}
        <div class="table-foot">
          <span><b>${item.lines.length}</b> locations · ${item.shortCentreCount} need stock · ${money(item.cost, 2)} unit cost</span>
          <span class="table-foot__right"><span class="foot-note">Requirement = location target holding</span></span>
        </div>
      </section>
    </div>`;
}
