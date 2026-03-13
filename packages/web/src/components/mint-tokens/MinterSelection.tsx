import { AlertCircle, ShieldCheck } from "lucide-react";
import { type FC, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { MinterResponse } from "../../lib/api/admin";

interface MinterSelectionProps {
	minters: MinterResponse[];
	selectedMinter: MinterResponse | null;
	onSelect: (minter: MinterResponse) => void;
	amountToMint: number;
	onQuotaStatusChange?: (isOverQuota: boolean) => void;
	backendAuthority?: string;
	isLoading?: boolean;
	decimals: number;
	publicKey?: string | null;
}

export const MinterSelection: FC<MinterSelectionProps> = ({
	minters,
	selectedMinter,
	onSelect,
	amountToMint,
	onQuotaStatusChange,
	backendAuthority,
	isLoading = false,
	decimals,
	publicKey,
}) => {
	const { user } = useAuth();
	const isAdmin = user?.role === "ADMIN";

	const getProgressPercentage = (minter: MinterResponse): number => {
		const quota = BigInt(minter.quota);
		if (quota === 0n) return 0;
		const minted = BigInt(minter.minted);
		return Number((minted * 100n) / quota);
	};

	const getProjectedPercentage = (
		minter: MinterResponse,
		amount: number,
	): number => {
		const quota = BigInt(minter.quota);
		if (quota === 0n) return 0;
		const multiplier = 10 ** decimals;
		const project = BigInt(Math.floor(amount * multiplier));
		return Number((project * 100n) / quota);
	};

	const quota = selectedMinter ? BigInt(selectedMinter.quota) : 0n;
	const minted = selectedMinter ? BigInt(selectedMinter.minted) : 0n;
	const multiplier = 10 ** decimals;
	const amountBN = BigInt(Math.floor(amountToMint * multiplier));
	const isOverQuota = quota !== 0n && minted + amountBN > quota;

	const remaining = quota === 0n ? null : quota - minted;
	const progress = selectedMinter ? getProgressPercentage(selectedMinter) : 0;
	const projectedProgress = selectedMinter
		? getProjectedPercentage(selectedMinter, amountToMint)
		: 0;

	const isFull = quota !== 0n && minted >= quota;
	const willBeFull = quota !== 0n && minted + amountBN >= quota;

	const isWalletMismatch =
		!isAdmin &&
		selectedMinter &&
		publicKey &&
		selectedMinter.minter !== publicKey;

	// Notify parent of quota status via effect to avoid render updates
	useEffect(() => {
		if (onQuotaStatusChange) {
			onQuotaStatusChange(isOverQuota);
		}
	}, [isOverQuota, onQuotaStatusChange]);

	if (isLoading) {
		return (
			<div className="bg-(--bg-panel) border border-(--border-mid) p-6 animate-pulse">
				<div className="h-4 w-24 bg-(--border-dim) mb-4" />
				<div className="h-10 w-full bg-(--bg-input) mb-3" />
				<div className="h-12 w-full bg-(--bg-surface)" />
			</div>
		);
	}

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-6">
			<div className="flex items-center justify-between mb-4">
				<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Minter Authority
				</div>
				{selectedMinter?.active && (
					<div className="flex items-center gap-1 text-[9px] text-[#00ff88] px-1.5 py-0.5 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-sm">
						<ShieldCheck className="w-3 h-3" />
						ACTIVE
					</div>
				)}
				{isAdmin && selectedMinter?.minter === backendAuthority && (
					<div className="flex items-center gap-1 text-[9px] text-[#FF4444] px-1.5 py-0.5 bg-[#FF4444]/10 border border-[#FF4444]/20 rounded-sm font-bold ml-auto mr-2">
						AUTHORITY
					</div>
				)}
			</div>

			<div className="space-y-4">
				<div>
					<label className="block text-[10px] font-mono text-(--text-dark) uppercase mb-2">
						Authorize Minter Account
					</label>
					<select
						className="w-full px-3 py-2 bg-(--bg-input) border border-(--border-mid) text-(--text-main) font-mono text-xs focus:border-(--accent-primary) focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						value={selectedMinter?.minter || ""}
						disabled={!isAdmin || isLoading}
						onChange={(e) => {
							const found = minters.find((m) => m.minter === e.target.value);
							if (found) onSelect(found);
						}}
					>
						{minters
							.filter((m) => isAdmin || m.minter !== backendAuthority)
							.map((m) => (
								<option key={m.minter} value={m.minter}>
									{isAdmin && m.minter === backendAuthority
										? `AUTHORITY | ${m.minter.slice(0, 8)}...${m.minter.slice(-8)}`
										: `${m.minter.slice(0, 12)}...${m.minter.slice(-12)}`}
								</option>
							))}
						{minters.length === 0 && <option disabled>No minters found</option>}
					</select>
					{!isAdmin && !selectedMinter && !isLoading && (
						<div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 text-[10px] text-yellow-500 font-mono flex items-center gap-2">
							<AlertCircle className="w-3 h-3" />
							{publicKey
								? "YOUR WALLET IS NOT AN AUTHORIZED MINTER"
								: "PLEASE CONNECT WALLET TO CONTINUE"}
						</div>
					)}
					{isWalletMismatch && (
						<div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 text-[10px] text-red-500 font-mono font-bold flex items-center gap-2 animate-pulse">
							<AlertCircle className="w-3 h-3" />
							WALLET MISMATCH: CONNECTED WALLET DOES NOT MATCH SELECTION
						</div>
					)}
				</div>

				{selectedMinter && (
					<div className="space-y-3">
						<div className="flex items-center justify-between p-3 bg-(--bg-surface) border border-(--border-mid) group hover:border-(--border-main) transition-colors">
							<div>
								<div className="text-[10px] font-mono text-(--text-dim) uppercase mb-1">
									Minter Quota
								</div>
								<div className="text-[10px] text-(--text-dark)">
									{quota === 0n
										? "Unlimited Supply"
										: `of ${(Number(quota) / multiplier).toLocaleString()} max`}
								</div>
							</div>
							<div className="text-right">
								<div
									className={`text-lg font-mono leading-none ${
										isFull || isOverQuota
											? "text-[#FF4444]"
											: remaining !== null &&
													remaining < BigInt(multiplier * 1000)
												? "text-(--warning)"
												: "text-(--accent-primary)"
									}`}
								>
									{remaining === null
										? "∞"
										: (Number(remaining) / multiplier).toLocaleString()}
								</div>
								<div className="text-[9px] text-(--text-dark) uppercase mt-1">
									Remaining
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<div className="w-full bg-(--bg-surface) h-1.5 overflow-hidden border border-(--border-dim) relative">
								{/* Projected Progress */}
								<div
									className={`h-full opacity-40 transition-all duration-500 absolute top-0 z-0 ${
										willBeFull || isOverQuota
											? "bg-[#FF4444]"
											: "bg-(--accent-primary)"
									}`}
									style={{
										width: `${Math.min(100, progress + projectedProgress)}%`,
									}}
								/>
								{/* Current Progress */}
								<div
									className={`h-full transition-all duration-500 relative z-10 ${
										isFull ? "bg-[#FF4444]" : "bg-(--accent-primary)"
									}`}
									style={{ width: `${Math.min(100, progress)}%` }}
								/>
							</div>

							{(isOverQuota || isFull) && (
								<div className="flex items-center gap-2 text-[#FF4444] text-[10px] font-mono animate-pulse uppercase">
									<AlertCircle className="w-3 h-3" />
									{isOverQuota
										? "INSUFFICIENT QUOTA FOR TRANSACTION"
										: "QUOTA EXHAUSTED"}
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
