import crypto from "crypto";

export const createDisplayId = (prefix) => {
  return `${prefix}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const isValidTimezone = (timezone) => {
  if (!timezone || typeof timezone !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
};

export const isValidCurrencyCode = (currency) =>
  typeof currency === "string" && /^[A-Z]{3}$/.test(currency);

export const parsePage = (value, fallback = 1) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseLimit = (value, fallback = 10, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

export const buildPagination = (total, page, limit) => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { page, limit, total, totalPages };
};

export const applyListQuery = (
  rows,
  {
    search = "",
    searchFields = [],
    filters = {},
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = {},
) => {
  let items = [...rows];
  const normalizedSearch = String(search || "").trim().toLowerCase();

  if (normalizedSearch && searchFields.length) {
    items = items.filter((row) =>
      searchFields.some((field) => {
        const value = row?.[field];
        return String(value ?? "").toLowerCase().includes(normalizedSearch);
      }),
    );
  }

  Object.entries(filters).forEach(([field, allowed]) => {
    if (allowed === undefined || allowed === null || allowed === "" || allowed === "all") {
      return;
    }

    if (Array.isArray(allowed)) {
      items = items.filter((row) => allowed.includes(row?.[field]));
      return;
    }

    items = items.filter((row) => String(row?.[field]) === String(allowed));
  });

  items.sort((left, right) => {
    const a = left?.[sortBy];
    const b = right?.[sortBy];
    const direction = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

    const aNum = Number(a);
    const bNum = Number(b);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
      return (aNum - bNum) * direction;
    }

    return String(a ?? "").localeCompare(String(b ?? "")) * direction;
  });

  const total = items.length;
  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 10;
  const start = (safePage - 1) * safeLimit;
  const paged = items.slice(start, start + safeLimit);

  return {
    items: paged,
    pagination: buildPagination(total, safePage, safeLimit),
  };
};

export const getDateRangeBounds = (range = "30d") => {
  const now = new Date();
  const days = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "1y": 365,
  }[range] || 30;

  const start = new Date(now);
  start.setDate(start.getDate() - days);

  const previousEnd = new Date(start);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days);

  return { start, end: now, previousStart, previousEnd, days };
};

export const toIsoDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

export const formatTimeAgo = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

export const monthKey = (date) => {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString().slice(0, 7);
};

export const monthLabel = (dateKey) => {
  const date = new Date(`${dateKey}-01T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(date);
};

