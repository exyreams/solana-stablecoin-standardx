import { TrendingDown, TrendingUp } from "lucide-react";
import type { FC } from "react";

interface SupplyOverviewProps {
	metrics: {
		totalSupply: string;
		minted24h: string;
		burned24h: string;
		netChange24h: string;
	};
}

export const SupplyOverview: FC<SupplyOverviewProps> = ({ metrics }) => {
	const items = [
		{
			label: "Current Supply",
			value: metrics.totalSupply,
			trend: "stable",
		},
		{
			label: "24H Minted",
			value: metrics.minted24h,
			trend: "up",
		},
		{
			label: "24H Burned",
			value: metrics.burned24h,
			trend: "down",
		},
		{
			label: "Net Change",
			value: metrics.netChange24h,
			trend: metrics.netChange24h.startsWith("+") ? "up" : "down",
		},
	];

	return (
		<div className="grid grid-cols-4 gap-4">
			{items.map((metric) => (
				<div
					key={metric.label}
					className="bg-(--bg-panel) border border-(--border-mid) p-4"
				>
					<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-2">
						{metric.label}
					</div>
					<div className="text-2xl font-mono font-light text-(--text-main) mb-1">
						{metric.value}
					</div>
					<div
						className={`flex items-center gap-1 text-xs font-mono ${
							metric.trend === "up"
								? "text-[#00ff88]"
								: metric.trend === "down"
									? "text-[#ff4444]"
									: "text-(--text-dim)"
						}`}
					>
						{metric.trend === "up" && <TrendingUp className="w-3 h-3" />}
						{metric.trend === "down" && <TrendingDown className="w-3 h-3" />}
						<span>
							{metric.label === "Current Supply" ? "LIVE" : "LAST 24H"}
						</span>
					</div>
				</div>
			))}
		</div>
	);
};
