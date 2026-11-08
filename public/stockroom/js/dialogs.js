"use strict";

/* ------------------------------------------------------------------ */
/* Dialog helpers                                                     */
/* ------------------------------------------------------------------ */

function showDialog(dialog) {
  if (!dialog || dialog.open) return;
  ui.lastFocus = document.activeElement;
  document.body.style.overflow = "hidden";
  dialog.showModal();
}

function closeDialog(dialog) {
  if (dialog && dialog.open) dialog.close();
}

function lockBodyForDialogs() {
  const anyOpen = Boolean(document.querySelector("dialog[open]"));
  document.body.style.overflow = anyOpen ? "hidden" : "";
}

function clearFormErrors(form) {
  form.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
    error.classList.remove("is-visible");
  });
  form.querySelectorAll(".is-invalid").forEach((input) => {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
  });
}

function setFieldError(form, name, message) {
  const input = form.elements[name];
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (error) {
    error.textContent = message;
    error.classList.add("is-visible");
  }
  if (input && input.classList) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
  }
}

function clearFieldError(form, name) {
  const input = form.elements[name];
  const error = form.querySelector(`[data-error-for="${name}"]`);
  if (error) {
    error.textContent = "";
    error.classList.remove("is-visible");
  }
  if (input && input.classList) {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
  }
}

function focusFirstError(form) {
  const invalid = form.querySelector(".is-invalid");
  if (invalid) invalid.focus();
}

function fillProductSelect(select) {
  const products = [...state.products].sort((a, b) => a.name.localeCompare(b.name));
  select.innerHTML = products.map((product) => `
    <option value="${esc(product.id)}">${esc(product.name)} · ${esc(product.sku)}</option>
  `).join("");
}

