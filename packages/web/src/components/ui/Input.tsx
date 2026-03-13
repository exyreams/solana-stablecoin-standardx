import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, error, ...props }, ref) => {
		return (
			<div className="w-full">
				<input
					ref={ref}
					className={cn(
						"w-full px-4 py-2 bg-[var(--bg-surface)] border text-[var(--text-main)] font-mono text-sm",
						"focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]",
						"placeholder:text-[var(--text-dark)]",
						"disabled:opacity-50 disabled:cursor-not-allowed",
						error ? "border-red-500" : "border-[var(--border-mid)]",
						className,
					)}
					{...props}
				/>
				{error && <p className="mt-1 text-xs text-red-400">{error}</p>}
			</div>
		);
	},
);

Input.displayName = "Input";

export { Input };
