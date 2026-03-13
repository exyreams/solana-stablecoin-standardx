import {
	Copy,
	ExternalLink,
	History as HistoryIcon,
	Loader2,
} from "lucide-react";
import { type FC, useState } from "react";
import { toast } from "sonner";
import { useTokens } from "../../contexts/TokenContext";
import type { SeizureRecord } from "../../hooks/useCompliance";

interface SeizureHistoryProps {
	history: SeizureRecord[];
	isLoading: boolean;
}

export const SeizureHistory: FC<SeizureHistoryProps> = ({
	history,
	isLoading,
}) => {
	const { selectedToken } = useTokens();
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 7;

	const totalPages = Math.ceil(history.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentItems = history.slice(startIndex, startIndex + itemsPerPage);

	const formatAddress = (addr: string) => {
		if (!addr || addr === "-") return "-";
		if (addr.length <= 10) return addr;
		return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
	};

	const copyToClipboard = (text: string) => {
		if (!text || text === "-") return;
		navigator.clipboard.writeText(text);
		toast.success("Address copied to clipboard");
	};

	const formatAmount = (amount: string) => {
		const decimals = selectedToken?.onChain?.decimals || 6;
		const val = Number(amount) / Math.pow(10, decimals);
		return val.toLocaleString(undefined, { minimumFractionDigits: 2 });
	};

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) flex flex-col h-full">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent shrink-0">
				<div className="flex items-center gap-2">
					<HistoryIcon className="w-3.5 h-3.5 text-(--accent-primary)" />
					<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
						Seizure History
					</span>
				</div>
				<div className="flex items-center gap-2 border-l border-(--border-dim) pl-4 h-4 ml-2">
					<span className="text-[9px] font-mono text-(--text-dark) uppercase tracking-tighter">
						Audit Shell v1.0.2
					</span>
				</div>
			</div>

			<div className="flex-grow overflow-auto">
				<table className="w-full font-mono text-[11px] border-collapse">
					<thead className="sticky top-0 bg-(--bg-panel) z-10">
						<tr className="border-b border-(--border-mid)">
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								From
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								To/Treasury
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Amount
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Status
							</th>
							<th className="text-right p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Action
							</th>
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td colSpan={4} className="p-10 text-center text-(--text-dark)">
									<Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 opacity-50" />
									<span className="text-[10px] uppercase tracking-widest">
										Interrogating Audit Logs...
									</span>
								</td>
							</tr>
						) : currentItems.length === 0 ? (
							<tr>
								<td
									colSpan={4}
									className="p-10 text-center text-(--text-dark) italic"
								>
									No seizure events recorded.
								</td>
							</tr>
						) : (
							currentItems.map((record, index) => (
								<tr
									key={index}
									className="border-b border-(--border-dim) hover:bg-white/[0.02] transition-colors group"
								>
									<td className="p-3">
										<div className="flex items-center gap-2">
											<span className="text-(--text-main) font-medium">
												{formatAddress(record.from)}
											</span>
											<button
												onClick={() => copyToClipboard(record.from)}
												className="opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<Copy className="w-2.5 h-2.5 text-(--text-dark) hover:text-(--accent-primary)" />
											</button>
										</div>
									</td>
									<td className="p-3">
										<div className="flex items-center gap-2">
											<span className="text-(--text-dim)">
												{formatAddress(record.to)}
											</span>
											{record.to !== "-" && (
												<button
													onClick={() => copyToClipboard(record.to)}
													className="opacity-0 group-hover:opacity-100 transition-opacity"
												>
													<Copy className="w-2.5 h-2.5 text-(--text-dark) hover:text-(--accent-primary)" />
												</button>
											)}
										</div>
									</td>
									<td className="p-3">
										<div className="font-mono text-[#ff4444] font-medium flex items-center gap-1 tabular-nums">
											<span>-{formatAmount(record.amount)}</span>
											<span className="text-[10px] opacity-60 font-sans uppercase font-bold">
												{selectedToken?.symbol}
											</span>
										</div>
									</td>
									<td className="p-3">
										<div className="flex items-center">
											<span className="text-[8px] font-bold px-1.5 py-0.5 rounded-none border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 tracking-tighter uppercase">
												FINALIZED
											</span>
										</div>
									</td>
									<td className="p-3 text-right">
										<a
											href={`https://solscan.io/tx/${record.signature}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-(--accent-primary) opacity-40 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 text-[9px] font-bold"
										>
											EXPLORER
											<ExternalLink className="w-2.5 h-2.5" />
										</a>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{totalPages > 1 && (
				<div className="flex justify-center items-center gap-1 p-4 font-mono text-[10px] border-t border-(--border-dim) shrink-0 bg-(--bg-panel)/50">
					<button
						className="px-2 py-1 border border-(--border-mid) bg-(--bg-panel) text-(--text-dim) disabled:opacity-30"
						onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
						disabled={currentPage === 1}
					>
						PREV
					</button>
					<div className="px-3 text-(--text-dark)">
						PAGE {currentPage} / {totalPages}
					</div>
					<button
						className="px-2 py-1 border border-(--border-mid) bg-(--bg-panel) text-(--text-dim) disabled:opacity-30"
						onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
						disabled={currentPage === totalPages}
					>
						NEXT
					</button>
				</div>
			)}
		</div>
	);
};