function generateSku(category) {
  const prefixes = { Audio: "AUD", Workspace: "WRK", Accessories: "ACC", Lighting: "LGT", Storage: "STO" };
  const prefix = prefixes[category] || "SKU";
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function autogenerateRef(type) {
  const prefix = type === "in" ? "PO" : type === "out" ? "SO" : "COUNT";
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/* ------------------------------------------------------------------ */
/* Product dialog                                                     */
/* ------------------------------------------------------------------ */

function openProductDialog(productId = null) {
  const form = document.getElementById("product-form");
  const dialog = document.getElementById("product-dialog");
  if (!form || !dialog) return;
  if (!requireUnlocked("Adding or editing products", ["inventory"])) return;
  const product = productId ? getProduct(productId) : null;
  const isEdit = Boolean(product);

  form.reset();
  clearFormErrors(form);

  const categorySelect = form.elements.category;
  categorySelect.innerHTML = CATEGORY_ORDER.map((category) => `<option value="${esc(category)}">${esc(category)}</option>`).join("");
  form.elements.supplier.innerHTML = Object.keys(SUPPLIER_DIRECTORY)
    .map((supplier) => `<option value="${esc(supplier)}">${esc(supplier)}</option>`)
    .join("");

  document.getElementById("product-dialog-title").textContent = isEdit ? "Edit product" : "Add product";
  document.getElementById("product-dialog-sub").textContent = isEdit
    ? "Update catalog details. Stock changes stay in the movement log."
    : "Create a new SKU in the inventory.";
  document.getElementById("product-submit").textContent = isEdit ? "Save changes" : "Add product";

  const stockInput = form.elements.stock;
  const stockLabel = document.getElementById("product-stock-label");
  const stockNote = form.querySelector("[data-product-stock-note]");

  if (isEdit) {
    form.elements.id.value = product.id;
    form.elements.name.value = product.name;
    form.elements.sku.value = product.sku;
    categorySelect.value = product.category;
    form.elements.supplier.value = product.supplier;
    form.elements.unit.value = product.unit;
    form.elements.cost.value = product.cost;
    form.elements.price.value = product.price;
    form.elements.stock.value = product.stock;
    form.elements.reorder.value = product.reorder;
    stockInput.disabled = true;
    stockLabel.textContent = "On hand (locked)";
    stockNote.hidden = false;
    stockNote.innerHTML = `<strong>${num(product.stock)} ${esc(product.unit)} on hand.</strong> Stock is changed only through adjustments so every movement stays auditable.`;
  } else {
    form.elements.id.value = "";
    categorySelect.value = "Audio";
    form.elements.sku.value = generateSku("Audio");
    form.elements.reorder.value = "10";
    form.elements.stock.value = "0";
    stockInput.disabled = false;
    stockLabel.textContent = "Opening stock";
    stockNote.hidden = true;
    stockNote.textContent = "";
  }

  showDialog(dialog);
  setTimeout(() => form.elements.name.focus(), 40);
}

function validateProductForm(form) {
  clearFormErrors(form);
  let valid = true;
  const name = form.elements.name.value.trim();
  const sku = form.elements.sku.value.trim().toUpperCase();
  const category = form.elements.category.value;
  const supplier = form.elements.supplier.value;
  const unit = form.elements.unit.value;
  const costRaw = form.elements.cost.value.trim();
  const priceRaw = form.elements.price.value.trim();
  const stockRaw = form.elements.stock.value.trim();
  const reorderRaw = form.elements.reorder.value.trim();
  const currentId = form.elements.id.value;

  if (!name) { setFieldError(form, "name", "Give the product a name."); valid = false; }
  if (!sku) {
    setFieldError(form, "sku", "Add a SKU so you can find it later."); valid = false;
  } else if (state.products.some((product) => product.id !== currentId && product.sku.toUpperCase() === sku)) {
    setFieldError(form, "sku", "That SKU is already in use."); valid = false;
  }
  if (!CATEGORY_ORDER.includes(category)) { setFieldError(form, "category", "Choose a category."); valid = false; }
  if (!SUPPLIER_DIRECTORY[supplier]) { setFieldError(form, "supplier", "Choose a supplier."); valid = false; }
  if (!unit) { setFieldError(form, "unit", "Choose a unit."); valid = false; }
  if (costRaw === "" || Number.isNaN(Number(costRaw)) || Number(costRaw) < 0) {
    setFieldError(form, "cost", "Enter a cost of 0 or more."); valid = false;
  }
  if (priceRaw === "" || Number.isNaN(Number(priceRaw)) || Number(priceRaw) < 0) {
    setFieldError(form, "price", "Enter a price of 0 or more."); valid = false;
  }
  const stock = stockRaw === "" ? 0 : Number(stockRaw);
  if (!Number.isInteger(stock) || stock < 0) {
    setFieldError(form, "stock", "Stock must be a whole number of 0 or more."); valid = false;
  }
  const reorder = reorderRaw === "" ? null : Number(reorderRaw);
  if (reorder === null || !Number.isInteger(reorder) || reorder < 0) {
    setFieldError(form, "reorder", "Enter a whole number of 0 or more."); valid = false;
  }

  if (!valid) focusFirstError(form);
  return {
    valid,
    values: { name, sku, category, supplier, unit, cost: Number(costRaw), price: Number(priceRaw), stock, reorder }
  };
}

function submitProductForm(event) {
  event.preventDefault();
  const form = document.getElementById("product-form");
  if (!requireUnlocked("Adding or editing products", ["inventory"])) return;
  const result = validateProductForm(form);
  if (!result.valid) return;
  const { name, sku, category, supplier, unit, cost, price, stock, reorder } = result.values;
  const currentId = form.elements.id.value;
  const now = new Date().toISOString();

  if (currentId) {
    const product = getProduct(currentId);
    if (!product) return;
    Object.assign(product, { name, sku, category, supplier, unit, cost, price, reorder, updatedAt: now });
    state.movements.forEach((movement) => {
      if (movement.productId === currentId) {
        movement.productName = name;
        movement.sku = sku;
        movement.unit = unit;
      }
    });
    saveState();
    closeDialog(document.getElementById("product-dialog"));
    render();
    showToast("Product updated", `${name} · ${sku}`);
  } else {
    const product = {
      id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      name, sku, category, supplier, unit, cost, price, stock, reorder,
      updatedAt: now
    };
    state.products.unshift(product);
    if (stock > 0) {
      state.movements.unshift({
        id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        productId: product.id,
        productName: name,
        sku,
        unit,
        type: "in",
        qty: stock,
        at: now,
        ref: "OPENING",
        note: "Opening stock",
        user: actorName()
      });
    }
    saveState();
    ui.inventory = { q: "", category: "all", supplier: "all", status: "all", sort: "name", dir: "asc" };
    closeDialog(document.getElementById("product-dialog"));
    ui.route = "inventory";
    if (location.hash !== "#/inventory") history.pushState(null, "", "#/inventory");
    flashProduct(product.id);
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
    showToast("Product added", `${name} · ${stock} ${plural(stock, unit)} on hand`);
  }
}

/* ------------------------------------------------------------------ */
/* Stock adjustment                                                   */
/* ------------------------------------------------------------------ */

function openAdjustDialog(productId = null, type = "in") {
  const dialog = document.getElementById("adjust-dialog");
  const form = document.getElementById("adjust-form");
  if (!dialog || !form) return;
  if (!requireUnlocked("Moving stock", ["inventory", "movements"])) return;
  if (!state.products.length) {
    showToast("No products to update", "Add a product before logging stock movement.", "error");
    return;
  }
  const select = document.getElementById("adjust-product");
  fillProductSelect(select);
  const chosen = productId && getProduct(productId) ? productId : state.products[0].id;
  ui.adjust.productId = chosen;
  ui.adjust.type = type;

  form.reset();
  select.value = chosen;
  clearFormErrors(form);
  document.getElementById("adjust-note").value = "";
  document.getElementById("adjust-dialog-title").textContent = productId ? "Move stock" : "Log movement";
  document.getElementById("adjust-dialog-sub").textContent = productId
    ? "Record a receipt, dispatch, or physical count."
    : "Choose a product and record what changed.";
  setAdjustType(type, true);
  updateAdjustUI({ setQty: type === "set" });
  showDialog(dialog);
  setTimeout(() => document.getElementById("adjust-qty").focus(), 40);
}

function setAdjustType(type, fromOpen = false) {
  const form = document.getElementById("adjust-form");
  if (!form) return;
  ui.adjust.type = type;
  document.querySelectorAll("[data-action='adjust-type']").forEach((button) => {
    const active = button.dataset.type === type;
    button.setAttribute("aria-pressed", String(active));
  });
  const qty = document.getElementById("adjust-qty");
  if (qty) qty.value = "";
  clearFieldError(form, "qty");
  clearFieldError(form, "stock");
  updateAdjustUI({ setQty: type === "set" && !fromOpen });
}

function currentAdjustProduct() {
  return getProduct(ui.adjust.productId);
}

function updateAdjustUI({ setQty = false } = {}) {
  const product = currentAdjustProduct();
  const form = document.getElementById("adjust-form");
  if (!product || !form) return;
  const type = ui.adjust.type;
  const summary = document.getElementById("adjust-summary");
  const qtyLabel = document.getElementById("adjust-qty-label");
  const qtyHint = document.getElementById("adjust-qty-hint");
  const qtyInput = document.getElementById("adjust-qty");
  const presets = document.getElementById("qty-presets");
  const ref = document.getElementById("adjust-ref");

  if (summary) {
    summary.innerHTML = `
      <span class="tile tile--${categoryClass(product.category)}" aria-hidden="true">${esc(initials(product.name))}</span>
      <span class="adjust-summary__text">
        <strong>${esc(product.name)}</strong>
        <span>${esc(product.sku)} · ${esc(product.supplier)}</span>
      </span>
      <span class="adjust-summary__stock">
        <span>On hand</span>
        <strong>${num(product.stock)} <span style="font-size:9.5px;font-weight:500;color:var(--ink-3);">${esc(product.unit)}</span></strong>
      </span>`;
  }

  const labels = {
    in: ["Quantity to receive", "Enter the number of units arriving."],
    out: ["Quantity to remove", "Cannot be more than the stock on hand."],
    set: ["Counted quantity", "Enter the physical count. The difference is booked as an adjustment."]
  };
  if (qtyLabel) qtyLabel.textContent = labels[type][0];
  if (qtyHint) qtyHint.textContent = labels[type][1];

  if (presets) {
    if (type === "set") {
      presets.innerHTML = "";
      presets.hidden = true;
    } else {
      const values = type === "in" ? [10, 25, 50] : [1, 5, 10];
      presets.hidden = false;
      presets.innerHTML = values.map((value) => `<button class="qty-preset" type="button" data-action="qty-preset" data-qty="${value}">+${value}</button>`).join("");
    }
  }

  if (qtyInput) {
    qtyInput.value = setQty ? String(product.stock) : "";
    qtyInput.placeholder = type === "set" ? String(product.stock) : "0";
  }
  if (ref) {
    ref.value = "";
    ref.placeholder = autogenerateRef(type);
  }
  updateAdjustPreview();
}

function adjustDraft() {
  const product = currentAdjustProduct();
  const qtyInput = document.getElementById("adjust-qty");
  if (!product || !qtyInput) return null;
  const raw = qtyInput.value.trim();
  const qty = raw === "" ? null : Number(raw);
  const type = ui.adjust.type;
  let delta = 0;
  let projected = product.stock;
  let invalid = false;
  let message = "";
  if (qty !== null) {
    if (!Number.isInteger(qty) || qty < 0) {
      invalid = true;
      message = "Enter a whole number of 0 or more.";
    } else if (type === "in") {
      delta = qty;
    } else if (type === "out") {
      delta = -qty;
      if (qty > product.stock) {
        invalid = true;
        message = `Only ${product.stock} ${plural(product.stock, product.unit)} on hand.`;
      }
    } else {
      delta = qty - product.stock;
    }
    projected = product.stock + delta;
    if (projected < 0) {
      invalid = true;
      message = "Stock cannot go below zero.";
    }
  }
  return { product, type, qty, raw, delta, projected, invalid, message };
}

function updateAdjustPreview() {
  const preview = document.getElementById("adjust-preview");
  if (!preview) return;
  const draft = adjustDraft();
  if (!draft) return;
  const { product, type, qty, delta, projected, invalid, message } = draft;
  const empty = qty === null;
  preview.classList.toggle("is-invalid", invalid);
  const deltaClass = delta > 0 ? "is-in" : delta < 0 ? "is-out" : "is-flat";
  const deltaText = empty ? "—" : delta === 0 ? "No change" : `${delta > 0 ? "+" : "−"}${num(Math.abs(delta))} ${esc(product.unit)}`;
  preview.innerHTML = `
    <span class="adjust-preview__label">New on hand</span>
    <span class="adjust-preview__values">
      <strong>${num(product.stock)}</strong>
      <svg class="icon" aria-hidden="true"><use href="#i-arrow-right"/></svg>
      <strong>${invalid ? "—" : num(projected)}</strong>
      <span class="adjust-preview__delta ${invalid ? "is-out" : deltaClass}">${invalid ? "Check quantity" : deltaText}</span>
    </span>`;
  const error = document.querySelector("#adjust-form [data-error-for='qty']");
  if (error && invalid && message) {
    error.textContent = message;
    error.classList.add("is-visible");
  } else if (error && !invalid) {
    error.textContent = "";
    error.classList.remove("is-visible");
  }
}

function submitAdjustForm(event) {
  event.preventDefault();
  const form = document.getElementById("adjust-form");
  if (!requireUnlocked("Moving stock", ["inventory", "movements"])) return;
  clearFormErrors(form);
  const draft = adjustDraft();
  if (!draft) return;
  const { product, type, qty, delta, invalid, message } = draft;
  if (qty === null || qty === undefined || Number.isNaN(qty)) {
    setFieldError(form, "qty", "Enter a quantity.");
    focusFirstError(form);
    return;
  }
  if (invalid) {
    setFieldError(form, "qty", message || "Check the quantity.");
    focusFirstError(form);
    return;
  }
  if ((type === "in" || type === "out") && qty === 0) {
    setFieldError(form, "qty", "Quantity must be greater than zero.");
    focusFirstError(form);
    return;
  }
  if (delta === 0) {
    setFieldError(form, "qty", "This count matches the current stock, so there is nothing to record.");
    focusFirstError(form);
    return;
  }

  const refInput = document.getElementById("adjust-ref");
  const noteInput = document.getElementById("adjust-note");
  const movementRef = (refInput?.value || "").trim() || autogenerateRef(type);
  const defaultNote = type === "in" ? "Stock received" : type === "out" ? "Stock dispatched" : "Physical count";
  const note = (noteInput?.value || "").trim() || defaultNote;
  const now = new Date().toISOString();
  const newStock = product.stock + delta;

  product.stock = newStock;
  product.updatedAt = now;
  const movementType = type === "set" ? "adjust" : type;
  state.movements.unshift({
    id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    unit: product.unit,
    type: movementType,
    qty: delta,
    at: now,
    ref: movementRef,
    note,
    user: actorName()
  });
  saveState();
  closeDialog(document.getElementById("adjust-dialog"));
  render();
  const toastTitle = type === "in" ? "Stock received" : type === "out" ? "Stock removed" : "Stock count updated";
  showToast(toastTitle, `${product.name} · ${delta > 0 ? "+" : "−"}${num(Math.abs(delta))} ${plural(Math.abs(delta), product.unit)} · ${num(newStock)} on hand`);
}

/* ------------------------------------------------------------------ */
/* Centre dialog                                                      */
/* ------------------------------------------------------------------ */

function centreBySlug(slug) {
  return CENTRES.find((centre) => centre.slug === slug) || null;
}

function syncCentreParentField(form) {
  const type = form.elements.type.value;
  const parentField = form.elements.parent;
  const topLevel = type === "Centre";
  parentField.disabled = topLevel;
  parentField.required = !topLevel;
  if (topLevel) parentField.value = "";
  const note = form.querySelector("[data-centre-note]");
  if (note) {
    note.textContent = topLevel
      ? "Top-level centres have no parent and use their badge code as the location reference."
      : "Choose the centre this location reports to.";
  }
}

function openCentreDialog(slug = null) {
  const form = document.getElementById("centre-form");
  const dialog = document.getElementById("centre-dialog");
  if (!form || !dialog) return;
  if (!requireUnlocked("Adding or editing centres", ["centres"])) return;
  const centre = slug ? centreBySlug(slug) : null;
  const isEdit = Boolean(centre);

  form.reset();
  clearFormErrors(form);
  form.elements.original.value = centre ? centre.name : "";
  form.elements.name.value = centre ? centre.name : "";
  if (form.elements.areaName) form.elements.areaName.value = CENTRE_AREA_NAME;
  form.elements.type.value = centre ? centre.type : "Centre";
  form.elements.code.value = centre ? centre.code : nextCentreCode();
  form.elements.incharge.value = centre ? (centre.incharge || "") : "";
  form.elements.inchargePhone.value = centre ? (centre.inchargePhone || "") : "";
  form.elements.gmail.value = centre ? (centre.gmail || "") : "";

  const parents = CENTRES
    .filter((candidate) => candidate.type === "Centre" && candidate.name !== (centre ? centre.name : ""))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  form.elements.parent.innerHTML = [
    `<option value="">Select a parent centre</option>`,
    ...parents.map((candidate) => `<option value="${esc(candidate.name)}">${esc(candidate.name)}</option>`)
  ].join("");
  form.elements.parent.value = centre && centre.parent ? centre.parent : "";

  document.getElementById("centre-dialog-title").textContent = isEdit ? "Edit Satsang Place" : "Add Satsang Place";
  document.getElementById("centre-dialog-sub").textContent = isEdit
    ? "Update the Satsang place name, type, badge code, parent, or contacts. Area Name stays fixed at Faridabad."
    : "Create a Satsang place in the centre master. Area Name is fixed at Faridabad.";
  document.getElementById("centre-submit").textContent = isEdit ? "Save changes" : "Add Satsang Place";

  syncCentreParentField(form);
  showDialog(dialog);
  setTimeout(() => form.elements.name.focus(), 40);
}

function validateCentreForm(form) {
  clearFormErrors(form);
  let valid = true;
  const original = form.elements.original.value;
  const name = form.elements.name.value.trim();
  const code = form.elements.code.value.trim();
  const type = form.elements.type.value;
  const parent = form.elements.parent.value;
  const incharge = form.elements.incharge.value.trim();
  const inchargePhone = form.elements.inchargePhone.value.trim();
  const gmail = form.elements.gmail.value.trim();

  if (!name) {
    setFieldError(form, "name", "Give the centre a name.");
    valid = false;
  } else if (name.length > 60) {
    setFieldError(form, "name", "Keep the name under 60 characters.");
    valid = false;
  } else if (CENTRES.some((centre) => centre.name.toLowerCase() === name.toLowerCase() && centre.name !== original)) {
    setFieldError(form, "name", "A centre with this name already exists.");
    valid = false;
  }

  if (!code) {
    setFieldError(form, "code", "Add a badge code.");
    valid = false;
  } else if (!/^\d{4}$/.test(code)) {
    setFieldError(form, "code", "Badge code must be exactly 4 digits.");
    valid = false;
  } else if (CENTRES.some((centre) => centre.code === code && centre.name !== original)) {
    setFieldError(form, "code", "This badge code is already in use.");
    valid = false;
  }

  if (!["Centre", "SubCentre", "Point"].includes(type)) {
    setFieldError(form, "type", "Choose a location type.");
    valid = false;
  }

  if (type !== "Centre") {
    const parentCentre = CENTRES.find((centre) => centre.name === parent);
    if (!parent || !parentCentre || parentCentre.type !== "Centre" || parent === original) {
      setFieldError(form, "parent", "Choose a valid parent centre.");
      valid = false;
    }
  }

  if (!incharge) {
    setFieldError(form, "incharge", "Add the incharge name.");
    valid = false;
  } else if (incharge.length > 60) {
    setFieldError(form, "incharge", "Keep the incharge name under 60 characters.");
    valid = false;
  }

  if (!inchargePhone) {
    setFieldError(form, "inchargePhone", "Add the incharge phone number.");
    valid = false;
  } else if (!/^[+()\d][\d\s\-().]{5,19}$/.test(inchargePhone)) {
    setFieldError(form, "inchargePhone", "Enter a valid phone number.");
    valid = false;
  }

  if (!gmail) {
    setFieldError(form, "gmail", "Add the Satsang place email id.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gmail)) {
    setFieldError(form, "gmail", "Enter a valid email id.");
    valid = false;
  }

  if (!valid) focusFirstError(form);
  return valid;
}

function submitCentreForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!requireUnlocked("Saving centres", ["centres"])) return;
  if (!validateCentreForm(form)) return;

  const original = form.elements.original.value;
  const payload = {
    name: form.elements.name.value.trim(),
    code: form.elements.code.value.trim(),
    type: form.elements.type.value,
    parent: form.elements.type.value === "Centre" ? null : form.elements.parent.value,
    incharge: form.elements.incharge.value.trim(),
    inchargePhone: form.elements.inchargePhone.value.trim(),
    gmail: form.elements.gmail.value.trim()
  };
  const editing = Boolean(original);
  const centre = editing ? updateCentre(original, payload) : createCentre(payload);
  if (!centre) {
    showToast("Could not save centre", "The centre record no longer exists.", "error");
    return;
  }

  closeDialog(document.getElementById("centre-dialog"));
  render();
  showToast(
    editing ? "Satsang place updated" : "Satsang place added",
    `${centre.name} · ${centre.type === "SubCentre" ? "Sub-centre" : centre.type}${centre.parent ? ` under ${centre.parent}` : ""}`
  );
}

/* ------------------------------------------------------------------ */
/* Confirmation                                                       */
/* ------------------------------------------------------------------ */

function openConfirmDialog({ title, message, label, onConfirm }) {
  const dialog = document.getElementById("confirm-dialog");
  if (!dialog) return;
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-message").textContent = message;
  document.getElementById("confirm-submit").textContent = label || "Confirm";
  ui.pendingConfirm = { onConfirm };
  showDialog(dialog);
  setTimeout(() => document.getElementById("confirm-submit").focus(), 40);
}

function submitConfirm(event) {
  event.preventDefault();
  const pending = ui.pendingConfirm;
  ui.pendingConfirm = null;
  closeDialog(document.getElementById("confirm-dialog"));
  if (pending && typeof pending.onConfirm === "function") pending.onConfirm();
}

/* ------------------------------------------------------------------ */
/* Row menu                                                          */
/* ------------------------------------------------------------------ */

function closeRowMenu() {
  const menu = document.getElementById("row-menu");
  if (!menu) return;
  menu.hidden = true;
  menu.innerHTML = "";
  document.querySelectorAll("[data-action='row-menu'][aria-expanded='true']").forEach((button) => button.setAttribute("aria-expanded", "false"));
}

function openRowMenu(button) {
  const id = button.dataset.id;
  const product = getProduct(id);
  const menu = document.getElementById("row-menu");
  if (!product || !menu) return;
  const inventoryLocked = isSectionLocked("inventory");
  const movementLocked = isSectionLocked("movements");
  const adjustLocked = inventoryLocked || movementLocked;
  const lockedNote = "This section is locked by an administrator.";
  closeRowMenu();
  menu.innerHTML = `
    <button class="row-menu__item" type="button" data-action="adjust-stock" data-id="${esc(product.id)}" role="menuitem" ${adjustLocked ? "disabled" : ""} title="${adjustLocked ? lockedNote : ""}"><svg class="icon" aria-hidden="true"><use href="#i-flow"/></svg>Adjust stock</button>
    <button class="row-menu__item" type="button" data-action="edit-product" data-id="${esc(product.id)}" role="menuitem" ${inventoryLocked ? "disabled" : ""} title="${inventoryLocked ? lockedNote : ""}"><svg class="icon" aria-hidden="true"><use href="#i-edit"/></svg>Edit product</button>
    ${canManageData() ? `
      <div class="row-menu__sep" role="separator"></div>
      <button class="row-menu__item row-menu__item--danger" type="button" data-action="delete-product" data-id="${esc(product.id)}" role="menuitem" ${inventoryLocked ? "disabled" : ""} title="${inventoryLocked ? lockedNote : ""}"><svg class="icon" aria-hidden="true"><use href="#i-trash"/></svg>Delete product</button>` : ""}`;
  menu.hidden = false;
  button.setAttribute("aria-expanded", "true");
  const rect = button.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  let top = rect.bottom + 6;
  if (top + menuRect.height > window.innerHeight - 12) top = rect.top - menuRect.height - 6;
  let left = rect.right - menuRect.width;
  left = Math.max(10, Math.min(left, window.innerWidth - menuRect.width - 10));
  menu.style.top = `${Math.max(10, top)}px`;
  menu.style.left = `${left}px`;
  const first = menu.querySelector("button");
  if (first) first.focus();
}

/* ------------------------------------------------------------------ */
/* Quick find                                                         */
/* ------------------------------------------------------------------ */

function paletteResults(query) {
  const q = query.trim().toLowerCase();
  const products = [...state.products]
    .filter((product) => !q || [product.name, product.sku, product.supplier, product.category].join(" ").toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));
  return products;
}

