import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
} from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const sizeStyle: Record<ButtonSize, CSSProperties> = {
  sm: { height: 28, padding: "0 10px", fontSize: 12.5, gap: 6 },
  md: { height: 34, padding: "0 14px", fontSize: 13, gap: 8 },
};

function variantStyle(v: ButtonVariant, disabled: boolean): CSSProperties {
  if (v === "primary") {
    return {
      background: disabled ? "rgba(250, 250, 250, 0.35)" : "var(--accent)",
      color: "var(--bg-canvas)",
      border: "1px solid transparent",
      fontWeight: 600,
    };
  }
  if (v === "secondary") {
    return {
      background: "var(--bg-elev)",
      color: "var(--text)",
      border: "1px solid var(--border)",
    };
  }
  if (v === "danger") {
    return {
      background: "rgba(255,107,107,0.14)",
      color: "var(--danger)",
      border: "1px solid rgba(255,107,107,0.32)",
    };
  }
  return {
    background: "transparent",
    color: "var(--text)",
    border: "1px solid transparent",
  };
}

export default function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  leadingIcon,
  trailingIcon,
  fullWidth,
  children,
  disabled,
  style,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const merged: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    fontWeight: 500,
    letterSpacing: "-0.1px",
    borderRadius: "var(--radius-sm)",
    cursor: isDisabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
    transition:
      "background-color var(--dur-fast), border-color var(--dur-fast), color var(--dur-fast), transform var(--dur-fast)",
    opacity: isDisabled ? 0.65 : 1,
    width: fullWidth ? "100%" : undefined,
    ...sizeStyle[size],
    ...variantStyle(variant, !!isDisabled),
    ...style,
  };

  return (
    <button
      {...rest}
      disabled={isDisabled}
      className={`fp-btn fp-btn-${variant} ${className ?? ""}`.trim()}
      style={merged}
    >
      {loading ? (
        <Loader2
          size={14}
          style={{ animation: "flowpay-spin 0.9s linear infinite" }}
        />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
}
