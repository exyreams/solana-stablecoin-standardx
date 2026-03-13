import { type FC, useState } from "react";
import { toast } from "sonner";
import type { AccountData } from "../../hooks/useAccount";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Badge } from "../ui/Badge";
import { SeizeAssetsModal } from "./SeizeAssetsModal";

interface AccountActionsProps {
	account: AccountData;
	onActionComplete: () => Promise<void>;
}

export const AccountActions: FC<AccountActionsProps> = ({
	account,
	onActionComplete,
}) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isSeizeOpen, setIsSeizeOpen] = useState(false);

	const handleAction = async (
		action: "freeze" | "thaw" | "blacklist" | "seize",
	) => {
		if (action === "seize") {
			setIsSeizeOpen(true);
			return;
		}

		try {
			setIsLoading(true);

			switch (action) {
				case "freeze":
					await stablecoinApi.freeze(
						account.mint,
						account.address,
						"Manual freeze",
					);
					toast.success("Account frozen successfully");
					break;
				case "thaw":
					await stablecoinApi.thaw(
						account.mint,
						account.address,
						"Manual thaw",
					);
					toast.success("Account thawed successfully");
					break;
				case "blacklist":
					await stablecoinApi.blacklist(
						account.mint,
						account.address,
						"Regulatory compliance check",
					);
					toast.success("Address added to blacklist");
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
		<div className="bg-(--bg-panel) border border-(--border-mid) p-5 relative">
			<div className="flex justify-between items-center mb-5 pb-2 border-b border-(--border-dim)">
				<span className="text-[10px] uppercase text-(--text-dim) font-bold tracking-widest">
					Compliance Tools
				</span>
				<Badge variant="default" className="text-[8px] opacity-40">
					ADMIN ACCESS
				</Badge>
			</div>

			<div className="grid grid-cols-2 gap-3">
				{/* Freeze/Thaw Group */}
				<button
					className={`p-2.5 text-left transition-all flex flex-col justify-center h-[55px] border ${
						!account.isFrozen
							? "border-[#CCA352] text-[#CCA352] hover:bg-[#CCA352]/5"
							: "border-(--border-mid) text-(--text-dark) opacity-40 cursor-not-allowed"
					}`}
					onClick={() => handleAction("freeze")}
					disabled={isLoading || account.isFrozen}
				>
					<span className="text-[9px] font-bold uppercase tracking-tight">
						{account.isFrozen ? "ACCOUNT FROZEN" : "FREEZE ACCOUNT"}
					</span>
					<span className="text-[7px] font-normal opacity-50 truncate">
						Immediate transfer restriction
					</span>
					{isLoading && (
						<div className="absolute inset-0 bg-black/20 animate-pulse" />
					)}
				</button>

				<button
					className={`p-2.5 text-left transition-all flex flex-col justify-center h-[55px] border ${
						account.isFrozen
							? "border-[#CCA352] text-[#CCA352] font-bold bg-[#CCA352]/5"
							: "border-(--border-mid) text-(--text-dim) hover:border-[#CCA352]/30"
					}`}
					onClick={() => handleAction("thaw")}
					disabled={isLoading || !account.isFrozen}
				>
					<span className="text-[9px] uppercase font-bold">THAW ACCOUNT</span>
					<span className="text-[7px] font-normal opacity-50 truncate">
						Restore account mobility
					</span>
				</button>

				{/* Compliance Group */}
				<button
					className="bg-transparent border border-dashed border-[#ff4444]/60 text-[#ff4444] p-2.5 text-left hover:border-[#ff4444] transition-all relative flex flex-col justify-center h-[55px]"
					onClick={() => handleAction("blacklist")}
					disabled={isLoading}
				>
					<Badge
						variant="accent"
						className="absolute right-1 top-1 text-[6px] border-(--warning)/20 text-(--warning) px-1 py-0"
					>
						SSS-2
					</Badge>
					<span className="text-[9px] font-bold uppercase">ADD BLACKLIST</span>
					<span className="text-[7px] font-normal opacity-50 truncate">
						Protocol-level denial
					</span>
				</button>

				<button
					className="bg-[#ff4444] border-none text-white p-2.5 text-left hover:brightness-110 transition-all relative flex flex-col justify-center h-[55px]"
					onClick={() => handleAction("seize")}
					disabled={isLoading}
				>
					<Badge
						variant="default"
						className="absolute right-1 top-1 text-[6px] border-white/20 text-white px-1 py-0"
					>
						SSS-2
					</Badge>
					<span className="text-[9px] font-bold uppercase">SEIZE ASSETS</span>
					<span className="text-[7px] font-normal opacity-80 truncate">
						Transfer to treasury
					</span>
				</button>

				{/* SSS-3 Privacy */}
				<button
					className={`col-span-2 bg-transparent border p-2.5 text-left transition-all relative flex flex-col justify-center h-[55px] ${
						account.isFrozen
							? "border-(--border-mid) text-(--text-dark) opacity-40 cursor-not-allowed"
							: "border-[#3b82f6]/50 text-[#3b82f6] hover:border-[#3b82f6] hover:bg-[#3b82f6]/5"
					}`}
					disabled={isLoading || account.isFrozen}
				>
					<Badge
						variant="info"
						className="absolute right-2 top-1 text-[6px] border-(--info)/20 px-1 py-0"
					>
						SSS-3
					</Badge>
					<span className="text-[9px] font-bold uppercase">
						APPROVE CONFIDENTIAL
					</span>
					<span className="text-[7px] font-normal opacity-50 truncate">
						{account.isFrozen
							? "BLOCKED BY FROZEN STATUS"
							: "ENABLE ZK ENCRYPTION"}
					</span>
				</button>
			</div>

			<SeizeAssetsModal
				isOpen={isSeizeOpen}
				onClose={() => setIsSeizeOpen(false)}
				onSuccess={onActionComplete}
				sourceAddress={account.address}
				mintAddress={account.mint}
			/>
		</div>
	);
};
