import type { CSSProperties, ReactNode } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  items: TabItem<T>[];
  style?: CSSProperties;
}

export default function Tabs<T extends string>({
  value,
  onChange,
  items,
  style,
}: TabsProps<T>) {
  const barStyle: CSSProperties = {
    display: "flex",
    gap: 2,
    borderBottom: "1px solid var(--border)",
    padding: "0 8px",
    ...style,
  };
  const tabStyle = (active: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: active ? "var(--text)" : "var(--text-muted)",
    borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
    marginBottom: -1,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    letterSpacing: "-0.1px",
    transition: "color var(--dur-fast)",
  });
  return (
    <div style={barStyle} role="tablist">
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          style={tabStyle(value === it.value)}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}
