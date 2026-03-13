import type { FC } from "react";

interface SupplyStatsProps {
	stats: {
		totalHolders: number;
		avgBalance: string;
		medianBalance: string;
		gini: string;
	};
}

export const SupplyStats: FC<SupplyStatsProps> = ({ stats }) => {
	const totalHolders = stats?.totalHolders || 0;
	const avgBalance = stats?.avgBalance || "0.00";
	const medianBalance = stats?.medianBalance || "0.00";
	const gini = stats?.gini || "0.0000";

	return (
		<div className="grid grid-cols-4 gap-4 mb-2">
			<div className="bg-(--bg-panel) border border-(--border-dim) p-4">
				<div className="text-[9px] uppercase text-(--text-dim) font-bold tracking-widest mb-2">
					Total Holders
				</div>
				<div className="text-[22px] font-mono font-light text-(--text-main)">
					{totalHolders.toLocaleString()}
				</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-dim) p-4">
				<div className="text-[9px] uppercase text-(--text-dim) font-bold tracking-widest mb-2">
					Average Balance
				</div>
				<div className="text-[22px] font-mono font-light text-(--text-main)">
					{avgBalance}{" "}
					<span className="text-[10px] text-(--text-dim)">USDC</span>
				</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-dim) p-4">
				<div className="text-[9px] uppercase text-(--text-dim) font-bold tracking-widest mb-2">
					Median Balance
				</div>
				<div className="text-[22px] font-mono font-light text-(--text-main)">
					{medianBalance}{" "}
					<span className="text-[10px] text-(--text-dim)">USDC</span>
				</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-dim) p-4">
				<div className="text-[9px] uppercase text-(--text-dim) font-bold tracking-widest mb-2">
					Gini Coefficient
				</div>
				<div className="flex flex-col">
					<div className="text-[22px] font-mono font-light text-(--accent-primary)">
						{gini}
					</div>
					<div className="h-[4px] bg-(--border-mid) w-[100px] mt-2.5 relative">
						<div
							className="h-full bg-(--accent-primary)"
							style={{ width: `${Math.min(100, Number(gini) * 100)}%` }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
