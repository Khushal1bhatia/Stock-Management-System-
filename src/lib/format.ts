const usd0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usd2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const number0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dateFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fullDateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short" });

export function money(cents: number, decimals: 0 | 2 = 0) {
  return (decimals === 2 ? usd2 : usd0).format((Number(cents) || 0) / 100);
}

export function num(value: number) {
  return number0.format(Number(value) || 0);
}

export function plural(count: number, singular: string, pluralForm?: string) {
  return Number(count) === 1 ? singular : pluralForm || `${singular}s`;
}

export function formatDateLong(date: Date = new Date()) {
  return dateFmt.format(date);
}

export function formatDateShort(value: string | Date) {
  return shortDateFmt.format(new Date(value));
}

export function formatFullDate(value: string | Date) {
  return fullDateFmt.format(new Date(value));
}

export function formatTime(value: string | Date) {
  return timeFmt.format(new Date(value));
}

export function relativeWhen(value: string | Date) {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfThat) / 86400000);

  let day: string;
  if (dayDiff === 0) day = "Today";
  else if (dayDiff === 1) day = "Yesterday";
  else if (dayDiff > 1 && dayDiff < 7) day = weekdayFmt.format(date);
  else day = formatDateShort(date);

  return `${day}, ${formatTime(date)}`;
}

export function signedQty(qty: number, type: string) {
  const value = Number(qty);
  if (type === "out") return `−${num(Math.abs(value))}`;
  if (type === "adjust") return value > 0 ? `+${num(value)}` : `−${num(Math.abs(value))}`;
  return `+${num(Math.abs(value))}`;
}

export function qtyClass(type: string) {
  if (type === "in") return "qty-in";
  if (type === "adjust") return "qty-adjust";
  return "qty-out";
}

export function movementLabel(type: string) {
  if (type === "in") return "Received";
  if (type === "out") return "Dispatched";
  return "Adjusted";
}

export function movementIcon(type: string) {
  if (type === "in") return "i-in";
  if (type === "out") return "i-out";
  return "i-sliders";
}
