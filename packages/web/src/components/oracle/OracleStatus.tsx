import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTokens } from "../../contexts/TokenContext";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export const OracleStatus: FC = () => {
	const { selectedToken } = useTokens();
	const [status, setStatus] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);

	const fetchStatus = async () => {
		try {
			const data = await stablecoinApi.getOracleStatus();
			setStatus(data.status);
		} catch (err) {
			console.error("Failed to fetch oracle status", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStatus();
		const interval = setInterval(fetchStatus, 5000);
		return () => clearInterval(interval);
	}, []);

	const handleAggregate = async () => {
		setActionLoading(true);
		try {
			const data = await stablecoinApi.getOracleStatus();
			const feeds = data.feeds || [];

			if (feeds.length === 0) {
				toast.error("No feeds configured for aggregation");
				return;
			}

			const feedAccounts = feeds.map((f: any) => f.priceFeedPda);
			const res = await stablecoinApi.aggregatePrices(feedAccounts);

			if (res.success) {
				toast.success("On-chain aggregation triggered");
				fetchStatus();
			}
		} catch (err: any) {
			toast.error(`Aggregation failed: ${err.message}`);
		} finally {
			setActionLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="p-8 text-center bg-(--bg-panel) border border-(--border-mid) font-mono text-xs opacity-50">
				SYNCING ORACLE STATUS...
			</div>
		);
	}

	// Contract stores price in 6 decimals internally
	const DISPLAY_DECIMALS = 1_000_000;

	const lastPrice = status?.manualPriceActive
		? Number(status.manualPrice)
		: Number(status.lastAggregatedPrice);

	const price = lastPrice / DISPLAY_DECIMALS;
	const isManual = status?.manualPriceActive;

	const hasEnoughFeeds =
		(status?.feedCount || 0) >= (status?.minFeedsRequired || 0);
	const isStale = status
		? Date.now() / 1000 - status.lastAggregatedTimestamp >
			status.maxStalenessSeconds
		: false;

	return (
		<div className="flex flex-col gap-px bg-(--border-mid) border border-(--border-mid) mb-6">
			<div className="grid grid-cols-5 gap-px">
				<div className="bg-(--bg-panel) p-4">
					<div className="text-[9px] uppercase text-(--text-dim) font-semibold tracking-wider mb-2">
						System Status
					</div>
					<Badge
						variant={status?.paused ? "danger" : status ? "success" : "default"}
					>
						{status?.paused
							? "PAUSED"
							: status
								? "OPERATIONAL"
								: "UNINITIALIZED"}
					</Badge>
				</div>

				<div className="bg-(--bg-panel) p-4">
					<div className="text-[9px] uppercase text-(--text-dim) font-semibold tracking-wider mb-2">
						Currency Pair
					</div>
					<div className="font-mono text-lg font-light tracking-tight">
						{status?.baseCurrency || selectedToken?.symbol || "---"}/
						<span className="text-(--text-dim)">
							{status?.quoteCurrency || "---"}
						</span>
					</div>
				</div>

				<div className="bg-(--bg-panel) p-4 flex flex-col justify-between">
					<div>
						<div className="text-[9px] uppercase text-(--text-dim) font-semibold tracking-wider mb-2">
							Current Price
						</div>
						<div className="font-mono text-lg font-bold text-(--accent-active)">
							$
							{price.toLocaleString(undefined, {
								minimumFractionDigits: 4,
								maximumFractionDigits: 6,
							})}
						</div>
						<div className="flex items-center gap-1 mt-1 text-[9px] font-mono">
							{isManual ? (
								<span className="text-orange-500 font-bold uppercase tracking-tighter animate-pulse">
									MANUAL OVERRIDE ACTIVE
								</span>
							) : price === 0 ? (
								<span className="text-yellow-500 font-bold uppercase tracking-tighter">
									PENDING FIRST AGGREGATE
								</span>
							) : (
								<span className="text-(--text-dark) uppercase">
									LIVE AGGREGATE
								</span>
							)}
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="mt-2 h-7 gap-1 text-[8px] bg-(--bg-surface) hover:bg-(--accent-primary)/10 hover:text-(--accent-primary)"
						onClick={handleAggregate}
						isLoading={actionLoading}
					>
						<RefreshCw className="w-2.5 h-2.5" />
						SYNC AGGREGATE
					</Button>
				</div>

				<div className="bg-(--bg-panel) p-4">
					<div className="text-[9px] uppercase text-(--text-dim) font-semibold tracking-wider mb-2">
						Health Check
					</div>
					<div className="space-y-1">
						<div className="flex items-center gap-1.5">
							{hasEnoughFeeds ? (
								<CheckCircle2 className="w-3 h-3 text-green-500" />
							) : (
								<AlertCircle className="w-3 h-3 text-red-500" />
							)}
							<span className="text-[10px] uppercase font-mono">
								{status?.feedCount || 0}/{status?.minFeedsRequired || 0} FEEDS
							</span>
						</div>
						<div className="flex items-center gap-1.5">
							{isStale ? (
								<AlertCircle className="w-3 h-3 text-yellow-500" />
							) : (
								<CheckCircle2 className="w-3 h-3 text-green-500" />
							)}
							<span className="text-[10px] uppercase font-mono">
								{isStale ? "STALE" : "FRESH"}
							</span>
						</div>
					</div>
				</div>

				<div className="bg-(--bg-panel) p-4">
					<div className="text-[9px] uppercase text-(--text-dim) font-semibold tracking-wider mb-2">
						Staleness Limit
					</div>
					<div className="font-mono text-sm uppercase">
						{status?.maxStalenessSeconds || 0}S
					</div>
					<div className="text-[9px] text-(--text-dark) uppercase mt-1">
						Threshold
					</div>
				</div>
			</div>
		</div>
	);
};
