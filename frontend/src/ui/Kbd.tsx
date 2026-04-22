import type { CSSProperties, ReactNode } from "react";

export default function Kbd({ children }: { children: ReactNode }) {
  const s: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 20,
    height: 20,
    padding: "0 5px",
    fontFamily: "var(--font-mono)",
    fontSize: 10.5,
    fontWeight: 500,
    color: "var(--text-muted)",
    background: "var(--bg-sunken)",
    border: "1px solid var(--border)",
    borderBottomWidth: 2,
    borderRadius: 4,
  };
  return <kbd style={s}>{children}</kbd>;
}
