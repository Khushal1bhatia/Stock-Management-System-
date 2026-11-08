export const CATEGORIES = ["Audio", "Workspace", "Accessories", "Lighting", "Storage"] as const;
export type Category = (typeof CATEGORIES)[number];

export const UNITS = ["pcs", "sets", "pairs", "boxes", "packs"] as const;
export type Unit = (typeof UNITS)[number];

export const ROLES = ["ADMIN", "OPERATOR"] as const;
export type Role = (typeof ROLES)[number];

export const MOVEMENT_TYPES = ["in", "out", "adjust"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const STOCK_STATUSES = ["healthy", "low", "out"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const SESSION_COOKIE = "stockroom_session";
export const SESSION_TTL_DAYS = 7;
export const PAGE_SIZE = 25;
export const LOGIN_RATE_LIMIT = 8;
export const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;

export const INVENTORY_SORTS = ["name", "price", "stock", "updated"] as const;
export type InventorySort = (typeof INVENTORY_SORTS)[number];
