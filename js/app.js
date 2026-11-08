"use strict";

/* ------------------------------------------------------------------ */
/* Appearance                                                         */
/* ------------------------------------------------------------------ */

function themeStorageKey() {
  return currentUser ? `${THEME_STORAGE_KEY}:${currentUser.username}` : THEME_STORAGE_KEY;
}

function canUseDarkTheme() {
  return Boolean(currentUser && currentUser.isAdmin);
}

function getTheme() {
  if (!canUseDarkTheme()) return "light";
  try {
    return localStorage.getItem(themeStorageKey()) === "dark" ? "dark" : "light";
  } catch (error) {
    return "light";
  }
}

function applyTheme(theme) {
  const next = theme === "dark" && canUseDarkTheme() ? "dark" : "light";
  const dark = next === "dark";
  document.documentElement.dataset.theme = next;

  const meta = document.getElementById("meta-theme-color");
  if (meta) meta.setAttribute("content", dark ? "#0f1511" : "#f2ebdc");

  document.querySelectorAll("[data-action='toggle-theme']").forEach((toggle) => {
    toggle.setAttribute("aria-checked", String(dark));
    toggle.setAttribute("aria-label", "Dark theme");
    toggle.setAttribute("title", dark ? "Pull the cord for light theme" : "Pull the cord for dark theme");
  });

  document.querySelectorAll("[data-action='set-theme']").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeValue === next));
  });
}

function setTheme(theme) {
  if (!canUseDarkTheme()) {
    applyTheme("light");
    return;
  }
  const next = theme === "dark" ? "dark" : "light";
  try {
    localStorage.setItem(themeStorageKey(), next);
  } catch (error) {
    console.warn("Could not save the appearance setting.", error);
  }
  applyTheme(next);
}

function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

/* ------------------------------------------------------------------ */
/* Notifications                                                      */
/* ------------------------------------------------------------------ */

function closeNotifications() {
  const panel = document.getElementById("notif-panel");
  const button = document.querySelector("[data-action='toggle-notifications']");
  if (panel) panel.hidden = true;
  if (button) button.setAttribute("aria-expanded", "false");
}

function toggleNotifications() {
  const panel = document.getElementById("notif-panel");
  const button = document.querySelector("[data-action='toggle-notifications']");
  if (!panel || !button) return;
  if (panel.hidden) {
    closeAccountMenu();
    renderNotifications();
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
  } else {
    closeNotifications();
  }
}

/* ------------------------------------------------------------------ */
/* Account menu                                                       */
/* ------------------------------------------------------------------ */

function closeAccountMenu() {
  const panel = document.getElementById("account-panel");
  const button = document.querySelector("[data-action='toggle-account']");
  if (panel) panel.hidden = true;
  if (button) button.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
  const panel = document.getElementById("account-panel");
  const button = document.querySelector("[data-action='toggle-account']");
  if (!panel || !button) return;
  const opening = panel.hidden;
  closeNotifications();
  closeRowMenu();
  panel.hidden = !opening;
  button.setAttribute("aria-expanded", String(opening));
}

/* ------------------------------------------------------------------ */
/* Export                                                             */
/* ------------------------------------------------------------------ */

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function exportInventoryCsv() {
  const products = inventoryFilteredProducts();
  if (!products.length) {
    showToast("Nothing to export", "Adjust the filters so at least one product is visible.", "error");
    return;
  }
  const header = ["Product", "SKU", "Category", "Supplier", "Unit", "On hand", "Reorder point", "Unit cost (INR)", "Sale price (INR)", "Stock value (INR)", "Status"];
  const rows = products.map((product) => [
    csvCell(product.name),
    csvCell(product.sku),
    csvCell(product.category),
    csvCell(product.supplier),
    csvCell(product.unit),
    product.stock,
    product.reorder,
    Number(product.cost).toFixed(2),
    Number(product.price).toFixed(2),
    (Number(product.stock) * Number(product.cost)).toFixed(2),
    csvCell(STATUS[statusOf(product)].label)
  ].join(","));
  const csv = `\ufeff${header.join(",")}\r\n${rows.join("\r\n")}\r\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `stock-management-inventory-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Inventory exported", `${products.length} ${plural(products.length, "product")} written to CSV`);
}

