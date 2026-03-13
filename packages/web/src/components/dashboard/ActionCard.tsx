import type { FC } from "react";
import { Badge } from "../ui/Badge";

interface ActionCardProps {
	label: string;
	description: string;
	variant?: "default" | "mint" | "burn";
	badge?: string;
	amount?: string;
	count?: string;
	lastAction?: string;
	onClick?: () => void;
}

export const ActionCard: FC<ActionCardProps> = ({
	label,
	description,
	variant = "default",
	badge,
	amount,
	count,
	lastAction,
	onClick,
}) => {
	const borderClass =
		variant === "mint"
			? "border-l-4 border-l-(--accent-primary)"
			: variant === "burn"
				? "border-l-4 border-l-[#ff4444] border-dashed"
				: "";

	const labelColor = variant === "burn" ? "text-[#ff4444]" : "";

	return (
		<div
			className={`bg-(--bg-panel) border border-(--border-mid) p-4 cursor-pointer transition-all hover:border-(--accent-primary) hover:bg-(--bg-surface) flex flex-col justify-between min-h-[120px] ${borderClass}`}
			onClick={onClick}
		>
			<div className="flex justify-between items-start mb-2">
				<div
					className={`text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider ${labelColor}`}
				>
					{label}
				</div>
				{badge && (
					<Badge variant="accent" className="text-[7px]">
						{badge}
					</Badge>
				)}
			</div>

			{amount && (
				<div className="font-mono text-lg text-(--text-main) mb-1">
					{amount}
				</div>
			)}

			{count && (
				<div className="font-mono text-[10px] text-(--text-dim) mb-2">
					{count}
				</div>
			)}

			<div className="font-mono text-[9px] text-(--text-dim)">
				{description}
			</div>

			{lastAction && (
				<div className="font-mono text-[8px] text-(--text-dark) mt-2 pt-2 border-t border-(--border-dim)">
					{lastAction}
				</div>
			)}
		</div>
	);
};
