import { motion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const STYLES: Record<Variant, string> = {
  primary: "bg-text text-surface hover:bg-[#3a3a37] border border-transparent",
  secondary: "bg-surface text-text border border-border hover:bg-surface-sunk",
  ghost:
    "bg-transparent text-text-muted hover:text-text hover:bg-surface-sunk border border-transparent",
};

interface Props extends Omit<ComponentProps<typeof motion.button>, "children"> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "secondary", className = "", children, ...rest }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${STYLES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
