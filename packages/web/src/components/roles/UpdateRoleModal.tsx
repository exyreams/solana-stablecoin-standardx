import { Info, Loader2 } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface UpdateRoleModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	mint: string;
	roleId: string;
	roleName: string;
	currentAddress: string;
}

const ROLE_DESCRIPTIONS: Record<string, string> = {
	burner: "Authorized to burn tokens from any account, reducing total supply.",
	pauser: "Authorized to freeze or resume all token transfers globally.",
	blacklister:
		"Authorized to add or remove addresses from the restricted blacklist.",
	seizer: "Authorized to forcibly transfer tokens from blacklisted accounts.",
};

export const UpdateRoleModal: FC<UpdateRoleModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	mint,
	roleId,
	roleName,
	currentAddress,
}) => {
	const [newAddress, setNewAddress] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleUpdate = async () => {
		if (!newAddress) {
			toast.error("Please enter a new address");
			return;
		}

		try {
			setIsLoading(true);
			const updates: any = {};
			updates[roleId] = newAddress;

			const res = await stablecoinApi.updateRoles(mint, updates);
			if (res.success) {
				toast.success(`${roleName} updated successfully`);
				onSuccess();
				onClose();
				setNewAddress("");
			}
		} catch (error: any) {
			toast.error(
				error.response?.data?.error || `Failed to update ${roleName}`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title={`Update ${roleName}`}>
			<div className="space-y-6">
				<div className="p-4 bg-(--accent-primary)/5 border border-(--accent-primary)/20 rounded-sm flex gap-3">
					<Info className="w-5 h-5 text-(--accent-primary) shrink-0 mt-0.5" />
					<div className="text-[11px] font-mono text-(--text-dim) leading-relaxed">
						<span className="text-(--accent-primary) font-bold uppercase block mb-1">
							Role Responsibility
						</span>
						{ROLE_DESCRIPTIONS[roleId] ||
							"Authorized to manage critical token parameters."}
					</div>
				</div>

				<div className="space-y-4">
					<div>
						<label className="block text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-1.5">
							Current Address
						</label>
						<div className="px-3 py-2 bg-(--bg-panel) border border-(--border-dim) text-[11px] font-mono text-(--text-dark) break-all">
							{currentAddress}
						</div>
					</div>

					<div>
						<label className="block text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-1.5">
							New {roleName} Address
						</label>
						<Input
							placeholder="Paste new Solana public key..."
							value={newAddress}
							onChange={(e) => setNewAddress(e.target.value)}
							disabled={isLoading}
							className="font-mono text-xs h-10"
							autoFocus
						/>
						<p className="mt-2 text-[9px] text-(--text-dim) font-mono">
							WARNING: ENSURE THE ADDRESS IS CORRECT. INCORRECT ASSIGNMENT CAN
							LEAD TO LOSS OF CONTROL OVER THIS FUNCTIONALITY.
						</p>
					</div>
				</div>

				<div className="flex gap-3 pt-2">
					<Button
						variant="secondary"
						className="flex-1 font-mono text-[11px]"
						onClick={onClose}
						disabled={isLoading}
					>
						CANCEL
					</Button>
					<Button
						variant="primary"
						className="flex-1 font-mono text-[11px]"
						onClick={handleUpdate}
						disabled={isLoading || !newAddress}
					>
						{isLoading ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							"UPDATE ROLE"
						)}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
