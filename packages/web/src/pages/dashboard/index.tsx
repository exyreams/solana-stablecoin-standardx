import { type FC, useEffect, useState } from "react";
import {
	ActionCard,
	ActivityTable,
	MetricCard,
	RolePanel,
	SupplyChart,
} from "../../components/dashboard";
import { useTokens } from "../../contexts/TokenContext";
import { stablecoinApi } from "../../lib/api/stablecoin";

const Dashboard: FC = () => {
	const { selectedToken } = useTokens();
	const [summary, setSummary] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true); // Set to true initially

	useEffect(() => {
		const fetchSummary = async () => {
			if (!selectedToken) return;

			try {
				const data = await stablecoinApi.getDashboardSummary(
					selectedToken.mintAddress,
				);
				setSummary(data);
			} catch (error) {
				console.error("Failed to fetch dashboard summary:", error);
			} finally {
				setIsLoading(false);
			}
		};

		setIsLoading(true); // Set loading true before initial fetch
		fetchSummary();
		const interval = setInterval(fetchSummary, 15000); // Poll every 15s

		return () => clearInterval(interval);
	}, [selectedToken]);

	if (!selectedToken) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-(--text-dim) font-mono text-sm border border-dashed border-(--border-mid)">
				<p>NO TOKEN SELECTED</p>
				<p className="text-xs mt-2">PLEASE SELECT A TOKEN FROM THE TOP BAR</p>
			</div>
		);
	}

	if (isLoading || !summary) {
		// Show loading if still loading or summary is not yet available
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	const metrics = summary?.metrics;
	const isPaused = metrics?.isPaused ?? false;

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-4 gap-4">
				<MetricCard
					label="Total Supply"
					value={metrics?.totalSupply || "---"}
					subtitle={
						<span
							className={`text-[10px] font-mono ${Number(metrics?.changePercent24h || 0) >= 0 ? "text-[#00ff88]" : "text-[#ff4444]"}`}
						>
							{Number(metrics?.changePercent24h || 0) >= 0 ? "▲" : "▼"}{" "}
							{Math.abs(Number(metrics?.changePercent24h || 0))}% 24H
						</span>
					}
				/>
				<MetricCard
					label="Active Minters"
					value={metrics?.activeMinters || "0 / 12"}
					subtitle={
						<span className="text-(--text-dim) uppercase">
							CAPACITY: {metrics?.minterCapacity}
						</span>
					}
				/>
				<MetricCard
					label="Pause Status"
					value={
						<div className="mt-2">
							<span
								className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold border ${isPaused ? "border-destructive text-destructive bg-destructive/5" : "border-[#00ff88] text-[#00ff88] bg-[rgba(0,255,136,0.05)]"}`}
							>
								{isPaused ? "PAUSED" : "ACTIVE"}
							</span>
						</div>
					}
					subtitle={
						<span className="text-(--text-dim) mt-3 block uppercase">
							LAST RE-ENTRY: 12H AGO
						</span>
					}
				/>
				<MetricCard
					label="Oracle Price"
					value={`$${metrics?.price || "1.0000"}`}
					valueColor="text-(--accent-active)"
					subtitle={
						<span className="text-(--text-dim) uppercase">PYTH ORACLE</span>
					}
				/>
			</div>

			<div className="flex gap-6">
				<div className="grid grid-cols-3 gap-4 flex-2">
					<ActionCard
						label="Mint Tokens"
						description="INCREMENT CIRCULATING"
						variant="mint"
						amount={
							summary?.stats?.totalMinted
								? `+${summary.stats.totalMinted}`
								: undefined
						}
						count={
							summary?.stats?.mintCount
								? `${summary.stats.mintCount} TXS`
								: undefined
						}
					/>
					<ActionCard
						label="Burn Tokens"
						description="REDUCE TOTAL SUPPLY"
						variant="burn"
						amount={
							summary?.stats?.totalBurned
								? `-${summary.stats.totalBurned}`
								: undefined
						}
						count={
							summary?.stats?.burnCount
								? `${summary.stats.burnCount} TXS`
								: undefined
						}
					/>
					<ActionCard
						label="Freeze Account"
						description="SUSPEND USER ASSETS"
						count={
							summary?.stats?.frozenCount
								? `${summary.stats.frozenCount} ACTIVE`
								: undefined
						}
					/>
					<ActionCard
						label="Blacklist"
						description="GLOBAL DENY-LIST"
						badge={selectedToken.preset === "sss2" ? "SSS-2 ONLY" : "NA"}
						count={
							summary?.stats?.blacklistCount
								? `${summary.stats.blacklistCount} BLOCKED`
								: undefined
						}
					/>
					<ActionCard
						label="Manage Minters"
						description="ROLES & PERMISSIONS"
					/>
					<ActionCard label="View Audit Log" description="ON-CHAIN HISTORY" />
				</div>

				<RolePanel details={selectedToken} roles={summary?.roles} />
			</div>

			<SupplyChart data={summary?.trajectory || []} />

			<ActivityTable activities={summary?.activities || []} />
		</div>
	);
};

export default Dashboard;
