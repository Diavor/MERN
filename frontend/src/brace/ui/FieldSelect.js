import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";
import Portal from "./Portal";
import "./FieldSelect.scss";

// React 17 has no useId (React 18+). This app is a client-only SPA, so a
// module-scoped counter gives stable, unique ids without the hydration concerns
// useId exists to solve. Assigned once per mount via a ref.
let autoIdSeq = 0;
const useAutoId = () => {
  const ref = useRef(null);
  if (ref.current === null) ref.current = `fs-${(autoIdSeq += 1)}`;
  return ref.current;
};

const PANEL_MAX_H = 320;

// Reusable design-system select for the whole app. Renders a custom listbox
// (not a native <select>) so the open panel is fully styled — full-width rows,
// hover, a highlighted selected row with a check, and a caret that flips up
// when open. The panel is portalled to <body> with fixed positioning so it is
// never clipped by a scroll container / modal / transformed ancestor. Keyboard
// + screen-reader accessible (ARIA 1.2 select-only combobox pattern).
//
// options: array of strings, or { value, label, disabled } objects.
const FieldSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  hint,
  disabled = false,
  required = false,
  name,
  id,
  size = "md", // "sm" | "md"
  variant = "field", // "field" (boxy form) | "pill" (rounded toolbar)
  className = "",
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pos, setPos] = useState(null); // { left, top, width, maxHeight, openUp }

  const autoId = useAutoId();
  const baseId = id || autoId;
  const listId = `${baseId}-list`;
  const errorId = error ? `${baseId}-err` : undefined;
  const optionId = (i) => `${baseId}-opt-${i}`;

  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const optionRefs = useRef([]);

  // Normalise to { value, label, disabled }.
  const items = useMemo(
    () =>
      options.map((o) =>
        typeof o === "object"
          ? { value: o.value, label: o.label, disabled: !!o.disabled }
          : { value: o, label: o, disabled: false }
      ),
    [options]
  );

  const selectedIndex = items.findIndex((o) => String(o.value) === String(value));
  const selected = selectedIndex >= 0 ? items[selectedIndex] : null;
  const hasValue = selected != null;

  const firstEnabled = () => items.findIndex((o) => !o.disabled);
  const step = (from, dir) => {
    const n = items.length;
    for (let k = 1; k <= n; k += 1) {
      const i = (from + dir * k + n * k) % n;
      if (!items[i].disabled) return i;
    }
    return from;
  };

  // Measure the trigger and place the fixed panel below it, flipping above when
  // there isn't room. Called on open and on scroll/resize while open.
  const reposition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 6;
    const spaceBelow = window.innerHeight - r.bottom - gap;
    const spaceAbove = r.top - gap;
    const openUp = spaceBelow < Math.min(PANEL_MAX_H, 200) && spaceAbove > spaceBelow;
    const maxHeight = Math.min(PANEL_MAX_H, Math.max(120, openUp ? spaceAbove : spaceBelow));
    setPos({
      left: r.left,
      width: r.width,
      top: openUp ? undefined : r.bottom + gap,
      bottom: openUp ? window.innerHeight - r.top + gap : undefined,
      maxHeight,
      openUp,
    });
  }, []);

  const openPanel = useCallback(() => {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled());
    reposition();
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, selectedIndex, items, reposition]);

  const closePanel = useCallback((refocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (refocus && triggerRef.current) triggerRef.current.focus();
  }, []);

  const choose = (i) => {
    const item = items[i];
    if (!item || item.disabled) return;
    onChange(item.value);
    closePanel();
  };

  // Reposition (capture inner scrolls too) + close on outside interaction.
  useLayoutEffect(() => {
    if (!open) return undefined;
    const onScrollOrResize = () => reposition();
    const onDocDown = (e) => {
      const t = e.target;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("mousedown", onDocDown);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("mousedown", onDocDown);
    };
  }, [open, reposition]);

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = optionRefs.current[activeIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const onKeyDown = (e) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openPanel();
        else setActiveIndex((i) => step(i < 0 ? -1 : i, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openPanel();
        else setActiveIndex((i) => step(i < 0 ? firstEnabled() : i, -1));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(firstEnabled());
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActiveIndex(step(0, -1));
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) openPanel();
        else if (activeIndex >= 0) choose(activeIndex);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          // Don't let a host modal/drawer also handle Escape and close itself —
          // the first Escape only dismisses the dropdown.
          e.stopPropagation();
          closePanel();
        }
        break;
      case "Tab":
        if (open) setOpen(false);
        break;
      default:
        break;
    }
  };

  const rootCls =
    "field-select" +
    (variant === "pill" ? " field-select--pill" : "") +
    (size === "sm" ? " field-select--sm" : "") +
    (open ? " is-open" : "") +
    (error ? " is-error" : "") +
    (disabled ? " is-disabled" : "") +
    (!hasValue ? " is-placeholder" : "") +
    (className ? " " + className : "");

  const panelStyle = pos
    ? {
        left: pos.left,
        top: pos.top,
        bottom: pos.bottom,
        width: pos.width,
        maxHeight: pos.maxHeight,
      }
    : { visibility: "hidden" };

  return (
    <div className={rootCls}>
      {label && (
        <label htmlFor={baseId} className="field-select__label">
          <span>{label}</span>
          {hint && <span className="field-select__hint">{hint}</span>}
        </label>
      )}

      <div className="field-select__box">
        <button
          type="button"
          id={baseId}
          name={name}
          ref={triggerRef}
          className="field-select__native"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-label={!label ? ariaLabel : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          aria-required={required || undefined}
          onClick={() => (open ? closePanel() : openPanel())}
          onKeyDown={onKeyDown}
        >
          <span className="field-select__value">
            {hasValue ? selected.label : placeholder}
          </span>
          <span className="field-select__caret" aria-hidden="true" />
        </button>

        {open && (
          <Portal>
            <ul
              id={listId}
              ref={panelRef}
              style={panelStyle}
              className={
                "field-select__panel no-scrollbar" +
                (variant === "pill" ? " field-select--pill" : "") +
                (size === "sm" ? " field-select--sm" : "") +
                (pos?.openUp ? " is-up" : "")
              }
              role="listbox"
              aria-label={label || ariaLabel}
              tabIndex={-1}
            >
              {items.map((o, i) => {
                const isSelected = i === selectedIndex;
                const isActive = i === activeIndex;
                return (
                  <li
                    key={String(o.value) + i}
                    id={optionId(i)}
                    ref={(el) => (optionRefs.current[i] = el)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={o.disabled || undefined}
                    className={
                      "field-select__option" +
                      (isSelected ? " is-selected" : "") +
                      (isActive ? " is-active" : "") +
                      (o.disabled ? " is-disabled" : "")
                    }
                    onMouseEnter={() => !o.disabled && setActiveIndex(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(i)}
                  >
                    <span className="field-select__option-label">{o.label}</span>
                    {isSelected && (
                      <Icon.check className="field-select__option-check" />
                    )}
                  </li>
                );
              })}
            </ul>
          </Portal>
        )}
      </div>

      {error && (
        <div id={errorId} className="field-select__error" role="alert">
          ↳ {error}
        </div>
      )}
    </div>
  );
};

export default FieldSelect;