function exportCentresCsv() {
  const centres = centreMasterRows();
  if (!centres.length) {
    showToast("Nothing to export", "Adjust the search so at least one centre is visible.", "error");
    return;
  }
  const header = ["Centre", "Badge code", "Type", "Parent centre", "Area name", "Incharge name", "Incharge phone", "Email Id"];
  const rows = centres.map((centre) => [
    csvCell(centre.name),
    csvCell(centre.code),
    csvCell(CENTRE_TYPE_LABEL[centre.type] || centre.type),
    csvCell(centre.parent || ""),
    csvCell(centre.areaName || CENTRE_AREA_NAME),
    csvCell(centre.incharge || ""),
    csvCell(centre.inchargePhone || ""),
    csvCell(centre.gmail || "")
  ].join(","));
  const csv = `\ufeff${header.join(",")}\r\n${rows.join("\r\n")}\r\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `stockroom-centre-master-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Centre master exported", `${centres.length} ${plural(centres.length, "centre")} written to CSV`);
}

/* ------------------------------------------------------------------ */
/* Actions                                                            */
/* ------------------------------------------------------------------ */

function setInventoryStatus(status) {
  ui.inventory.status = status;
  renderInventoryTable();
}

function reviewAttention() {
  closeNotifications();
  ui.inventory = { q: "", category: "all", supplier: "all", status: "attention", sort: "name", dir: "asc" };
  navigate("inventory");
}

function clearInventoryFilters() {
  ui.inventory = { q: "", category: "all", supplier: "all", status: "all", sort: "name", dir: "asc" };
  render();
  setTimeout(() => document.getElementById("inventory-search")?.focus(), 20);
}

function requireUnlocked(actionLabel, sections = []) {
  const scope = [...new Set([ui.route, ...sections])];
  const lockedSection = scope.find((section) => LOCKABLE_SECTIONS.includes(section) && isSectionLocked(section));
  if (!lockedSection) return true;
  showToast(`${LOCK_SECTION_LABELS[lockedSection]} locked`, `${actionLabel} is disabled while an administrator has this section locked.`, "error");
  return false;
}

function toggleSectionLock() {
  if (!isAdministrator()) {
    showToast("Admin access required", "Only administrators can lock or unlock sections.", "error");
    return;
  }
  const section = ui.route;
  const label = LOCK_SECTION_LABELS[section] || "This section";
  const next = !isSectionLocked(section);
  setSectionLock(section, next);
  render();
  showToast(
    next ? `${label} locked` : `${label} unlocked`,
    next ? "Adding, editing, and removing records is paused for everyone." : "Editing access is restored for this section.",
    next ? "info" : "success"
  );
}

function confirmDelete(productId) {
  if (!requireUnlocked("Removing products", ["inventory"])) return;
  const product = getProduct(productId);
  if (!product) return;
  openConfirmDialog({
    title: "Remove product?",
    message: `“${product.name}” will be removed from inventory. Its past movements stay in the audit trail. This cannot be undone.`,
    label: "Remove product",
    onConfirm: () => {
      state.products = state.products.filter((item) => item.id !== productId);
      saveState();
      render();
      showToast("Product removed", `${product.name} · movement history retained`, "info");
    }
  });
}

function confirmDeleteCentre(slug) {
  if (!requireUnlocked("Removing centres", ["centres"])) return;
  const centre = centreBySlug(slug);
  if (!centre) return;
  const branches = getCentreChildren(centre);
  if (branches.length) {
    showToast(
      "Centre has branches",
      `${centre.name} still has ${branches.length} ${plural(branches.length, "branch", "branches")}. Move or remove them first.`,
      "error"
    );
    return;
  }
  openConfirmDialog({
    title: "Remove centre?",
    message: `“${centre.name}” will be removed from the centre master along with its requirement lines. This cannot be undone.`,
    label: "Remove centre",
    onConfirm: () => {
      if (!removeCentre(centre.name)) {
        showToast("Could not remove centre", "Move or remove its branches first.", "error");
        return;
      }
      render();
      showToast("Centre removed", `${centre.name} · centre master updated`, "info");
    }
  });
}

