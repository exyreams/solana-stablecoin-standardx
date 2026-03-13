import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Copy, Fingerprint } from "lucide-react";
import { type FC, useState } from "react";
import { toast } from "sonner";
import type { AccountData } from "../../hooks/useAccount";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Badge } from "../ui/Badge";

interface AccountManagementDetailsProps {
	account: AccountData;
	onActionComplete: () => Promise<void>;
}

export const AccountManagementDetails: FC<AccountManagementDetailsProps> = ({
	account,
	onActionComplete,
}) => {
	const { publicKey, signTransaction } = useWallet();
	const [isLoading, setIsLoading] = useState(false);

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Address copied to clipboard");
	};

	const handleAction = async (
		action: "freeze" | "thaw" | "blacklist" | "seize",
	) => {
		if (!publicKey || !signTransaction) {
			toast.error("Wallet not connected");
			return;
		}

		try {
			setIsLoading(true);
			switch (action) {
				case "freeze":
					await stablecoinApi.freeze(account.address, "Manual freeze");
					toast.success("Account frozen successfully");
					break;
				case "thaw":
					await stablecoinApi.thaw(account.address, "Manual thaw");
					toast.success("Account thawed successfully");
					break;
				case "blacklist":
					await stablecoinApi.blacklist(
						account.address,
						"Regulatory compliance check",
					);
					toast.success("Address added to blacklist");
					break;
				case "seize":
					toast.info("Seize requires a destination treasury address.");
					break;
			}
			await onActionComplete();
		} catch (e: any) {
			console.error("Action failed:", e);
			toast.error(`Action failed: ${e.response?.data?.error || e.message}`);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) flex flex-col shrink-0">
			{/* Panel Header */}
			<div className="border-b border-(--border-dim) padding-m flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent p-4">
				<span className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest">
					Account Details
				</span>
				<Badge variant="accent" className="text-[9px]">
					TOKEN-2022
				</Badge>
			</div>

			<div className="p-5">
				{/* Owner Address */}
				<div className="mb-6">
					<div className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest mb-1">
						Owner Address
					</div>
					<div className="font-mono text-[12px] flex items-center gap-2 text-(--text-main)">
						<span className="truncate max-w-[200px]">
							{account.resolvedFromWallet || account.owner}
						</span>
						<Copy
							className="w-3 h-3 text-(--text-dark) hover:text-(--accent-primary) cursor-pointer"
							onClick={() =>
								copyToClipboard(account.resolvedFromWallet || account.owner)
							}
						/>
					</div>
				</div>

				{/* Balance */}
				<div className="mb-6">
					<div className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest mb-1">
						Balance
					</div>
					<div className="text-[24px] font-mono font-light text-(--text-main) leading-none mt-2">
						{account.balance}{" "}
						<span className="text-[14px] text-(--text-dim) font-normal">
							{account.symbol}
						</span>
					</div>
				</div>

				{/* Status List */}
				<div className="space-y-3 mb-8">
					<div className="flex justify-between items-center">
						<span className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest">
							Frozen Status
						</span>
						<Badge
							variant={account.isFrozen ? "danger" : "default"}
							className={`text-[9px] ${account.isFrozen ? "bg-red-900/10 border-red-500 text-red-500" : "opacity-40"}`}
						>
							{account.isFrozen ? "FROZEN" : "ACTIVE"}
						</Badge>
					</div>

					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<span className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest">
								Blacklisted
							</span>
							<Badge
								variant="accent"
								className="text-[7px] py-0 px-1 border-(--accent-primary) text-(--accent-primary)"
							>
								SSS-2
							</Badge>
						</div>
						<Badge
							variant="success"
							className="text-[9px] bg-green-900/10 border-green-500 text-green-500"
						>
							NOT BLACKLISTED
						</Badge>
					</div>

					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<span className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest">
								Confidential Transfers
							</span>
							<Badge
								variant="info"
								className="text-[7px] py-0 px-1 border-(--info) text-(--info)"
							>
								SSS-3
							</Badge>
						</div>
						<Badge
							variant="success"
							className="text-[9px] bg-green-900/10 border-green-500 text-green-500"
						>
							APPROVED
						</Badge>
					</div>

					<div className="flex justify-between items-center">
						<span className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest">
							Delegate
						</span>
						<Badge variant="default" className="text-[9px] opacity-40">
							{account.delegate ? account.delegate.slice(0, 8) + "..." : "NONE"}
						</Badge>
					</div>
				</div>

				{/* Available Actions Header */}
				<div className="pt-6 border-t border-(--border-dim) mb-4">
					<span className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest">
						Available Actions
					</span>
				</div>

				{/* Actions Grid */}
				<div className="grid grid-cols-2 gap-3">
					{!account.isFrozen ? (
						<button
							className="bg-transparent border border-(--accent-primary) text-(--accent-primary) p-3 text-left transition-all relative flex flex-col justify-between h-[70px] hover:bg-(--accent-primary)/5"
							onClick={() => handleAction("freeze")}
							disabled={isLoading}
						>
							<span className="text-[10px] font-bold uppercase">
								Freeze Account
							</span>
							<span className="text-[8px] opacity-60 font-normal">
								Restrict all transfers immediately
							</span>
						</button>
					) : (
						<button
							className="bg-transparent border border-(--border-dim) text-(--text-dim) p-3 text-left h-[70px] opacity-40 cursor-not-allowed flex flex-col justify-between"
							disabled
						>
							<span className="text-[10px] font-bold uppercase">
								Freeze Account
							</span>
							<span className="text-[8px] font-normal">
								Account is already frozen
							</span>
						</button>
					)}

					<button
						className={`p-3 text-left transition-all flex flex-col justify-between h-[70px] border ${
							account.isFrozen
								? "border-(--accent-primary) text-(--accent-primary) hover:bg-(--accent-primary)/5"
								: "border-(--border-dim) text-(--text-dim) opacity-40 cursor-not-allowed"
						}`}
						onClick={() => handleAction("thaw")}
						disabled={isLoading || !account.isFrozen}
					>
						<span className="text-[10px] font-bold uppercase">
							Thaw Account
						</span>
						<span className="text-[8px] opacity-60 font-normal">
							Restore account transferability
						</span>
					</button>

					<button
						className="bg-transparent border border-dashed border-(--danger) text-(--danger) p-3 text-left transition-all relative flex flex-col justify-between h-[70px] hover:bg-(--danger)/5"
						onClick={() => handleAction("blacklist")}
						disabled={isLoading}
					>
						<Badge
							variant="accent"
							className="absolute right-1 top-1 text-[7px] py-0 px-1 border-(--danger)/40 text-(--danger)"
						>
							SSS-2
						</Badge>
						<span className="text-[10px] font-bold uppercase">
							Add to Blacklist
						</span>
						<span className="text-[8px] opacity-60 font-normal">
							Global protocol-level denial
						</span>
					</button>

					<button
						className="bg-(--danger) text-white p-3 text-left transition-all relative flex flex-col justify-between h-[70px] hover:brightness-110 border-none"
						onClick={() => handleAction("seize")}
						disabled={isLoading}
					>
						<Badge
							variant="default"
							className="absolute right-1 top-1 text-[7px] py-0 px-1 border-white/40 text-white"
						>
							SSS-2
						</Badge>
						<span className="text-[10px] font-bold uppercase">
							Seize Tokens
						</span>
						<span className="text-[8px] opacity-80 font-normal">
							Transfer balance to treasury
						</span>
					</button>

					<button
						className="col-span-2 bg-transparent border border-(--info) text-(--info) p-3 text-left transition-all relative flex flex-col justify-between h-[70px] hover:bg-(--info)/5"
						disabled={isLoading}
					>
						<Badge
							variant="info"
							className="absolute right-2 top-2 text-[7px] py-0 px-1 border-(--info)/40"
						>
							SSS-3
						</Badge>
						<span className="text-[10px] font-bold uppercase">
							Approve Confidential
						</span>
						<span className="text-[8px] opacity-60 font-normal">
							Enable zero-knowledge balance encryption
						</span>
					</button>
				</div>
			</div>
		</div>
	);
};
