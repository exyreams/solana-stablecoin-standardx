import { type FC } from "react";
import { useTokens } from "../../contexts/TokenContext";
import type { ComplianceStats as StatsType } from "../../hooks/useCompliance";
import { Badge } from "../ui/Badge";

interface ComplianceStatsProps {
	stats: StatsType;
	isLoading: boolean;
}

export const ComplianceStats: FC<ComplianceStatsProps> = ({
	stats,
	isLoading,
}) => {
	const { selectedToken } = useTokens();

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<div className="bg-(--bg-panel) border border-(--border-dim) p-4 relative overflow-hidden group">
				<div className="flex justify-between items-start relative z-10">
					<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
						Total Blacklisted
					</span>
					<Badge variant="accent" className="text-[7px]">
						SSS-2
					</Badge>
				</div>
				<div className="text-xl font-mono font-light relative z-10 mt-2">
					{isLoading ? "..." : stats.totalBlacklisted}{" "}
					<span className="text-[11px] text-(--text-dark)">ADDRESSES</span>
				</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-dim) p-4 relative overflow-hidden group">
				<div className="flex justify-between items-start relative z-10">
					<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
						Total Tokens Seized
					</span>
				</div>
				<div className="text-xl font-mono font-light text-[#ff4444] relative z-10 mt-2">
					{isLoading
						? "..."
						: stats.totalSeized.toLocaleString(undefined, {
								minimumFractionDigits: 2,
							})}{" "}
					<span className="text-[11px] font-sans text-[#ff4444]/70 uppercase">
						{selectedToken?.symbol || "TOKENS"}
					</span>
				</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-dim) p-4 relative overflow-hidden group">
				<div className="flex justify-between items-start relative z-10">
					<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
						Last Blacklist Update
					</span>
				</div>
				<div className="text-[13px] font-mono mt-3 relative z-10">
					{isLoading
						? "..."
						: stats.lastUpdate.split(" ")[0].replace(/-/g, ".")}{" "}
					{stats.lastUpdate.split(" ")[1]} UTC
				</div>
				<div className="text-[9px] font-mono text-(--text-dark) mt-1 relative z-10 uppercase tracking-tighter">
					AUTH: {stats.lastAuthority.slice(0, 3)}...
					{stats.lastAuthority.slice(-3)}
				</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-dim) p-4 relative overflow-hidden group">
				<div className="flex justify-between items-start relative z-10">
					<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
						Hook Status
					</span>
				</div>
				<div className="mt-3 relative z-10">
					<Badge
						variant="success"
						className="font-bold px-2 py-0.5 text-[9px] bg-(--success)/10 border-(--success)/30"
					>
						{stats.hookStatus}
					</Badge>
				</div>
			</div>
		</div>
	);
};