function handleAction(element) {
  const action = element.dataset.action;
  const id = element.dataset.id;
  if (!action) return;

  if (element.closest("#row-menu") && !["adjust-stock", "edit-product", "delete-product"].includes(action)) {
    closeRowMenu();
  }

  switch (action) {
    case "toggle-section-lock":
      toggleSectionLock();
      break;
    case "toggle-masters":
      toggleMastersGroup();
      break;
    case "toggle-account":
      toggleAccountMenu();
      break;
    case "toggle-theme":
      toggleTheme();
      break;
    case "set-theme":
      setTheme(element.dataset.themeValue);
      break;
    case "logout":
      signOut();
      break;
    case "open-search":
      openSearch();
      break;
    case "toggle-notifications":
      toggleNotifications();
      break;
    case "close-notifications":
      closeNotifications();
      break;
    case "review-attention":
      reviewAttention();
      break;
    case "add-product":
      openProductDialog();
      break;
    case "edit-product":
      closeRowMenu();
      openProductDialog(id);
      break;
    case "adjust-stock":
      closeRowMenu();
      openAdjustDialog(id, "in");
      break;
    case "receive-stock":
      closeNotifications();
      closeRowMenu();
      openAdjustDialog(id, "in");
      break;
    case "delete-product":
      closeRowMenu();
      confirmDelete(id);
      break;
    case "row-menu":
      openRowMenu(element);
      break;
    case "export-csv":
      exportInventoryCsv();
      break;
    case "export-centres":
      exportCentresCsv();
      break;
    case "add-centre":
      openCentreDialog();
      break;
    case "edit-centre":
      openCentreDialog(element.dataset.centre);
      break;
    case "delete-centre":
      confirmDeleteCentre(element.dataset.centre);
      break;
    case "sort-centres": {
      const sortKey = element.dataset.sort;
      if (ui.centres.sort === sortKey) ui.centres.dir = ui.centres.dir === "asc" ? "desc" : "asc";
      else {
        ui.centres.sort = sortKey;
        ui.centres.dir = "asc";
      }
      renderCentreMasterRows();
      break;
    }
    case "close-dialog": {
      const dialog = element.closest("dialog");
      if (dialog) closeDialog(dialog);
      break;
    }
    case "filter-status":
      setInventoryStatus(element.dataset.status);
      break;
    case "sort-inventory": {
      const sortKey = element.dataset.sort;
      if (ui.inventory.sort === sortKey) ui.inventory.dir = ui.inventory.dir === "asc" ? "desc" : "asc";
      else {
        ui.inventory.sort = sortKey;
        ui.inventory.dir = sortKey === "stock" ? "desc" : "asc";
      }
      renderInventoryTable();
      break;
    }
    case "clear-filters":
      clearInventoryFilters();
      break;
    case "view-supplier":
      ui.inventory = { q: "", category: "all", supplier: element.dataset.supplier || "all", status: "all", sort: "name", dir: "asc" };
      navigate("inventory");
      if (ui.route === "inventory") render();
      break;
    case "filter-centres":
      ui.centres.status = element.dataset.status || "all";
      renderCentresGrid();
      break;
    case "clear-centre-filters":
      ui.centres = { q: "", status: "all", type: "all", sort: "name", dir: "asc" };
      render();
      setTimeout(() => document.getElementById("centre-search")?.focus(), 20);
      break;
    case "clear-incharge": {
      const form = document.getElementById("centre-form");
      if (form) {
        form.elements.incharge.value = "";
        clearFieldError(form, "incharge");
        form.elements.incharge.focus();
      }
      break;
    }
    case "filter-items":
      ui.items.status = element.dataset.status || "all";
      renderItemsGrid();
      break;
    case "clear-item-filters":
      ui.items = { q: "", status: "all" };
      render();
      setTimeout(() => document.getElementById("item-search")?.focus(), 20);
      break;
    case "filter-departments":
      ui.departments.status = element.dataset.status || "all";
      renderDepartmentsGrid();
      break;
    case "clear-department-filters":
      ui.departments = { q: "", status: "all" };
      render();
      setTimeout(() => document.getElementById("department-search")?.focus(), 20);
      break;
    case "log-movement":
      openAdjustDialog(null, "in");
      break;
    case "filter-movements":
      ui.movements.type = element.dataset.type;
      renderMovementsTable();
      break;
    case "adjust-type":
      setAdjustType(element.dataset.type);
      break;
    case "qty-preset": {
      const qty = document.getElementById("adjust-qty");
      if (qty) {
        qty.value = element.dataset.qty || "";
        clearFieldError(document.getElementById("adjust-form"), "qty");
        updateAdjustPreview();
      }
      break;
    }
    default:
      break;
  }

  if (element.closest("#row-menu") && ["adjust-stock", "edit-product", "delete-product"].includes(action)) {
    closeRowMenu();
  }
}

