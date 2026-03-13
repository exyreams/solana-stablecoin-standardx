import { Copy } from "lucide-react";
import { type FC } from "react";
import { toast } from "sonner";
import type { AccountData } from "../../hooks/useAccount";
import { Badge } from "../ui/Badge";

interface AccountDetailsProps {
	account: AccountData;
}

export const AccountDetails: FC<AccountDetailsProps> = ({ account }) => {
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Address copied to clipboard");
	};

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) overflow-hidden max-w-[420px]">
			{/* Header */}
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent relative">
				<span className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest">
					Account Details
				</span>
				<Badge
					variant="accent"
					className="text-[9px] border-(--accent-primary)/50 text-(--accent-primary)"
				>
					TOKEN-2022
				</Badge>
			</div>

			<div className="p-5 space-y-6">
				{/* Wallet Address (if resolved) */}
				{account.resolvedFromWallet && (
					<div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20">
						<div className="text-[10px] uppercase text-blue-400 mb-1 font-bold">
							Owner Wallet
						</div>
						<div className="font-mono text-[12px] flex items-center justify-between text-blue-200">
							<span className="truncate">{account.resolvedFromWallet}</span>
							<Copy
								className="w-3 h-3 cursor-pointer hover:text-white ml-2 shrink-0"
								onClick={() => copyToClipboard(account.resolvedFromWallet!)}
							/>
						</div>
					</div>
				)}

				{/* Token Account Address */}
				<div>
					<div className="text-[10px] uppercase text-(--text-dim) mb-1 font-bold">
						{account.resolvedFromWallet
							? "Token Account (ATA)"
							: "Owner Address"}
					</div>
					<div className="font-mono text-[14px] flex items-center justify-between text-(--text-main)">
						<span className="truncate">{account.address}</span>
						<Copy
							className="w-3 h-3 text-(--text-dark) hover:text-(--accent-primary) cursor-pointer ml-2 shrink-0"
							onClick={() => copyToClipboard(account.address)}
						/>
					</div>
				</div>

				{/* Balance */}
				<div>
					<div className="text-[10px] uppercase text-(--text-dim) mb-1 font-bold">
						Balance
					</div>
					<div className="text-[28px] font-mono font-bold text-[#CCA352] tracking-tight">
						{account.balance}{" "}
						<span className="text-[12px] text-(--text-dim) font-normal ml-1">
							{account.symbol}
						</span>
					</div>
				</div>

				{/* Status Rows */}
				<div className="space-y-4 pt-4 border-t border-(--border-dim)">
					<div className="flex justify-between items-center bg-black/10 p-1.5 border border-(--border-dim)/30">
						<span className="text-[10px] uppercase text-(--text-dim) font-bold">
							Frozen Status
						</span>
						<Badge
							variant={account.isFrozen ? "danger" : "success"}
							className={`text-[9px] px-2 py-0 font-bold transition-all ${
								account.isFrozen
									? "bg-red-500/10 text-red-500 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse"
									: ""
							}`}
						>
							{account.isFrozen ? "FROZEN" : "ACTIVE"}
						</Badge>
					</div>

					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<span className="text-[10px] uppercase text-(--text-dim) font-bold">
								Blacklisted
							</span>
							<Badge
								variant="accent"
								className="text-[7px] border-(--warning)/30 text-(--warning) px-1 py-0"
							>
								SSS-2
							</Badge>
						</div>
						<Badge
							variant="success"
							className="text-[9px] px-2 py-0 border-transparent bg-emerald-500/10 text-emerald-500"
						>
							NOT BLACKLISTED
						</Badge>
					</div>

					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<span className="text-[10px] uppercase text-(--text-dim) font-bold">
								Confidential Transfers
							</span>
							<Badge
								variant="info"
								className="text-[7px] border-(--info)/30 text-(--info) px-1 py-0"
							>
								SSS-3
							</Badge>
						</div>
						<Badge
							variant="success"
							className="text-[9px] px-2 py-0 border-transparent bg-emerald-500/10 text-emerald-500"
						>
							APPROVED
						</Badge>
					</div>

					<div className="flex justify-between items-center">
						<span className="text-[10px] uppercase text-(--text-dim) font-bold">
							Delegate
						</span>
						<Badge
							variant="default"
							className="text-[9px] px-2 py-0 opacity-40"
						>
							{account.delegate
								? account.delegate.slice(0, 6).toUpperCase() + "..."
								: "NONE"}
						</Badge>
					</div>

					<div className="flex justify-between items-center pt-2 border-t border-(--border-dim)/30">
						<span className="text-[10px] uppercase text-(--text-dim) font-bold">
							Token Mint
						</span>
						<div className="font-mono text-[9px] text-(--text-dim) flex items-center gap-1">
							{account.mint.slice(0, 8)}...
							<Copy
								className="w-2.5 h-2.5 cursor-pointer hover:text-(--accent-primary)"
								onClick={() => copyToClipboard(account.mint)}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
