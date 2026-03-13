import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "ghost" | "danger";
	size?: "sm" | "md" | "lg";
	isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = "primary",
			size = "md",
			isLoading,
			children,
			...props
		},
		ref,
	) => {
		const baseStyles =
			"font-mono font-semibold cursor-pointer border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

		const variants = {
			primary:
				"bg-[var(--accent-primary)] text-black border-transparent hover:bg-[var(--accent-active)] hover:shadow-[0_0_15px_var(--accent-glow)]",
			secondary:
				"border-[var(--accent-primary)] text-[var(--accent-primary)] bg-transparent hover:bg-[var(--accent-primary)] hover:text-black hover:shadow-[0_0_15px_var(--accent-glow)]",
			ghost:
				"border-transparent text-[var(--text-dim)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-surface)]",
			danger: "bg-red-600 text-white border-transparent hover:bg-red-700",
		};

		const sizes = {
			sm: "px-3 py-1.5 text-xs",
			md: "px-6 py-3 text-sm",
			lg: "px-8 py-4 text-base",
		};

		return (
			<button
				ref={ref}
				disabled={props.disabled || isLoading}
				className={cn(baseStyles, variants[variant], sizes[size], className)}
				{...props}
			>
				{isLoading && (
					<div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
				)}
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";

export { Button };