function renderPalette(query = "") {
  const list = document.getElementById("palette-results");
  const input = document.getElementById("palette-input");
  if (!list) return;
  const results = paletteResults(query);
  ui.palette.results = results;
  ui.palette.index = 0;
  if (!results.length) {
    list.innerHTML = `<div class="palette__empty">No products match “${esc(query.trim())}”.</div>`;
    if (input) input.removeAttribute("aria-activedescendant");
    return;
  }
  list.innerHTML = `<div class="palette__group-label">Products</div>${results.map((product, index) => {
    const status = statusOf(product);
    const info = STATUS[status];
    return `
      <div class="palette-item ${index === 0 ? "is-active" : ""}" id="palette-option-${index}" role="option" aria-selected="${index === 0}" data-index="${index}" data-id="${esc(product.id)}">
        <span class="tile tile--tiny tile--${categoryClass(product.category)}" aria-hidden="true">${esc(initials(product.name))}</span>
        <span class="palette-item__main">
          <span class="palette-item__name">${esc(product.name)}</span>
          <span class="palette-item__meta">${esc(product.sku)} · ${esc(product.supplier)}</span>
        </span>
        <span class="palette-item__stock">
          <strong class="${status === "out" ? "is-out" : status === "low" ? "is-low" : ""}">${num(product.stock)} ${esc(product.unit)}</strong>
          <span>${info.label}</span>
        </span>
      </div>`;
  }).join("")}`;
  setPaletteActive(0);
}

