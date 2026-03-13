import { Copy, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { type FC, useMemo, useState } from "react";
import { type BlacklistEntry, useBlacklist } from "../../hooks/useBlacklist";
import { BlacklistDetailsModal } from "./BlacklistDetailsModal";

interface BlacklistTableProps {
	searchQuery?: string;
	reasonKeyword?: string;
}

const ReasonCell: FC<{ reason: string }> = ({ reason }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const isLong = reason.length > 40;

	return (
		<td className="p-4 max-w-[240px]">
			<div className="text-(--text-dim) break-words whitespace-normal">
				{isExpanded || !isLong ? reason : `${reason.slice(0, 40)}...`}
				{isLong && (
					<span
						className="text-(--accent-primary) underline cursor-pointer text-[9px] ml-1.5 uppercase font-bold"
						onClick={() => setIsExpanded(!isExpanded)}
					>
						{isExpanded ? "COLLAPSE" : "EXPAND"}
					</span>
				)}
			</div>
		</td>
	);
};

export const BlacklistTable: FC<BlacklistTableProps> = ({
	searchQuery = "",
	reasonKeyword = "",
}) => {
	const { entries, isLoading, refresh, removeFromBlacklist } = useBlacklist();
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedEntry, setSelectedEntry] = useState<BlacklistEntry | null>(
		null,
	);
	const itemsPerPage = 8;

	const formatAddress = (addr: string) => {
		return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
	};

	const formatDate = (ts: number) => {
		const d = new Date(ts);
		return {
			date: d.toLocaleDateString(undefined, {
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}),
			time: d.toLocaleTimeString(undefined, {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false,
			}),
		};
	};

	const filteredEntries = useMemo(() => {
		return entries.filter((item) => {
			const matchesSearch =
				item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.reason.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesKeyword =
				!reasonKeyword ||
				item.reason.toLowerCase().includes(reasonKeyword.toLowerCase());
			return matchesSearch && matchesKeyword;
		});
	}, [entries, searchQuery, reasonKeyword]);

	const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
	const paginatedEntries = filteredEntries.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage,
	);

	if (isLoading && entries.length === 0) {
		return (
			<div className="bg-(--bg-panel) border border-(--border-mid) p-12 flex flex-col items-center justify-center gap-4">
				<Loader2 className="w-8 h-8 animate-spin text-(--accent-primary)" />
				<span className="text-xs font-mono text-(--text-dim) uppercase">
					Syncing with Mainnet...
				</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-between items-center mb-1">
				<div className="text-(--text-dim) font-mono text-[10px] uppercase">
					{filteredEntries.length} ADDRESSES BLACKLISTED
				</div>
				<button
					onClick={() => refresh(true)}
					disabled={isLoading}
					className="text-(--text-dark) hover:text-(--accent-primary) transition-colors p-1"
					title="Force Refresh"
				>
					<RefreshCw
						className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
					/>
				</button>
			</div>

			<div className="panel border border-(--border-mid) bg-(--bg-panel)/80">
				<table className="w-full border-collapse font-mono text-[11px]">
					<thead>
						<tr className="border-b border-(--border-mid)">
							<th className="text-left p-4 text-(--text-main) uppercase font-normal text-[10px]">
								Address
							</th>
							<th className="text-left p-4 text-(--text-main) uppercase font-normal text-[10px]">
								Reason
							</th>
							<th className="text-left p-4 text-(--text-main) uppercase font-normal text-[10px]">
								Added By
							</th>
							<th className="text-left p-4 text-(--text-main) uppercase font-normal text-[10px]">
								Added At
							</th>
							<th className="text-right p-4 text-(--text-main) uppercase font-normal text-[10px]">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-(--border-dim)">
						{paginatedEntries.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="p-12 text-center text-(--text-dark) uppercase italic"
								>
									No records found matching criteria
								</td>
							</tr>
						) : (
							paginatedEntries.map((item) => {
								const formatted = formatDate(item.timestamp);
								return (
									<tr
										key={item.address}
										className="group hover:bg-white/[0.02] transition-colors"
									>
										<td className="p-4">
											<div className="flex items-center gap-2">
												<span className="text-(--text-main) font-bold truncate max-w-[140px]">
													{formatAddress(item.address)}
												</span>
												<div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1.5">
													<button
														className="text-(--text-dark) hover:text-(--accent-primary)"
														onClick={() =>
															navigator.clipboard.writeText(item.address)
														}
													>
														<Copy className="w-3 h-3" />
													</button>
													<button
														className="text-(--text-dark) hover:text-(--accent-primary)"
														onClick={() =>
															window.open(
																`https://solscan.io/account/${item.address}`,
																"_blank",
															)
														}
													>
														<ExternalLink className="w-3 h-3" />
													</button>
												</div>
											</div>
										</td>
										<ReasonCell reason={item.reason} />
										<td className="p-4 text-(--text-dark)">
											<span className="bg-white/[0.03] px-1.5 py-0.5 border border-(--border-dim)">
												MASTER
											</span>
										</td>
										<td className="p-4 leading-tight">
											<div className="text-(--text-main)">{formatted.date}</div>
											<div className="text-(--text-dark) text-[9px]">
												{formatted.time}
											</div>
										</td>
										<td className="p-4 text-right">
											<div className="flex items-center justify-end gap-2">
												<button
													className="text-blue-500 border border-blue-500/50 hover:bg-blue-500/10 px-2 py-1 text-[9px] transition-all"
													onClick={() => setSelectedEntry(item)}
												>
													DETAILS
												</button>
												<button
													className="text-(--accent-red) border border-dashed border-(--accent-red)/30 hover:bg-(--accent-red)/5 px-2 py-1 text-[9px] transition-all"
													onClick={() => removeFromBlacklist(item.address)}
												>
													REMOVE
												</button>
											</div>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex justify-end items-center gap-1.5 mt-2">
					<button
						disabled={currentPage === 1}
						onClick={() => setCurrentPage((p) => p - 1)}
						className="px-2 py-1 border border-(--border-dim) bg-(--bg-panel) text-(--text-dark) text-[10px] hover:border-(--border-mid) disabled:opacity-30 disabled:cursor-not-allowed font-mono transition-colors"
					>
						PREV
					</button>
					{[...Array(totalPages)].map((_, i) => (
						<button
							key={i + 1}
							onClick={() => setCurrentPage(i + 1)}
							className={`w-7 h-7 flex items-center justify-center border text-[10px] font-mono transition-all ${
								currentPage === i + 1
									? "border-(--accent-primary) text-(--accent-primary) bg-(--accent-primary)/5"
									: "border-(--border-dim) text-(--text-dim) hover:border-(--border-mid)"
							}`}
						>
							{i + 1}
						</button>
					))}
					<button
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage((p) => p + 1)}
						className="px-2 py-1 border border-(--border-dim) bg-(--bg-panel) text-(--text-dark) text-[10px] hover:border-(--border-mid) disabled:opacity-30 disabled:cursor-not-allowed font-mono transition-colors"
					>
						NEXT
					</button>
				</div>
			)}

			<BlacklistDetailsModal
				entry={selectedEntry}
				isOpen={!!selectedEntry}
				onClose={() => setSelectedEntry(null)}
			/>
		</div>
	);
};
