import { Copy, ExternalLink, History, ShieldAlert } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { BlacklistEntry } from "../../hooks/useBlacklist";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Modal } from "../ui/Modal";

interface Activity {
	signature: string;
	timestamp: string;
	action: string;
	amount: string;
	details: string;
	authority: string;
	status: string;
}

interface BlacklistDetailsModalProps {
	entry: BlacklistEntry | null;
	isOpen: boolean;
	onClose: () => void;
}

const getActionColor = (action: string) => {
	const a = action.toUpperCase();
	if (a.includes("FREEZE") || a.includes("BLACKLIST") || a.includes("SEIZE"))
		return "var(--accent-red)";
	if (a.includes("THAW") || a.includes("UNPAUSE")) return "#4ade80";
	if (a.includes("MINT")) return "var(--accent-primary)";
	return "var(--text-dim)";
};

const formatTime = (iso: string) => {
	try {
		const d = new Date(iso);
		return {
			date: d.toLocaleDateString(undefined, {
				month: "2-digit",
				day: "2-digit",
				year: "numeric",
			}),
			time: d.toLocaleTimeString(undefined, {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			}),
		};
	} catch (_e) {
		return { date: iso, time: "" };
	}
};

export const BlacklistDetailsModal: FC<BlacklistDetailsModalProps> = ({
	entry,
	isOpen,
	onClose,
}) => {
	const [activities, setActivities] = useState<Activity[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchActivity = useCallback(async () => {
		if (!entry?.address) return;
		try {
			setIsLoading(true);
			const data = await stablecoinApi.getAccountHistory(entry.address);
			setActivities(data.entries || []);
		} catch (e) {
			console.error("Failed to fetch activity:", e);
			setActivities([]);
		} finally {
			setIsLoading(false);
		}
	}, [entry?.address]);

	useEffect(() => {
		if (isOpen && entry) {
			fetchActivity();
		}
	}, [isOpen, entry, fetchActivity]);

	if (!entry) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Blacklist Entry Details"
			size="wide"
		>
			<div className="flex flex-col gap-6">
				{/* Top Info Card */}
				<div className="bg-white/[0.02] border border-(--border-mid) p-5 flex flex-col gap-4">
					<div className="flex justify-between items-start">
						<div className="flex flex-col gap-1">
							<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
								Blacklisted Address
							</span>
							<div className="flex items-center gap-3">
								<span className="text-sm font-mono text-(--text-main) font-bold break-all">
									{entry.address}
								</span>
								<div className="flex gap-2 shrink-0">
									<button
										onClick={() => {
											navigator.clipboard.writeText(entry.address);
											toast.success("Address copied");
										}}
										className="p-1.5 bg-white/5 border border-(--border-dim) hover:border-(--accent-primary) transition-colors"
									>
										<Copy className="w-3.5 h-3.5 text-(--text-dark)" />
									</button>
									<button
										onClick={() =>
											window.open(
												`https://solscan.io/account/${entry.address}`,
												"_blank",
											)
										}
										className="p-1.5 bg-white/5 border border-(--border-dim) hover:border-(--accent-primary) transition-colors"
									>
										<ExternalLink className="w-3.5 h-3.5 text-(--text-dark)" />
									</button>
								</div>
							</div>
						</div>
						<div className="bg-(--accent-red)/10 border border-(--accent-red)/30 px-3 py-1.5 flex items-center gap-2">
							<ShieldAlert className="w-4 h-4 text-(--accent-red)" />
							<span className="text-[10px] font-bold text-(--accent-red) uppercase tracking-wider">
								RESTRICTED
							</span>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/5 mt-2">
						<div className="flex flex-col gap-1">
							<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
								Status Information
							</span>
							<p className="text-[11px] text-(--text-dim) leading-relaxed">
								On-chain restriction active. Transfer hook will reject all
								transactions involving this wallet.
							</p>
						</div>
						<div className="flex flex-col gap-1">
							<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
								Authority Source
							</span>
							<div className="flex items-center gap-2">
								<span className="px-1.5 py-0.5 bg-white/5 border border-(--border-dim) text-[9px] font-mono text-(--text-main)">
									MASTER_AUTHORITY
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Full Reason Section */}
				<div className="flex flex-col gap-2">
					<div className="flex justify-between items-center">
						<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
							Justification / Audit Reason
						</span>
					</div>
					<div className="bg-black/40 border border-(--border-mid) p-4 min-h-[80px]">
						<p className="text-xs font-mono text-(--text-main) leading-relaxed">
							{entry.reason}
						</p>
					</div>
				</div>

				{/* Audit Trail / History */}
				<div className="flex flex-col gap-3">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<History className="w-3.5 h-3.5 text-(--accent-primary)" />
							<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
								Compliance Audit Trail
							</span>
						</div>
						<button
							onClick={fetchActivity}
							className="text-[9px] text-(--text-dark) hover:text-(--accent-primary) font-mono"
						>
							REFRESH TRAIL
						</button>
					</div>

					<div className="border border-(--border-dim) overflow-hidden">
						<table className="w-full text-left font-mono text-[10px]">
							<thead className="bg-white/5 border-b border-(--border-dim)">
								<tr>
									<th className="p-3 font-normal text-(--text-dark) uppercase">
										Timestamp
									</th>
									<th className="p-3 font-normal text-(--text-dark) uppercase">
										Action
									</th>
									<th className="p-3 font-normal text-(--text-dark) uppercase">
										Details
									</th>
									<th className="p-3 font-normal text-(--text-dark) uppercase text-right">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/5">
								{isLoading && activities.length === 0 ? (
									<tr>
										<td
											colSpan={4}
											className="p-8 text-center italic text-(--text-dark)"
										>
											Interrogating history...
										</td>
									</tr>
								) : activities.length === 0 ? (
									<tr>
										<td
											colSpan={4}
											className="p-8 text-center italic text-(--text-dark)"
										>
											No compliance events recorded for this address.
										</td>
									</tr>
								) : (
									activities.map((activity, i) => {
										const { date, time } = formatTime(activity.timestamp);
										return (
											<tr
												key={i}
												className="hover:bg-white/[0.02] transition-colors"
											>
												<td className="p-3 whitespace-nowrap">
													<div className="text-(--text-main)">{date}</div>
													<div className="text-[9px] text-(--text-dark)">
														{time}
													</div>
												</td>
												<td className="p-3">
													<span
														className="font-bold uppercase"
														style={{ color: getActionColor(activity.action) }}
													>
														{activity.action}
													</span>
												</td>
												<td className="p-3 text-(--text-dim) max-w-[200px] truncate">
													{activity.details}
												</td>
												<td className="p-3 text-right">
													<span className="text-[9px] px-1.5 py-0.5 border border-(--border-dim) text-(--text-dark)">
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
				</div>

				<div className="flex justify-end pt-2">
					<button
						onClick={onClose}
						className="px-6 py-2.5 bg-white/5 border border-(--border-mid) text-[10px] font-bold text-(--text-main) hover:bg-white/10 transition-all uppercase tracking-widest font-mono"
					>
						CLOSE PANEL
					</button>
				</div>
			</div>
		</Modal>
	);
};
