import type { CSSProperties, ReactNode } from "react";

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
}

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.9px",
  color: "var(--text-muted)",
};

const hintStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--text-dim)",
  lineHeight: 1.45,
};

const errorStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--danger)",
  lineHeight: 1.45,
};

export default function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  required,
}: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label htmlFor={htmlFor} style={labelStyle}>
          {label}
          {required && (
            <span style={{ color: "var(--accent)", marginLeft: 4 }}>*</span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <div style={errorStyle}>{error}</div>
      ) : hint ? (
        <div style={hintStyle}>{hint}</div>
      ) : null}
    </div>
  );
}
