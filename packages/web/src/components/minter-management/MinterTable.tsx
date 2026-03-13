import { Copy, RefreshCw } from "lucide-react";
import type { FC } from "react";
import { toast } from "sonner";
import type { MinterResponse } from "../../lib/api/admin";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface MinterTableProps {
	minters: MinterResponse[];
	isLoading: boolean;
	onEdit: (minter: MinterResponse) => void;
	onRemove: (minter: MinterResponse) => void;
	onReset: (minter: MinterResponse) => void;
	backendAuthority?: string;
	decimals?: number;
}

export const MinterTable: FC<MinterTableProps> = ({
	minters,
	isLoading,
	onEdit,
	onRemove,
	onReset,
	backendAuthority,
	decimals = 6,
}) => {
	const getProgressPercentage = (minter: MinterResponse): number => {
		const quota = BigInt(minter.quota);
		if (quota === 0n) return 100;
		const minted = BigInt(minter.minted);
		return Number((minted * 100n) / quota);
	};

	const getProgressColor = (percentage: number): string => {
		if (percentage >= 98) return "var(--danger)";
		if (percentage >= 75) return "var(--accent-primary)";
		return "var(--accent-primary)";
	};

	if (isLoading) {
		return (
			<div className="bg-(--bg-panel) border border-(--border-mid) p-12 flex flex-col items-center justify-center gap-4">
				<div className="w-8 h-8 border-2 border-(--accent-primary) border-t-transparent rounded-full animate-spin" />
				<span className="text-[10px] text-(--text-dim) uppercase font-mono">
					Fetching minter records...
				</span>
			</div>
		);
	}

	if (minters.length === 0) {
		return (
			<div className="bg-(--bg-panel) border border-(--border-mid) p-12 flex flex-col items-center justify-center gap-4">
				<span className="text-[10px] text-(--text-dim) uppercase font-mono">
					No minters configured for this token.
				</span>
			</div>
		);
	}

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) overflow-x-auto">
			<table className="w-full font-mono text-[11px] whitespace-nowrap">
				<thead>
					<tr className="border-b border-(--border-mid)">
						<th className="text-left p-4 text-(--text-dark) uppercase text-[10px] font-normal">
							Address
						</th>
						<th className="text-left p-4 text-(--text-dark) uppercase text-[10px] font-normal">
							Status
						</th>
						<th className="text-left p-4 text-(--text-dark) uppercase text-[10px] font-normal">
							Quota
						</th>
						<th className="text-left p-4 text-(--text-dark) uppercase text-[10px] font-normal">
							Minted
						</th>
						<th className="text-left p-4 text-(--text-dark) uppercase text-[10px] font-normal">
							Remaining
						</th>
						<th className="text-right p-4 text-(--text-dark) uppercase text-[10px] font-normal">
							Actions
						</th>
					</tr>
				</thead>
				<tbody>
					{minters.map((minter, index) => {
						const progress = getProgressPercentage(minter);
						const quota = BigInt(minter.quota);
						const minted = BigInt(minter.minted);
						const remaining = quota === 0n ? null : quota - minted;
						const multiplier = 10 ** decimals;

						const formattedQuota =
							quota === 0n
								? "UNLIMITED"
								: (Number(quota) / multiplier).toLocaleString();
						const formattedMinted = (
							Number(minted) / multiplier
						).toLocaleString();
						const formattedRemaining =
							remaining === null
								? "∞"
								: (Number(remaining) / multiplier).toLocaleString();

						const isAuthority = minter.minter === backendAuthority;

						return (
							<tr key={index} className="border-b border-(--border-dim)">
								<td className="p-4">
									<div className="flex items-center gap-2">
										<span className="text-(--text-main)">
											{minter.minter.slice(0, 6)}...{minter.minter.slice(-6)}
										</span>
										{isAuthority && (
											<Badge
												variant="danger"
												className="text-[9px] px-1.5 py-0"
											>
												AUTHORITY
											</Badge>
										)}
										<Copy
											className="w-3 h-3 text-(--text-dark) hover:text-(--accent-primary) cursor-pointer"
											onClick={() => {
												navigator.clipboard.writeText(minter.minter);
												toast.success("Address copied to clipboard");
											}}
										/>
									</div>
								</td>
								<td className="p-4">
									<Badge variant={minter.active ? "success" : "danger"}>
										{minter.active ? "ACTIVE" : "INACTIVE"}
									</Badge>
								</td>
								<td className="p-4">
									{quota === 0n ? (
										<Badge variant="accent">UNLIMITED</Badge>
									) : (
										formattedQuota
									)}
								</td>
								<td className="p-4">{formattedMinted}</td>
								<td className="p-4">
									<div className="flex items-center gap-2">
										{quota !== 0n && (
											<div className="w-16 h-1 bg-(--border-dim) relative overflow-hidden">
												<div
													className="h-full transition-all duration-500"
													style={{
														width: `${progress}%`,
														background: getProgressColor(progress),
													}}
												/>
											</div>
										)}
										<span
											className={
												quota !== 0n &&
												remaining !== null &&
												remaining < BigInt(1000 * multiplier)
													? "text-(--danger) font-bold"
													: ""
											}
										>
											{formattedRemaining}
										</span>
									</div>
								</td>
								<td className="p-4 text-right">
									<div className="flex gap-1 justify-end">
										<Button
											variant="secondary"
											size="sm"
											onClick={() => onEdit(minter)}
										>
											EDIT
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onReset(minter)}
										>
											<RefreshCw className="w-3 h-3" />
										</Button>
										<Button
											variant="danger"
											size="sm"
											onClick={() => onRemove(minter)}
										>
											REMOVE
										</Button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
};
