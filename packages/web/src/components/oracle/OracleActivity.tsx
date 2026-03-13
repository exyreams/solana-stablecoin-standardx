import { format } from "date-fns";
import {
	Activity,
	BarChart3,
	MousePointer2,
	PauseCircle,
	Plus,
	Settings,
	Shield,
	Trash2,
	Zap,
} from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { stablecoinApi } from "../../lib/api/stablecoin";

interface OracleEvent {
	id: string;
	type: string;
	name: string;
	data: any;
	timestamp: string;
	signature: string;
}

interface OracleActivityProps {
	refreshKey?: number;
}

export const OracleActivity: FC<OracleActivityProps> = ({ refreshKey }) => {
	const [events, setEvents] = useState<OracleEvent[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchActivity = async () => {
			try {
				const response = await stablecoinApi.getOracleActivity(10);
				setEvents(response.entries);
			} catch (err) {
				console.error("Failed to fetch oracle activity", err);
			} finally {
				setLoading(false);
			}
		};

		fetchActivity();
		const interval = setInterval(fetchActivity, 10000);
		return () => clearInterval(interval);
	}, [refreshKey]);

	const truncate = (text: string) =>
		text ? `${text.slice(0, 6)}...${text.slice(-4)}` : "n/a";

	const getEventIcon = (name: string) => {
		switch (name) {
			case "PriceAggregated":
			case "ORACLE_AGGREGATE":
				return <BarChart3 className="w-3.5 h-3.5 text-green-500" />;
			case "OracleConfigUpdated":
			case "ORACLE_CONFIG":
				return <Settings className="w-3.5 h-3.5 text-blue-500" />;
			case "OraclePauseStateChanged":
				return <PauseCircle className="w-3.5 h-3.5 text-orange-500" />;
			case "OracleInitialized":
			case "ORACLE_INIT":
				return <Zap className="w-3.5 h-3.5 text-(--accent-primary)" />;
			case "ORACLE_FEED_ADD":
				return <Plus className="w-3.5 h-3.5 text-green-400" />;
			case "ORACLE_FEED_REMOVE":
				return <Trash2 className="w-3.5 h-3.5 text-red-500" />;
			case "ORACLE_MANUAL_PRICE":
				return <Shield className="w-3.5 h-3.5 text-orange-400" />;
			case "ORACLE_CRANK":
				return <MousePointer2 className="w-3.5 h-3.5 text-blue-400" />;
			default:
				return <Activity className="w-3.5 h-3.5 text-(--text-dim)" />;
		}
	};

	const getEventDetails = (event: OracleEvent) => {
		const { name, data } = event;
		// Contract stores in 6 decimals
		const DISPLAY_DECIMALS = 1_000_000;

		switch (name) {
			case "PriceAggregated":
				return {
					title: "Price Aggregated (On-Chain)",
					subtext: `${data.quote_currency === "USD" ? "$" : ""}${(Number(data.aggregated_price) / DISPLAY_DECIMALS).toFixed(4)} ${data.quote_currency !== "USD" ? data.quote_currency : ""} using ${data.feeds_used} feeds`,
				};
			case "ORACLE_AGGREGATE":
				return {
					title: "Aggregation Triggered",
					subtext: `Manual sync initiated (${data.reason})`,
				};
			case "OracleConfigUpdated":
			case "ORACLE_CONFIG":
				return {
					title: "Configuration Updated",
					subtext: data.reason || "System parameters modified by authority",
				};
			case "OraclePauseStateChanged":
				return {
					title: data.paused ? "Oracle Paused" : "Oracle Resumed",
					subtext: `Market updates ${data.paused ? "suspended" : "active"}`,
				};
			case "OracleInitialized":
			case "ORACLE_INIT":
				return {
					title: "Oracle Initialized",
					subtext:
						data.reason ||
						`${data.base_currency}/${data.quote_currency} pair established`,
				};
			case "ORACLE_FEED_ADD":
				return {
					title: "Price Feed Added",
					subtext: `${data.reason} (${truncate(data.address)})`,
				};
			case "ORACLE_FEED_REMOVE":
				return {
					title: "Price Feed Removed",
					subtext: data.reason,
				};
			case "ORACLE_MANUAL_PRICE":
				return {
					title: "Manual Price Override",
					subtext: data.reason,
				};
			case "ORACLE_CRANK":
				return {
					title: "Feed Cranked",
					subtext: data.reason,
				};
			default:
				return { title: name, subtext: "Contract interaction" };
		}
	};

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) mt-8 overflow-hidden">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<div className="flex items-center gap-2">
					<Activity className="w-4 h-4 text-(--accent-primary)" />
					<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
						Oracle Logs & Activity
					</span>
				</div>
				<span className="text-[9px] text-(--text-dim) font-mono opacity-40 uppercase">
					Audit Trail / Persistence Logs
				</span>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full font-mono text-[11px]">
					<thead>
						<tr className="border-b border-(--border-mid) bg-(--bg-surface)/20">
							<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal tracking-tighter">
								Event Type
							</th>
							<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal tracking-tighter">
								Activity Record
							</th>
							<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal tracking-tighter">
								Signature
							</th>
							<th className="text-right p-4 text-(--text-dim) uppercase text-[9px] font-normal tracking-tighter">
								Timestamp
							</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td
									colSpan={4}
									className="p-12 text-center text-(--text-dim) opacity-30 animate-pulse"
								>
									FETCHING ORACLE HISTORY...
								</td>
							</tr>
						) : events.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="p-12 text-center text-(--text-dim) opacity-30"
								>
									NO RECENT EVENTS RECORDED
								</td>
							</tr>
						) : (
							events.map((event) => {
								const details = getEventDetails(event);
								return (
									<tr
										key={event.id}
										className="border-b border-(--border-dim) group hover:bg-(--accent-primary)/5 transition-all"
									>
										<td className="p-4">
											<div className="flex items-center gap-2.5">
												<div className="p-1.5 rounded-full bg-(--bg-surface) border border-(--border-dim) group-hover:border-(--accent-primary)/30 transition-colors">
													{getEventIcon(event.name)}
												</div>
												<span className="uppercase text-[9px] whitespace-nowrap font-bold tracking-tight">
													{(event.type === "EVENT"
														? event.name
														: event.type.replace("ORACLE_", "")
													)
														.replace(/([A-Z])/g, " $1")
														.trim()}
												</span>
											</div>
										</td>
										<td className="p-4">
											<div className="flex flex-col gap-0.5">
												<span className="text-(--text-primary) text-[11px] font-medium leading-none">
													{details.title}
												</span>
												<span className="text-[10px] text-(--text-dim) opacity-60">
													{details.subtext}
												</span>
											</div>
										</td>
										<td className="p-4">
											<a
												href={`https://explorer.solana.com/tx/${event.signature}?cluster=devnet`}
												target="_blank"
												rel="noreferrer"
												className="inline-flex items-center gap-1.5 p-1 px-2 bg-[#000000]/40 border border-(--border-dim) rounded-sm text-(--accent-primary) hover:border-(--accent-primary)/40 transition-all no-underline"
											>
												<span className="text-[10px] opacity-80 font-mono">
													{truncate(event.signature)}
												</span>
											</a>
										</td>
										<td className="p-4 text-right">
											<div className="flex flex-col items-end">
												<span className="text-(--text-primary) text-[10px]">
													{format(new Date(event.timestamp), "HH:mm:ss")}
												</span>
												<span className="text-[9px] text-(--text-dim) opacity-50">
													{format(new Date(event.timestamp), "MMM dd, yyyy")}
												</span>
											</div>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};
