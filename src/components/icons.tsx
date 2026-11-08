import type { SVGProps } from "react";

export function Icon({ name, className, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg className={className ? `icon ${className}` : "icon"} aria-hidden="true" focusable="false" {...props}>
      <use href={`#${name}`} />
    </svg>
  );
}

/** Inlined once in the root layout so every icon is available without a network request. */
export function IconSprite() {
  return (
    <svg className="icon-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></symbol>
      <symbol id="i-box" viewBox="0 0 24 24"><path d="M3.3 7.5 12 2.6l8.7 4.9v9L12 21.4l-8.7-4.9v-9Z" /><path d="m3.5 7.7 8.5 4.9 8.5-4.9M12 12.6v8.8" /></symbol>
      <symbol id="i-flow" viewBox="0 0 24 24"><path d="M7 4v15m0 0-3.2-3.2M7 19l3.2-3.2M17 20V5m0 0-3.2 3.2M17 5l3.2 3.2" /></symbol>
      <symbol id="i-truck" viewBox="0 0 24 24"><path d="M3 6.5h11v10H3zM14 10h3.6l3.4 3.4v3.1h-7z" /><circle cx="7" cy="18.5" r="2" /><circle cx="17.5" cy="18.5" r="2" /></symbol>
      <symbol id="i-centre" viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-12A7 7 0 1 0 5 9c0 5.9 7 12 7 12Z" /><circle cx="12" cy="9" r="2.4" /></symbol>
      <symbol id="i-items" viewBox="0 0 24 24"><rect x="3" y="4" width="7" height="7" rx="1.4" /><rect x="14" y="4" width="7" height="7" rx="1.4" /><rect x="3" y="15" width="7" height="6" rx="1.2" /><path d="M14 16h7M14 20h7" /></symbol>
      <symbol id="i-departments" viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="5" rx="1.2" /><rect x="3" y="16" width="7" height="5" rx="1.2" /><rect x="14" y="16" width="7" height="5" rx="1.2" /><path d="M12 8v4M6.5 16v-4h11v4" /></symbol>
      <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4.5 4.5" /></symbol>
      <symbol id="i-bell" viewBox="0 0 24 24"><path d="M18 8.5a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" /><path d="M10.3 20.5a2 2 0 0 0 3.4 0" /></symbol>
      <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></symbol>
      <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" /></symbol>
      <symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></symbol>
      <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></symbol>
      <symbol id="i-check" viewBox="0 0 24 24"><path d="m4.5 12.5 5 5L20 6.5" /></symbol>
      <symbol id="i-check-circle" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></symbol>
      <symbol id="i-alert" viewBox="0 0 24 24"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4.5" /><circle cx="12" cy="17" r=".4" fill="currentColor" /></symbol>
      <symbol id="i-chevron-down" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></symbol>
      <symbol id="i-arrow-right" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></symbol>
      <symbol id="i-arrow-up-right" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9" /></symbol>
      <symbol id="i-in" viewBox="0 0 24 24"><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 21h16" /></symbol>
      <symbol id="i-out" viewBox="0 0 24 24"><path d="M12 21V9m0 0 5 5m-5-5-5 5M4 3h16" /></symbol>
      <symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 4h6m4 0h6M4 12h11m4 0h1M4 20h3m4 0h9" /><circle cx="12" cy="4" r="2" /><circle cx="17" cy="12" r="2" /><circle cx="9" cy="20" r="2" /></symbol>
      <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M20.5 8A9 9 0 1 0 21 12M21 3v5h-5" /></symbol>
      <symbol id="i-trash" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" /></symbol>
      <symbol id="i-edit" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></symbol>
      <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 2" /></symbol>
      <symbol id="i-sort" viewBox="0 0 24 24"><path d="M8 9.5 12 5l4 4.5M8 14.5 12 19l4-4.5" /></symbol>
      <symbol id="i-receipt" viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></symbol>
      <symbol id="i-scan" viewBox="0 0 24 24"><path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M8 9v6M11 9v6M14 9v6M17 9v6" /></symbol>
      <symbol id="i-logout" viewBox="0 0 24 24"><path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10M15 16l4-4-4-4M9 12h10" /></symbol>
      <symbol id="i-lock" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></symbol>
      <symbol id="i-folder" viewBox="0 0 24 24"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4l2 2.5h7A2.5 2.5 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z" /></symbol>
      <symbol id="i-document" viewBox="0 0 24 24"><path d="M6 3.5h8l4 4V20.5H6z" /><path d="M14 3.5v4h4M9 12h6M9 15.5h6M9 8.5h2" /></symbol>
      <symbol id="i-shelf" viewBox="0 0 32 32"><rect x="6" y="8" width="2.6" height="16" rx=".8" /><rect x="11" y="8" width="1.2" height="16" rx=".6" /><rect x="15" y="8" width="3.4" height="16" rx=".8" /><rect x="21" y="8" width="1.2" height="16" rx=".6" /><rect x="24.5" y="8" width="2.2" height="16" rx=".7" /></symbol>
    </svg>
  );
}
