import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  dot?: "mint" | "amber" | "red" | "violet" | "blue" | null;
  mono?: boolean;
}

export default function Chip({
  leadingIcon,
  trailingIcon,
  dot,
  mono,
  children,
  style,
  ...rest
}: ChipProps) {
  const merged: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text)",
    background: "var(--bg-elev)",
    border: "1px solid var(--border)",
    cursor: rest.onClick ? "pointer" : "default",
    fontFamily: mono ? "var(--font-mono)" : "inherit",
    transition: "background-color var(--dur-fast), border-color var(--dur-fast)",
    whiteSpace: "nowrap",
    ...style,
  };
  const dotColor =
    dot === "red"
      ? "var(--danger)"
      : dot === "mint" || dot === "violet" || dot === "amber" || dot === "blue"
      ? "var(--text)"
      : null;
  return (
    <button {...rest} style={merged} type={rest.type ?? "button"}>
      {dotColor && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 0 3px ${dotColor}22`,
            flexShrink: 0,
          }}
        />
      )}
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
