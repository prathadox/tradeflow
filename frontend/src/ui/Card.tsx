import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  elevated?: boolean;
  padding?: number | string;
  style?: CSSProperties;
  className?: string;
}

export default function Card({
  children,
  elevated,
  padding = 16,
  style,
  className,
}: CardProps) {
  const merged: CSSProperties = {
    background: elevated ? "var(--bg-elev)" : "var(--bg-panel)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    boxShadow: elevated ? "var(--shadow-lift)" : undefined,
    padding,
    ...style,
  };
  return (
    <div className={className} style={merged}>
      {children}
    </div>
  );
}
