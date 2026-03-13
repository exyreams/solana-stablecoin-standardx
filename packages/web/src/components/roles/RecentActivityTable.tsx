import { format } from "date-fns";
import {
	ArrowRight,
	History,
	KeyRound,
	ShieldAlert,
	UserCheck,
} from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Badge } from "../ui/Badge";

interface AuditLog {
	id: string;
	action: string;
	address: string;
	reason: string | null;
	signature: string | null;
	timestamp: string;
}

interface RecentActivityTableProps {
	mint: string;
	refreshKey?: number;
}

export const RecentActivityTable: FC<RecentActivityTableProps> = ({
	mint,
	refreshKey,
}) => {
	const [logs, setLogs] = useState<AuditLog[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchLogs = async () => {
			try {
				const response = await stablecoinApi.getAuditLogs(50);
				const roleActions = [
					"UPDATE_ROLES",
					"AUTHORITY_TRANSFER_INIT",
					"AUTHORITY_TRANSFER_ACCEPT",
					"TRANSFER_AUTHORITY",
					"ACCEPT_AUTHORITY",
				];
				setLogs(
					response.entries.filter((log) => roleActions.includes(log.action)),
				);
			} catch (err) {
				console.error("Failed to fetch audit logs", err);
			} finally {
				setLoading(false);
			}
		};

		fetchLogs();
	}, [mint, refreshKey]);

	const truncate = (text: string) =>
		text ? `${text.slice(0, 6)}...${text.slice(-4)}` : "n/a";

	const getTargetInfo = (log: AuditLog) => {
		if (log.action === "UPDATE_ROLES" && log.reason) {
			try {
				const data = JSON.parse(log.reason);
				const entries = Object.entries(data).filter(([_, val]) => !!val);

				if (entries.length === 1) {
					const [role, addr] = entries[0];
					return {
						title: `${role.charAt(0).toUpperCase() + role.slice(1)} Updated`,
						subtext: truncate(addr as string),
					};
				}

				return {
					title: "Multiple Roles Updated",
					subtext: entries
						.map(([r]) => r.charAt(0).toUpperCase() + r.slice(1))
						.join(", "),
				};
			} catch (_e) {
				return { title: "Role Update", subtext: "Contract State" };
			}
		}

		if (log.action.includes("AUTHORITY_TRANSFER")) {
			return {
				title: log.action.includes("INIT")
					? "Transfer Proposed"
					: "Transfer Accepted",
				subtext:
					log.address === "GLOBAL" ? "Master Authority" : truncate(log.address),
			};
		}

		return {
			title: log.action.replace(/_/g, " "),
			subtext:
				log.address === "GLOBAL" ? "Contract State" : truncate(log.address),
		};
	};

	const getActionIcon = (action: string) => {
		switch (action) {
			case "AUTHORITY_TRANSFER_ACCEPT":
			case "ACCEPT_AUTHORITY":
				return <UserCheck className="w-3.5 h-3.5 text-green-500" />;
			case "AUTHORITY_TRANSFER_INIT":
			case "TRANSFER_AUTHORITY":
				return <ArrowRight className="w-3.5 h-3.5 text-blue-500" />;
			case "UPDATE_ROLES":
				return <ShieldAlert className="w-3.5 h-3.5 text-(--accent-primary)" />;
			default:
				return <KeyRound className="w-3.5 h-3.5 text-(--text-dim)" />;
		}
	};

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) mt-8 overflow-hidden">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<div className="flex items-center gap-2">
					<History className="w-4 h-4 text-(--accent-primary)" />
					<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
						Recent Activity History
					</span>
				</div>
				<span className="text-[9px] text-(--text-dim) font-mono opacity-40">
					Filtered: Roles & Authority
				</span>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full font-mono text-[11px]">
					<thead>
						<tr className="border-b border-(--border-mid) bg-(--bg-surface)/20">
							<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal tracking-tighter">
								Event
							</th>
							<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal tracking-tighter">
								Target Details
							</th>
							<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal tracking-tighter">
								Status
							</th>
							<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal tracking-tighter">
								On-Chain ID
							</th>
							<th className="text-right p-4 text-(--text-dim) uppercase text-[9px] font-normal tracking-tighter">
								Executed At
							</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td
									colSpan={5}
									className="p-12 text-center text-(--text-dim) opacity-30 animate-pulse"
								>
									Fetching audit trail...
								</td>
							</tr>
						) : logs.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="p-12 text-center text-(--text-dim) opacity-30"
								>
									No activity found for this token
								</td>
							</tr>
						) : (
							logs.map((log) => {
								const info = getTargetInfo(log);
								return (
									<tr
										key={log.id}
										className="border-b border-(--border-dim) group hover:bg-(--accent-primary)/5 transition-all"
									>
										<td className="p-4">
											<div className="flex items-center gap-2.5">
												<div className="p-1.5 rounded-full bg-(--bg-surface) border border-(--border-dim) group-hover:border-(--accent-primary)/30 transition-colors">
													{getActionIcon(log.action)}
												</div>
												<span className="uppercase text-[10px] whitespace-nowrap font-semibold tracking-tight">
													{log.action.replace(/_/g, " ")}
												</span>
											</div>
										</td>
										<td className="p-4">
											<div className="flex flex-col gap-0.5">
												<span className="text-(--text-primary) text-[11px] font-medium leading-none">
													{info.title}
												</span>
												<span className="text-[10px] text-(--text-dim) opacity-60">
													{info.subtext}
												</span>
											</div>
										</td>
										<td className="p-4">
											<Badge
												variant="success"
												className="bg-green-500/10 text-green-500 border-green-500/30 py-0.5 px-2 text-[8px] font-bold rounded-xs tracking-wider"
											>
												SUCCESS
											</Badge>
										</td>
										<td className="p-4">
											{log.signature ? (
												<a
													href={`https://explorer.solana.com/tx/${log.signature}?cluster=devnet`}
													target="_blank"
													rel="noreferrer"
													className="inline-flex items-center gap-1.5 p-1 px-2 bg-[#000000]/40 border border-(--border-dim) rounded-sm text-(--accent-primary) hover:border-(--accent-primary)/40 transition-all no-underline"
												>
													<span className="text-[10px] opacity-80">
														{truncate(log.signature)}
													</span>
												</a>
											) : (
												<span className="text-(--text-dim) opacity-20">
													---
												</span>
											)}
										</td>
										<td className="p-4 text-right">
											<div className="flex flex-col items-end">
												<span className="text-(--text-primary) text-[10px]">
													{format(new Date(log.timestamp), "HH:mm:ss")}
												</span>
												<span className="text-[9px] text-(--text-dim) opacity-50">
													{format(new Date(log.timestamp), "MMM dd, yyyy")}
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
