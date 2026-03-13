import type { FC, ReactNode } from "react";

interface MetricCardProps {
	label: string;
	value: string | ReactNode;
	subtitle?: string | ReactNode;
	valueColor?: string;
}

export const MetricCard: FC<MetricCardProps> = ({
	label,
	value,
	subtitle,
	valueColor,
}) => {
	return (
		<div className="p-4 border border-(--border-dim) bg-(--bg-panel) relative">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
				{label}
			</div>
			<div
				className={`text-[26px] font-light font-mono mt-2 ${valueColor || ""}`}
			>
				{value}
			</div>
			{subtitle && <div className="font-mono text-[10px] mt-1">{subtitle}</div>}
		</div>
	);
};
