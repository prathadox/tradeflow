import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(6, 8, 12, 0.72)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 100,
  animation: "flowpay-fade-in 160ms var(--ease-out)",
};

const headerStyle: CSSProperties = {
  padding: "16px 18px 12px 18px",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};

const titleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: "var(--text)",
  letterSpacing: "-0.2px",
  lineHeight: 1.3,
};

const descStyle: CSSProperties = {
  fontSize: 12.5,
  color: "var(--text-muted)",
  lineHeight: 1.5,
  marginTop: 4,
};

const bodyStyle: CSSProperties = {
  padding: "4px 18px 18px 18px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const footerStyle: CSSProperties = {
  padding: "12px 18px 16px 18px",
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
  borderTop: "1px solid var(--hairline)",
};

const closeBtnStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: "var(--radius-sm)",
  background: "transparent",
  color: "var(--text-muted)",
  border: "1px solid transparent",
  cursor: "pointer",
  flexShrink: 0,
  transition: "background-color var(--dur-fast), color var(--dur-fast)",
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 460,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && dialogRef.current) {
      const focusable = dialogRef.current.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
      );
      focusable?.focus();
    }
  }, [open]);

  if (!open) return null;

  const dialogStyle: CSSProperties = {
    width,
    maxWidth: "calc(100% - 32px)",
    maxHeight: "calc(100vh - 80px)",
    overflowY: "auto",
    background: "var(--bg-panel)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-pop)",
    animation: "flowpay-modal-in 160ms var(--ease-out)",
  };

  return createPortal(
    <div style={overlayStyle} onMouseDown={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        style={dialogStyle}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {(title || description) && (
          <div style={headerStyle}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {title && <div style={titleStyle}>{title}</div>}
              {description && <div style={descStyle}>{description}</div>}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              style={closeBtnStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
