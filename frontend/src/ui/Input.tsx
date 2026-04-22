import {
  forwardRef,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  leadingAdornment?: ReactNode;
  trailingAdornment?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    invalid,
    leadingAdornment,
    trailingAdornment,
    style,
    className,
    ...rest
  },
  ref
) {
  const wrapperStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    height: 34,
    padding: "0 10px",
    background: "var(--bg-sunken)",
    border: `1px solid ${invalid ? "var(--danger)" : "var(--border)"}`,
    borderRadius: "var(--radius-sm)",
    transition: "border-color var(--dur-fast), background-color var(--dur-fast)",
    width: "100%",
    boxSizing: "border-box",
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text)",
    fontSize: 13,
    lineHeight: 1.2,
    padding: 0,
    ...style,
  };

  return (
    <label
      className={`fp-input ${invalid ? "fp-input-invalid" : ""} ${
        className ?? ""
      }`.trim()}
      style={wrapperStyle}
    >
      {leadingAdornment && (
        <span
          style={{
            display: "inline-flex",
            color: "var(--text-dim)",
            flexShrink: 0,
          }}
        >
          {leadingAdornment}
        </span>
      )}
      <input ref={ref} {...rest} style={inputStyle} />
      {trailingAdornment && (
        <span
          style={{
            display: "inline-flex",
            color: "var(--text-dim)",
            flexShrink: 0,
          }}
        >
          {trailingAdornment}
        </span>
      )}
    </label>
  );
});

export default Input;
