import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const STYLES: Record<Variant, string> = {
  primary: "bg-text text-surface hover:bg-[#3a3a37] active:scale-[0.98] border border-transparent",
  secondary: "bg-surface text-text border border-border hover:bg-surface-sunk active:scale-[0.98]",
  ghost:
    "bg-transparent text-text-muted hover:text-text hover:bg-surface-sunk border border-transparent",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "secondary", className = "", children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-[background-color,transform] duration-150 disabled:pointer-events-none disabled:opacity-40 ${STYLES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
