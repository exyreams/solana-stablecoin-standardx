import { type FC, useEffect, useState } from "react";
import {
	AnalyticsSupplyChart,
	ConcentrationAnalysis,
	HoldersFilter,
	SupplyStats,
	TopHolders,
	TransactionBreakdown,
} from "../../components/analytics";
import { useTokens } from "../../contexts/TokenContext";
import { stablecoinApi } from "../../lib/api/stablecoin";

const Analytics: FC = () => {
	const { selectedToken } = useTokens();
	const [data, setData] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			if (!selectedToken) return;

			try {
				setLoading(true);
				const result = await stablecoinApi.getAnalytics(
					selectedToken.mintAddress,
				);
				setData(result);
			} catch (error) {
				console.error("Failed to fetch analytics:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [selectedToken]);

	if (!selectedToken) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-(--text-dim) font-mono text-sm border border-dashed border-(--border-mid)">
				<p>NO TOKEN SELECTED</p>
				<p className="text-xs mt-2">PLEASE SELECT A TOKEN FROM THE TOP BAR</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCA352]"></div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="p-8 text-center text-(--text-dim)">
				Failed to load analytics data.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<div className="text-[10px] uppercase font-mono text-(--text-dim) mb-1 spacing-widest">
					DASHBOARD &gt; {selectedToken.symbol}-SOL &gt;{" "}
					<span className="text-(--accent-primary)">HOLDERS</span>
				</div>
				<h1 className="text-[20px] font-mono font-light uppercase tracking-widest text-(--text-main)">
					Holders & Analytics
				</h1>
			</div>

			<SupplyStats stats={data.stats} />

			<div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
				<div className="flex flex-col gap-6">
					<HoldersFilter onFilterChange={() => {}} />
					<TopHolders holders={data.topHolders} rpcError={data.rpcError} />
				</div>

				<div className="h-full">
					<ConcentrationAnalysis data={data.topHolders} />
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
				<div className="bg-(--bg-panel) border border-(--border-mid) p-6">
					<div className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest mb-6">
						Supply History (Last 7 Days)
					</div>
					<div className="h-[300px]">
						<AnalyticsSupplyChart data={data.history} />
					</div>
				</div>

				<div className="bg-(--bg-panel) border border-(--border-mid) p-6">
					<div className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest mb-6">
						Activity Distribution
					</div>
					<div className="h-[300px]">
						<TransactionBreakdown data={data.breakdown} />
					</div>
				</div>
			</div>
		</div>
	);
};

export default Analytics;