/* ------------------------------------------------------------------ */
/* Wiring                                                             */
/* ------------------------------------------------------------------ */

function wireDialogs() {
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener("close", () => {
      lockBodyForDialogs();
      if (dialog.id === "confirm-dialog") ui.pendingConfirm = null;
    });
  });

  const productForm = document.getElementById("product-form");
  productForm?.addEventListener("submit", submitProductForm);
  ["input", "change"].forEach((eventName) => {
    productForm?.addEventListener(eventName, (event) => {
      if (event.target?.name) clearFieldError(productForm, event.target.name);
    });
  });
  document.getElementById("product-category")?.addEventListener("change", (event) => {
    if (!productForm || productForm.elements.id.value) return;
    const sku = document.getElementById("product-sku");
    if (sku && (!sku.value || /^[A-Z]{3}-\d{4}$/.test(sku.value))) {
      sku.value = generateSku(event.target.value);
      clearFieldError(productForm, "sku");
    }
  });

  const centreForm = document.getElementById("centre-form");
  centreForm?.addEventListener("submit", submitCentreForm);
  document.getElementById("centre-type")?.addEventListener("change", () => syncCentreParentField(centreForm));
  document.getElementById("centre-code")?.addEventListener("input", (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
    if (event.target.value !== digits) event.target.value = digits;
  });
  ["input", "change"].forEach((eventName) => {
    centreForm?.addEventListener(eventName, (event) => {
      if (event.target?.name) clearFieldError(centreForm, event.target.name);
    });
  });

  const adjustForm = document.getElementById("adjust-form");
  adjustForm?.addEventListener("submit", submitAdjustForm);
  document.getElementById("adjust-qty")?.addEventListener("input", () => {
    clearFieldError(adjustForm, "qty");
    updateAdjustPreview();
  });
  document.getElementById("adjust-product")?.addEventListener("change", (event) => {
    ui.adjust.productId = event.target.value;
    updateAdjustUI({ setQty: ui.adjust.type === "set" });
    updateAdjustPreview();
    clearFormErrors(adjustForm);
  });

  document.getElementById("confirm-form")?.addEventListener("submit", submitConfirm);

  const searchInput = document.getElementById("palette-input");
  searchInput?.addEventListener("input", () => renderPalette(searchInput.value));
  searchInput?.addEventListener("keydown", handlePaletteKey);
  document.getElementById("palette-results")?.addEventListener("click", (event) => {
    const item = event.target.closest(".palette-item");
    if (item) selectPaletteProduct(Number(item.dataset.index));
  });

  document.getElementById("search-dialog")?.addEventListener("close", () => {
    const trigger = document.querySelector("[data-action='open-search']");
    if (trigger) trigger.focus();
  });
}

