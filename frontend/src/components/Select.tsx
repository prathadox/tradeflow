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
  padding: "8px 10px",
  border: `1px solid ${open ? "#09090b" : "#e4e4e7"}`,
  borderRadius: 6,
  backgroundColor: disabled ? "#fafafa" : "#ffffff",
  color: disabled ? "#a1a1aa" : "#09090b",
  fontSize: 13,
  cursor: disabled ? "not-allowed" : "pointer",
  outline: "none",
  transition: "border-color 0.12s ease",
  textAlign: "left",
  boxSizing: "border-box",
  fontFamily: "inherit",
});

const menuStyle = (top: number, left: number, width: number): CSSProperties => ({
  position: "fixed",
  top,
  left,
  width,
  maxHeight: 280,
  overflowY: "auto",
  padding: 4,
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: 8,
  boxShadow: "0 8px 24px rgba(9,9,11,0.10)",
  zIndex: 120,
});

const optionStyle = (active: boolean, selected: boolean, disabled: boolean): CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  padding: "7px 10px",
  borderRadius: 6,
  fontSize: 13,
  color: disabled ? "#a1a1aa" : "#09090b",
  backgroundColor: active ? "#f4f4f5" : "transparent",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: selected ? 600 : 400,
});

const hintStyle: CSSProperties = {
  fontSize: 11,
  color: "#a1a1aa",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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
            color: selected ? "#09090b" : "#a1a1aa",
          }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} strokeWidth={2} color="#71717a" />
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
                  color: "#a1a1aa",
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
