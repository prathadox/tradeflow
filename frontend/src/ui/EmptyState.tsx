import type { CSSProperties, ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  body,
  action,
  compact,
}: EmptyStateProps) {
  const wrap: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: compact ? "20px 16px" : "36px 20px",
    textAlign: "center",
    color: "var(--text-muted)",
  };
  const iconWrap: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: compact ? 32 : 40,
    height: compact ? 32 : 40,
    borderRadius: "var(--radius-md)",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    color: "var(--text-dim)",
    marginBottom: 4,
  };
  return (
    <div style={wrap}>
      {icon && <div style={iconWrap}>{icon}</div>}
      {title && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.1px",
          }}
        >
          {title}
        </div>
      )}
      {body && (
        <div
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            lineHeight: 1.5,
            maxWidth: 280,
          }}
        >
          {body}
        </div>
      )}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}
