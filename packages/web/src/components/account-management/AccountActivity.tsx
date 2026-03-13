import { Check, Copy, RefreshCw } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AccountData } from "../../hooks/useAccount";
import { stablecoinApi } from "../../lib/api/stablecoin";

interface Activity {
	signature: string;
	timestamp: string;
	action: string;
	amount: string;
	details: string;
	authority: string;
	status: string;
}

interface AccountActivityProps {
	account: AccountData;
}

const getActionColor = (action: string) => {
	const a = action.toUpperCase();
	if (
		a.includes("FREEZE") ||
		a.includes("BLACKLIST") ||
		a.includes("BURN") ||
		a.includes("SEIZE")
	)
		return "#ff4444";
	if (a.includes("THAW") || a.includes("UNPAUSE")) return "#4ade80";
	if (a.includes("MINT")) return "#CCA352";
	if (a.includes("CONFID") || a.includes("APPROVE")) return "#3b82f6";
	return "var(--text-dim)";
};

const getActionBadge = (action: string) => {
	const a = action.toUpperCase();
	if (a.includes("BLACKLIST") || a.includes("SEIZE")) return "SSS-2";
	if (a.includes("CONFID")) return "SSS-3";
	return null;
};

const formatTime = (iso: string) => {
	try {
		const d = new Date(iso);
		const mm = (d.getMonth() + 1).toString().padStart(2, "0");
		const dd = d.getDate().toString().padStart(2, "0");
		const hh = d.getHours().toString().padStart(2, "0");
		const min = d.getMinutes().toString().padStart(2, "0");
		return `${mm}.${dd} ${hh}:${min}`;
	} catch (_e) {
		return iso;
	}
};

const CopyButton: FC<{ text: string }> = ({ text }) => {
	const [copied, setCopied] = useState(false);
	const handleCopy = () => {
		navigator.clipboard.writeText(text);
		setCopied(true);
		toast.success("Address copied to clipboard");
		setTimeout(() => setCopied(false), 2000);
	};
	return (
		<button
			onClick={handleCopy}
			className="p-1 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-white"
			title="Copy address"
		>
			{copied ? (
				<Check size={10} className="text-emerald-500" />
			) : (
				<Copy size={10} />
			)}
		</button>
	);
};

