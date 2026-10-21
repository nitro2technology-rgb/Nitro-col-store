import type { HTMLAttributes } from "react";

export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-block rounded-chip bg-soft px-2.5 py-1 text-xs text-ink ${className}`}
      {...props}
    />
  );
}