function setPaletteActive(index) {
  const results = ui.palette.results;
  if (!results.length) return;
  const next = (index + results.length) % results.length;
  ui.palette.index = next;
  document.querySelectorAll(".palette-item").forEach((item, itemIndex) => {
    const active = itemIndex === next;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
  });
  const active = document.getElementById(`palette-option-${next}`);
  const input = document.getElementById("palette-input");
  if (active && input) {
    input.setAttribute("aria-activedescendant", active.id);
    active.scrollIntoView({ block: "nearest" });
  }
}

function selectPaletteProduct(index) {
  const product = ui.palette.results[index];
  if (!product) return;
  closeDialog(document.getElementById("search-dialog"));
  ui.inventory = { q: product.sku, category: "all", supplier: "all", status: "all", sort: "name", dir: "asc" };
  navigate("inventory");
  flashProduct(product.id);
  if (ui.route === "inventory") render();
}

function openSearch() {
  if (document.querySelector("dialog[open]")) return;
  const dialog = document.getElementById("search-dialog");
  const input = document.getElementById("palette-input");
  if (!dialog || !input) return;
  input.value = "";
  renderPalette("");
  showDialog(dialog);
  setTimeout(() => input.focus(), 30);
}

function handlePaletteKey(event) {
  if (!ui.palette.results.length) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    setPaletteActive(ui.palette.index + 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    setPaletteActive(ui.palette.index - 1);
  } else if (event.key === "Enter") {
    event.preventDefault();
    selectPaletteProduct(ui.palette.index);
  }
}
