import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	variant?: "default" | "success" | "warning" | "danger" | "info" | "accent";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
	({ className, variant = "default", children, ...props }, ref) => {
		const variants = {
			default: "bg-(--bg-surface) text-(--text-main) border-(--border-mid)",
			success: "bg-green-900/30 text-green-400 border-green-700",
			warning: "bg-yellow-900/30 text-yellow-400 border-yellow-700",
			danger: "bg-red-900/30 text-red-400 border-red-700",
			info: "bg-blue-900/30 text-blue-400 border-blue-700",
			accent: "border-(--accent-primary) text-(--accent-primary)",
		};

		return (
			<span
				ref={ref}
				className={cn(
					"inline-flex items-center px-2.5 py-0.5 text-xs font-mono font-semibold border uppercase tracking-wide",
					variants[variant],
					className,
				)}
				{...props}
			>
				{children}
			</span>
		);
	},
);

Badge.displayName = "Badge";

export { Badge };
