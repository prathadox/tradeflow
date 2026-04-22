import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

const triggerStyle = (open: boolean, disabled: boolean): CSSProperties => ({
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  height: 34,
  padding: "0 10px",
  border: `1px solid ${open ? "var(--accent)" : "var(--border)"}`,
  borderRadius: "var(--radius-sm)",
  backgroundColor: disabled ? "var(--bg-panel)" : "var(--bg-sunken)",
  color: disabled ? "var(--text-dim)" : "var(--text)",
  fontSize: 13,
  cursor: disabled ? "not-allowed" : "pointer",
  outline: "none",
  transition: "border-color var(--dur-fast), background-color var(--dur-fast)",
  textAlign: "left",
  boxSizing: "border-box",
  fontFamily: "inherit",
  boxShadow: open ? "0 0 0 3px var(--accent-ring)" : "none",
});

const menuStyle = (top: number, left: number, width: number): CSSProperties => ({
  position: "fixed",
  top,
  left,
  width,
  maxHeight: 280,
  overflowY: "auto",
  padding: 4,
  backgroundColor: "var(--bg-elev)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-pop)",
  zIndex: 120,
  animation: "flowpay-fade-in 140ms var(--ease-out)",
});

const optionStyle = (active: boolean, selected: boolean, disabled: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "8px 10px",
  borderRadius: "var(--radius-xs)",
  fontSize: 13,
  color: disabled ? "var(--text-dim)" : "var(--text)",
  backgroundColor: active ? "var(--bg-hover)" : "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: selected ? 600 : 400,
});

const hintStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--text-dim)",
  fontFamily: "var(--font-mono)",
};

export default function Select({
  value,
  options,
  onChange,
  placeholder = "Select…",
  disabled = false,
  id,
  ariaLabel,
}: SelectProps): ReactNode {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  const updateRect = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateRect();
    const onScroll = () => updateRect();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updateRect]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        menuRef.current?.contains(t) ||
        triggerRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [open, options, value]);

  const commit = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      if (!open) {
        e.preventDefault();
        setOpen(true);
        return;
      }
    }
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, (i < 0 ? -1 : i) + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, (i < 0 ? options.length : i) - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt) commit(opt);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        style={triggerStyle(open, disabled)}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: selected ? "var(--text)" : "var(--text-dim)",
          }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} strokeWidth={2} color="var(--text-muted)" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={menuStyle(rect.top, rect.left, rect.width)}
          >
            {options.length === 0 ? (
              <div
                style={{
                  padding: "10px 12px",
                  fontSize: 12.5,
                  color: "var(--text-dim)",
                }}
              >
                No options
              </div>
            ) : (
              options.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(opt);
                    }}
                    style={optionStyle(isActive, isSelected, !!opt.disabled)}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isSelected && <Check size={12} strokeWidth={2.5} />}
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {opt.label}
                      </span>
                    </span>
                    {opt.hint && <span style={hintStyle}>{opt.hint}</span>}
                  </div>
                );
              })
            )}
          </div>,
          document.body
        )}
    </>
  );
}