export const AccountActivity: FC<AccountActivityProps> = ({ account }) => {
	const [activities, setActivities] = useState<Activity[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchActivity = useCallback(async () => {
		if (!account.address) return;
		try {
			setIsLoading(true);
			const data = await stablecoinApi.getAccountHistory(account.address);
			setActivities(data.entries || []);
		} catch (e) {
			console.error("Failed to fetch activity:", e);
			setActivities([]);
		} finally {
			setIsLoading(false);
		}
	}, [account.address]);

	useEffect(() => {
		fetchActivity();
	}, [fetchActivity]);

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) h-full flex flex-col">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest">
					Recent Account Activity
				</span>
				<div className="flex items-center gap-4">
					<div className="font-mono text-[9px] text-(--text-dark) uppercase">
						TXS: {activities.length} / 1,482
					</div>
					<button
						onClick={() => fetchActivity()}
						disabled={isLoading}
						className={`p-1.5 hover:bg-white/10 rounded-sm transition-all text-white/40 hover:text-white ${
							isLoading ? "opacity-50 cursor-not-allowed" : ""
						}`}
						title="Refresh Activity"
					>
						<RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-auto">
				<table className="w-full font-mono text-[11px]">
					<thead className="sticky top-0 bg-(--bg-panel) z-10">
						<tr className="border-b border-(--border-dim) bg-black/20">
							<th className="py-4 px-6 text-left font-bold text-(--text-dim) text-[11px] uppercase tracking-wider w-[150px]">
								Timestamp
							</th>
							<th className="py-4 px-6 text-left font-bold text-(--text-dim) text-[11px] uppercase tracking-wider w-[120px]">
								Action
							</th>
							<th className="py-4 px-6 text-left font-bold text-(--text-dim) text-[11px] uppercase tracking-wider w-[140px]">
								Amount
							</th>
							<th className="py-4 px-6 text-left font-bold text-(--text-dim) text-[11px] uppercase tracking-wider">
								Details / Hash
							</th>
							<th className="py-4 px-6 text-left font-bold text-(--text-dim) text-[11px] uppercase tracking-wider w-[150px]">
								Authority
							</th>
							<th className="py-4 px-6 text-right font-bold text-(--text-dim) text-[11px] uppercase tracking-wider w-[100px]">
								Status
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-(--border-dim)/40">
						{isLoading && activities.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="p-10 text-center text-(--text-dark) italic animate-pulse"
								>
									INTERROGATING ON-CHAIN DATA...
								</td>
							</tr>
						) : activities.length === 0 ? (
							<tr>
								<td colSpan={6} className="p-10 text-center">
									<div className="text-(--text-dark) text-[10px] uppercase mb-1">
										No Activity Detected
									</div>
									<div className="text-[#333] text-[9px]">
										Transactions for this account will appear here.
									</div>
								</td>
							</tr>
						) : (
							activities.map((activity, index) => {
								const badge = getActionBadge(activity.action);
								return (
									<tr
										key={index}
										className="hover:bg-white/[0.04] transition-colors cursor-default border-b border-white/5"
									>
										<td className="p-4 text-white/90 whitespace-nowrap font-medium">
											{formatTime(activity.timestamp)}
										</td>
										<td className="p-4">
											<div className="flex items-center gap-2">
												<span
													className="font-bold uppercase tracking-tight text-[12px]"
													style={{ color: getActionColor(activity.action) }}
												>
													{activity.action.split("_")[0]}
												</span>
												{badge && (
													<span
														className={`text-[8px] px-1 py-0 border leading-tight font-bold ${
															badge === "SSS-2"
																? "border-[#ff4444] text-[#ff4444]"
																: "border-[#3b82f6] text-[#3b82f6]"
														}`}
													>
														{badge}
													</span>
												)}
											</div>
										</td>
										<td className="py-4 px-6">
											<span
												className={`text-xs font-mono font-bold ${activity.amount.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
											>
												{activity.amount || "—"}
											</span>
										</td>
										<td className="p-4 text-white font-mono">
											{activity.details}
										</td>
										<td className="p-4 text-white/80 font-mono text-[11px]">
											<div className="flex items-center gap-2 group">
												<span
													className="truncate max-w-[250px]"
													title={
														activity.authority === "ADMIN"
															? "Admin Authority"
															: activity.authority
													}
												>
													{activity.authority === "ADMIN"
														? "8x2...f93"
														: `${activity.authority.slice(0, 12)}...${activity.authority.slice(-12)}`}
												</span>
												<CopyButton
													text={
														activity.authority === "ADMIN"
															? "2dD2o8cyMyYFN8GsCf47TL61qeonR6Hguqu6FAnvgcaW"
															: activity.authority
													}
												/>
											</div>
										</td>
										<td className="p-4 text-right">
											<span
												className={`inline-block border px-2 py-1 text-[9px] font-bold tracking-tighter transition-all shadow-sm ${
													activity.status === "FINALIZED"
														? "border-[#CCA352] text-[#CCA352] bg-[#CCA352]/15"
														: "border-(--border-mid) text-(--text-dim)"
												}`}
											>
												{activity.status}
											</span>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			<div className="p-10 text-center border-t border-(--border-dim)/40 bg-black/20">
				<button className="px-10 py-2.5 border border-(--border-mid) text-[10px] uppercase font-bold text-white/80 hover:text-white hover:border-white/40 transition-all mx-auto tracking-[0.2em] bg-white/5">
					Load More Activity
				</button>
			</div>
		</div>
	);
};
