import { type FC, Fragment } from "react";
import { Badge } from "../ui/Badge";
import { AuditDetail } from "./AuditDetail";

interface AuditEvent {
	id: string;
	timestamp: string;
	action: string;
	address: string;
	reason: string;
	signature?: string;
	amount?: string;
	status: "success" | "failed";
	type: "ADMIN" | "EVENT";
}

interface AuditTableProps {
	events: AuditEvent[];
	loading: boolean;
	onSelectEvent: (event: AuditEvent | null) => void;
	selectedEventId?: string;
	totalCount: number;
	limit: number;
	offset: number;
	onPageChange: (newOffset: number) => void;
}

export const AuditTable: FC<AuditTableProps> = ({
	events,
	loading,
	onSelectEvent,
	selectedEventId,
	totalCount,
	limit,
	offset,
	onPageChange,
}) => {
	const getActionBadge = (action: string) => {
		const variants: Record<string, any> = {
			MINT: { variant: "success", text: "MINT" },
			BURN: { variant: "danger", text: "BURN" },
			FREEZE: { variant: "warning", text: "FREEZE" },
			BLACKLIST: { variant: "danger", text: "BLACKLIST" },
			BLACKLIST_ADD: { variant: "danger", text: "BLACKLIST+" },
			BLACKLIST_REMOVE: { variant: "default", text: "BLACKLIST-" },
			SEIZE: { variant: "danger", text: "SEIZE" },
			THAW: { variant: "default", text: "THAW" },
			UPDATE_ROLES: { variant: "warning", text: "ROLES" },
		};
		const config = variants[action] || { variant: "default", text: action };
		return <Badge variant={config.variant}>{config.text}</Badge>;
	};

	const formatDate = (ts: string) => {
		const d = new Date(ts);
		return {
			date: d.toLocaleDateString("en-CA").replace(/-/g, "."),
			time: d.toLocaleTimeString("en-GB"),
		};
	};

	const currentPage = Math.floor(offset / limit) + 1;
	const totalPages = Math.ceil(totalCount / limit);

	return (
		<div className="border border-(--border-mid) bg-(--bg-panel) flex-grow flex flex-col relative min-h-[400px]">
			{loading && (
				<div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-[1px]">
					<div className="font-mono text-[10px] text-(--accent-primary) animate-pulse shadow-[0_0_10px_rgba(204,163,82,0.3)] border border-(--accent-primary) px-4 py-2 bg-black">
						FETCHING_DATA...
					</div>
				</div>
			)}
			<div className="overflow-auto flex-grow">
				<table className="w-full border-collapse font-mono text-[11px]">
					<thead>
						<tr className="bg-black/20">
							<th className="text-left px-3 py-3 text-(--text-dark) font-semibold uppercase text-[9px] border-b border-(--border-mid) w-[140px]">
								Timestamp
							</th>
							<th className="text-left px-3 py-3 text-(--text-dark) font-semibold uppercase text-[9px] border-b border-(--border-mid) w-[120px]">
								Type
							</th>
							<th className="text-left px-3 py-3 text-(--text-dark) font-semibold uppercase text-[9px] border-b border-(--border-mid) w-[180px]">
								Address
							</th>
							<th className="text-left px-3 py-3 text-(--text-dark) font-semibold uppercase text-[9px] border-b border-(--border-mid) w-[220px]">
								Details
							</th>
							<th className="text-right px-3 py-3 text-(--text-dark) font-semibold uppercase text-[9px] border-b border-(--border-mid) w-[120px]">
								Amount
							</th>
							<th className="text-left px-3 py-3 text-(--text-dark) font-semibold uppercase text-[9px] border-b border-(--border-mid) w-[100px]">
								Status
							</th>
							<th className="text-left px-3 py-3 text-(--text-dark) font-semibold uppercase text-[9px] border-b border-(--border-mid)">
								TX Sig
							</th>
							<th className="text-center px-3 py-3 text-(--text-dark) font-semibold uppercase text-[9px] border-b border-(--border-mid) w-[60px]">
								Action
							</th>
						</tr>
					</thead>
					<tbody className={loading ? "opacity-30" : ""}>
						{events.map((event) => {
							const { date, time } = formatDate(event.timestamp);
							const isSelected = selectedEventId === event.id;
							return (
								<Fragment key={event.id}>
									<tr
										onClick={() => onSelectEvent(isSelected ? null : event)}
										className={`cursor-pointer transition-colors border-b border-(--border-dim) hover:bg-[rgba(204,163,82,0.03)] ${
											isSelected ? "bg-[rgba(204,163,82,0.08)]" : ""
										}`}
									>
										<td className="px-3 py-2.5 align-middle">
											<div className="text-(--text-main)">{date}</div>
											<div className="text-(--text-dark)">{time}</div>
										</td>
										<td className="px-3 py-2.5 align-middle">
											{getActionBadge(event.action)}
										</td>
										<td className="px-3 py-2.5 align-middle">
											<span className="text-(--text-dim)">
												{event.address.slice(0, 6)}...{event.address.slice(-4)}
											</span>{" "}
											<span className="text-[9px] cursor-pointer opacity-40 hover:opacity-100">
												📋
											</span>
										</td>
										<td className="px-3 py-2.5 align-middle truncate max-w-[220px]">
											<span className="text-(--text-dark) text-[10px]">
												{event.reason?.trim().startsWith("{")
													? "Structured data (expand for details)"
													: event.reason}
											</span>
										</td>
										<td className="px-3 py-2.5 align-middle text-right font-mono">
											{event.amount ? (
												<span
													className={`font-bold ${
														event.action === "MINT"
															? "text-green-400"
															: (
																		event.action === "BURN" ||
																			event.action === "SEIZE" ||
																			event.action === "BLACKLIST_ADD"
																	)
																? "text-red-400"
																: "text-blue-400"
													}`}
												>
													{event.action === "MINT" ? "+" : "-"}
													{event.amount}
												</span>
											) : (
												<span className="text-(--text-dark)">—</span>
											)}
										</td>
										<td className="px-3 py-2.5 align-middle">
											<div
												className={`flex items-center gap-1.5 text-[9px] font-bold ${
													event.status?.toLowerCase() === "success" ||
													!event.status
														? "text-green-400"
														: "text-red-400"
												}`}
											>
												<span>
													{event.status?.toLowerCase() === "success" ||
													!event.status
														? "✔"
														: "✘"}
												</span>
												{(event.status || "success").toUpperCase()}
											</div>
										</td>
										<td className="px-3 py-2.5 align-middle">
											{event.signature ? (
												<>
													<span className="text-(--text-dark)">
														{event.signature.slice(0, 4)}...
														{event.signature.slice(-4)}
													</span>{" "}
													<a
														href={`https://explorer.solana.com/tx/${event.signature}?cluster=custom&customUrl=http://localhost:8899`}
														target="_blank"
														rel="noreferrer"
														className="text-(--accent-primary) no-underline text-[9px] ml-1"
													>
														EXPL
													</a>
												</>
											) : (
												<span className="text-(--text-dark)">—</span>
											)}
										</td>
										<td className="px-3 py-2.5 align-middle text-center">
											<button
												onClick={(e) => {
													e.stopPropagation();
													onSelectEvent(isSelected ? null : event);
												}}
												className={`bg-transparent border ${isSelected ? "border-(--accent-primary) text-(--accent-primary)" : "border-(--border-dim) text-(--text-dim)"} hover:border-(--accent-primary) hover:text-(--accent-primary) font-mono text-[9px] px-1.5 py-0.5 cursor-pointer transition-colors`}
											>
												{isSelected ? "HIDE" : "VIEW"}
											</button>
										</td>
									</tr>
									{isSelected && (
										<tr>
											<td
												colSpan={8}
												className="p-0 border-b border-(--border-dim)"
											>
												<AuditDetail event={event} />
											</td>
										</tr>
									)}
								</Fragment>
							);
						})}
						{events.length === 0 && !loading && (
							<tr>
								<td colSpan={8} className="px-3 py-10 text-center font-mono">
									<div className="text-(--text-dark) text-[10px]">
										NO_EVENTS_FOUND_FOR_CURRENT_FILTERS
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div className="flex justify-between items-center px-3 py-3 border-t border-(--border-mid) bg-(--bg-panel)">
				<div className="text-(--text-dark) font-mono text-[10px]">
					SHOWING {offset + 1}-{Math.min(offset + limit, totalCount)} OF{" "}
					<span className="text-(--text-dim)">{totalCount} EVENTS</span>
				</div>
				<div className="flex gap-1">
					<button
						disabled={offset === 0}
						onClick={() => onPageChange(Math.max(0, offset - limit))}
						className="bg-transparent border border-(--border-dim) text-(--text-dim) font-mono px-2.5 py-1 cursor-pointer text-[10px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
					>
						PREV
					</button>
					<div className="flex items-center px-3 font-mono text-[10px] text-(--text-dim) border-x border-(--border-dim)">
						PAGE {currentPage} / {totalPages || 1}
					</div>
					<button
						disabled={offset + limit >= totalCount}
						onClick={() => onPageChange(offset + limit)}
						className="bg-transparent border border-(--border-dim) text-(--text-dim) font-mono px-2.5 py-1 cursor-pointer text-[10px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
					>
						NEXT
					</button>
				</div>
			</div>
		</div>
	);
};
