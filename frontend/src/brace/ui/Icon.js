import React from "react";

// Inline SVG icon set from the Grani Antichi design system
const Icon = {
  bag: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  user: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  ),
  search: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  close: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  menu: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  arrow: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  minus: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M5 12h14" />
    </svg>
  ),
  plus: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  star: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="m12 2 3 7 7 .7-5.3 4.7L18 22l-6-3.5L6 22l1.3-7.6L2 9.7 9 9z" />
    </svg>
  ),
  heart: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M12 21s-7-4.5-9-9c-1.3-3 .7-6 4-6 2 0 3.5 1.2 5 3 1.5-1.8 3-3 5-3 3.3 0 5.3 3 4 6-2 4.5-9 9-9 9z" />
    </svg>
  ),
  check: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  ),
  flame: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M12 3s4 4 4 8a4 4 0 1 1-8 0c0-1 .5-2 1-3 0 2 1 3 2 3 0-3-1-5 1-8z" />
    </svg>
  ),
  leaf: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}>
      <path d="M20 4c0 8-5 14-13 14C5 18 4 13 4 11c0-3 2-7 8-7 4 0 8 0 8 0z" />
      <path d="M4 20c4-4 8-8 16-16" />
    </svg>
  ),
};

// Brand mark — geometric ember/flame in a circle
export function Mark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" stroke="var(--gold)" strokeWidth="1" />
      <path
        d="M20 9 C24 14, 26 17, 26 22 C26 26, 23 29, 20 29 C17 29, 14 26, 14 22 C14 19, 16 17, 17 19 C17 16, 18 13, 20 9 Z"
        fill="var(--accent)"
        opacity="0.95"
      />
      <circle cx="20" cy="23" r="3" fill="var(--gold)" />
    </svg>
  );
}

export default Icon;
