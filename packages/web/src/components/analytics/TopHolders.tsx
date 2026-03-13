import { ExternalLink } from "lucide-react";
import type { FC } from "react";

interface TopHoldersProps {
	holders: {
		rank: number;
		address: string;
		owner: string;
		balance: string;
		percentage: string;
		status: string;
		lastActivity: string;
	}[];
	rpcError?: boolean;
}

export const TopHolders: FC<TopHoldersProps> = ({ holders, rpcError }) => {
	const openExplorer = (address: string) => {
		window.open(
			`https://explorer.solana.com/address/${address}?cluster=devnet`,
			"_blank",
		);
	};

	return (
		<div className="bg-(--bg-panel) border border(--border-mid)">
			<div className="border-b border-(--border-dim) px-6 py-2.5 bg-linear-to-r from-(--bg-surface) to-transparent">
				<div className="flex items-center justify-between">
					<div className="text-[9px] uppercase text-(--text-dim) font-bold tracking-widest">
						Token Holders
					</div>
					{rpcError && (
						<div className="text-[9px] text-[#ffdd57] font-mono animate-pulse">
							SOLANA RPC UNAVAILABLE
						</div>
					)}
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full border-collapse font-mono text-[11px]">
					<thead>
						<tr className="border-b border-(--border-mid)">
							<th className="text-left px-6 py-3 text-[9px] text-(--text-dark) font-normal uppercase tracking-widest">
								Rank
							</th>
							<th className="text-left px-6 py-3 text-[9px] text-(--text-dark) font-normal uppercase tracking-widest">
								Address
							</th>
							<th className="text-right px-6 py-3 text-[9px] text-(--text-dark) font-normal uppercase tracking-widest">
								Balance
							</th>
							<th className="text-left px-6 py-3 text-[9px] text-(--text-dark) font-normal uppercase tracking-widest w-48">
								% of Supply
							</th>
							<th className="text-left px-6 py-3 text-[9px] text-(--text-dark) font-normal uppercase tracking-widest">
								Status
							</th>
							<th className="text-left px-6 py-3 text-[9px] text-(--text-dark) font-normal uppercase tracking-widest">
								Last Activity
							</th>
						</tr>
					</thead>
					<tbody className="text-[11px]">
						{holders.length === 0 ? (
							<tr>
								<td colSpan={6} className="py-12 text-center text-(--text-dim)">
									{rpcError
										? "Unable to fetch holder data."
										: "No holders found."}
								</td>
							</tr>
						) : (
							holders.map((holder) => (
								<tr
									key={holder.rank}
									className="border-b border-(--border-dim) hover:bg-(--bg-surface)/30 group"
								>
									<td className="px-6 py-3 text-(--text-dark)">
										#{holder.rank}
									</td>
									<td className="px-6 py-3">
										<div className="flex items-center gap-2 text-(--text-main)">
											<span>
												{holder.address.slice(0, 4)}...
												{holder.address.slice(-4)}
											</span>
											<div
												className="w-2.5 h-2.5 border border-(--text-dark) opacity-40 group-hover:opacity-100 cursor-pointer"
												title="Copy"
											/>
											<button
												onClick={() => openExplorer(holder.address)}
												className="opacity-0 group-hover:opacity-100 transition-opacity"
											>
												<ExternalLink className="w-3 h-3 text-(--text-dim) hover:text-(--accent-primary)" />
											</button>
										</div>
									</td>
									<td className="px-6 py-3 text-right text-(--text-main)">
										{holder.balance}
									</td>
									<td className="px-6 py-3">
										<div className="flex items-center gap-3">
											<span className="w-10 text-right text-[10px]">
												{holder.percentage}%
											</span>
											<div className="h-[3px] bg-(--border-mid) flex-1 relative">
												<div
													className="h-full bg-(--accent-primary)"
													style={{ width: `${holder.percentage}%` }}
												/>
											</div>
										</div>
									</td>
									<td className="px-6 py-3">
										<span
											className={`px-2 py-0.5 text-[9px] border font-bold ${
												holder.status === "NORMAL"
													? "border-(--status-green) text-(--status-green) bg-(--status-green)/5"
													: holder.status === "FROZEN"
														? "border-(--status-amber) text-(--status-amber) bg-(--status-amber)/5"
														: "border-(--status-red) text-(--status-red) bg-(--status-red)/5"
											}`}
										>
											{holder.status}
										</span>
									</td>
									<td className="px-6 py-3 text-[9px] text-(--text-dim) leading-tight">
										{new Date().toISOString().split("T")[0].replace(/-/g, ".")}
										<br />
										{new Date().toLocaleTimeString([], { hour12: false })}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<div className="p-4 flex gap-1 border-t border-(--border-dim)">
				<button className="px-2.5 py-1 border border-(--border-dim) text-[9px] font-mono text-(--text-dim) hover:border-(--accent-primary) tracking-widest uppercase">
					PREV
				</button>
				<button className="px-2.5 py-1 border border-(--accent-primary) text-[9px] font-mono text-(--accent-primary) tracking-widest">
					1
				</button>
				<button className="px-2.5 py-1 border border-(--border-dim) text-[9px] font-mono text-(--text-dim) hover:border-(--accent-primary) tracking-widest">
					2
				</button>
				<button className="px-2.5 py-1 border border-(--border-dim) text-[9px] font-mono text-(--text-dim) hover:border-(--accent-primary) tracking-widest uppercase">
					NEXT
				</button>
			</div>
		</div>
	);
};
