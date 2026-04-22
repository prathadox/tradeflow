import type { CSSProperties } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToast, type ToastTone } from "./toastStore";

const toneStyle: Record<
  ToastTone,
  { border: string; fg: string; bg: string; icon: JSX.Element }
> = {
  success: {
    border: "var(--border-strong)",
    fg: "var(--text)",
    bg: "var(--bg-elev)",
    icon: <CheckCircle2 size={14} />,
  },
  error: {
    border: "rgba(248, 113, 113, 0.4)",
    fg: "var(--danger)",
    bg: "var(--bg-elev)",
    icon: <AlertCircle size={14} />,
  },
  info: {
    border: "var(--border)",
    fg: "var(--text-muted)",
    bg: "var(--bg-elev)",
    icon: <Info size={14} />,
  },
};

const containerStyle: CSSProperties = {
  position: "fixed",
  top: 64,
  right: 18,
  zIndex: 200,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  pointerEvents: "none",
};

export default function Toaster() {
  const items = useToast((s) => s.items);
  const dismiss = useToast((s) => s.dismiss);

  return (
    <div style={containerStyle}>
      {items.map((t) => {
        const tone = toneStyle[t.tone];
        const itemStyle: CSSProperties = {
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          maxWidth: 380,
          padding: "10px 12px",
          background: "var(--bg-elev)",
          border: `1px solid ${tone.border}`,
          borderLeft: `3px solid ${tone.fg}`,
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lift)",
          color: "var(--text)",
          fontSize: 12.5,
          lineHeight: 1.45,
          pointerEvents: "auto",
          animation: "flowpay-fade-in 160ms var(--ease-out)",
        };
        return (
          <div key={t.id} style={itemStyle}>
            <span style={{ color: tone.fg, flexShrink: 0, marginTop: 1 }}>
              {tone.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>{t.text}</div>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: 2,
                flexShrink: 0,
                marginTop: 1,
              }}
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
