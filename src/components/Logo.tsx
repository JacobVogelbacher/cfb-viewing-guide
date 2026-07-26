import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const logoVariants = cva(
  "flex items-center font-black tracking-tight",
  {
    variants: {
      size: {
        default: "gap-2",
        sm: "gap-1.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const badgeVariants = cva(
  "flex items-center justify-center rounded-lg bg-emerald-700 text-white",
  {
    variants: {
      size: {
        default: "h-8 w-8 text-sm",
        sm: "h-6 w-6 rounded-md text-[0.65rem]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const wordmarkVariants = cva("text-zinc-900", {
  variants: {
    size: {
      default: "text-base",
      sm: "text-sm",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export function Logo({
  size = "default",
  className,
}: VariantProps<typeof logoVariants> & { className?: string }) {
  return (
    <div className={cn(logoVariants({ size }), className)}>
      <span className={badgeVariants({ size })}>CFB</span>
      <span className={wordmarkVariants({ size })}>TV Guide</span>
    </div>
  );
}
