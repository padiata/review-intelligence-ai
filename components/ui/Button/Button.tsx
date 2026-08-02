"use client";

import "./Button.css";

type Variant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`ri-button ri-button-${variant} ${className}`}
    >
      {children}
    </button>
  );
}