function wireGlobalEvents() {
  document.addEventListener("click", (event) => {
    const notificationPanel = document.getElementById("notif-panel");
    if (notificationPanel && !notificationPanel.hidden && !event.target.closest(".notif-wrap")) closeNotifications();
    const accountPanel = document.getElementById("account-panel");
    if (accountPanel && !accountPanel.hidden && !event.target.closest(".account-wrap")) closeAccountMenu();
    const rowMenu = document.getElementById("row-menu");
    if (rowMenu && !rowMenu.hidden && !event.target.closest("#row-menu") && !event.target.closest("[data-action='row-menu']")) closeRowMenu();

    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;
    if (actionElement.tagName === "A") event.preventDefault();
    handleAction(actionElement);
  });

  document.addEventListener("keydown", (event) => {
    const modifier = event.ctrlKey || event.metaKey;
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (
      target.tagName === "INPUT" ||
      target.tagName === "SELECT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    );
    if (modifier && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
      return;
    }
    if (event.key === "/" && !isTyping && !document.querySelector("dialog[open]")) {
      event.preventDefault();
      openSearch();
      return;
    }
    if (event.key === "Escape") {
      closeNotifications();
      closeAccountMenu();
      closeRowMenu();
    }
  });

  window.addEventListener("hashchange", () => {
    const nextRoute = getRouteFromHash();
    const nextCentreSlug = getCentreSlugFromHash();
    const nextItemSlug = getItemSlugFromHash();
    const nextDepartmentSlug = getDepartmentSlugFromHash();
    const changed = nextRoute !== ui.route || nextCentreSlug !== ui.centreSlug || nextItemSlug !== ui.itemSlug || nextDepartmentSlug !== ui.departmentSlug;
    ui.route = nextRoute;
    ui.centreSlug = nextCentreSlug;
    ui.itemSlug = nextItemSlug;
    ui.departmentSlug = nextDepartmentSlug;
    closeNotifications();
    closeRowMenu();
    render();
    if (changed) window.scrollTo({ top: 0, behavior: "auto" });
  });

  window.addEventListener("resize", () => {
    closeRowMenu();
    closeAccountMenu();
  });
  window.addEventListener("scroll", () => {
    closeRowMenu();
    closeAccountMenu();
  }, true);
  window.addEventListener("storage", (event) => {
    if (event.key === themeStorageKey()) {
      applyTheme(getTheme());
      return;
    }
    if (event.key === LOCK_STORAGE_KEY) {
      sectionLocks = readSectionLocks();
      render();
      return;
    }
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const next = JSON.parse(event.newValue);
      if (validState(next)) {
        state = next;
        render();
        showToast("Inventory synced", "Another tab updated the inventory data.", "info");
      }
    } catch (error) {
      console.warn("Could not sync saved stock data.", error);
    }
  });
}

function setPlatformKeyHint() {
  const labels = document.querySelectorAll("[data-kbd]");
  const isApple = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  const hint = isApple ? "⌘K" : "Ctrl K";
  labels.forEach((label) => { label.textContent = hint; });
  document.querySelector("[data-action='open-search']")?.setAttribute("aria-label", `Search stock ${hint}`);
}

let portalStarted = false;

function startPortal() {
  if (portalStarted) return;
  portalStarted = true;
  setPlatformKeyHint();
  applyTheme(getTheme());
  if (!location.hash) {
    history.replaceState(null, "", "#/overview");
  }
  ui.route = getRouteFromHash();
  ui.centreSlug = getCentreSlugFromHash();
  ui.itemSlug = getItemSlugFromHash();
  ui.departmentSlug = getDepartmentSlugFromHash();
  wireDialogs();
  wireGlobalEvents();
  render();
}

function init() {
  if (initAuth()) {
    startPortal();
    return;
  }
  document.addEventListener("auth:success", startPortal, { once: true });
}

init();
