import { type FC, useState } from "react";
import { toast } from "sonner";
import { useTokens } from "../../contexts/TokenContext";
import { adminApi } from "../../lib/api/admin";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface AddMinterModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	mintAddress?: string;
}

export const AddMinterModal: FC<AddMinterModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	mintAddress,
}) => {
	const { selectedToken } = useTokens();
	const [address, setAddress] = useState("");
	const [quota, setQuota] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!address) {
			toast.error("Please enter a minter address");
			return;
		}

		setIsSubmitting(true);
		try {
			// Scale quota by decimals (default to 6 if not found)
			const decimals = selectedToken?.onChain?.decimals ?? 6;
			const scaledQuota =
				quota && quota !== "0"
					? BigInt(Math.floor(parseFloat(quota) * 10 ** decimals)).toString()
					: "0";

			await adminApi.addMinter(address, scaledQuota, mintAddress);
			toast.success("Minter added successfully");
			onSuccess();
			onClose();
			setAddress("");
			setQuota("");
		} catch (err: any) {
			const errorMsg = err.response?.data?.error || "";
			if (errorMsg.includes("already in use")) {
				toast.error("This address is already authorized as a minter");
			} else {
				toast.error(errorMsg || "Failed to add minter");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Add New Minter">
			<div className="space-y-5">
				<div>
					<label className="block text-[10px] text-(--text-dim) uppercase mb-2 font-mono">
						Authority Address
					</label>
					<Input
						placeholder="Solana Wallet Address"
						value={address}
						onChange={(e) => setAddress(e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-[10px] text-(--text-dim) uppercase mb-2 font-mono">
						Mint Quota
					</label>
					<Input
						type="number"
						placeholder="0"
						value={quota}
						onChange={(e) => setQuota(e.target.value)}
					/>
					<div className="text-[9px] text-(--text-dark) mt-1 font-mono">
						0 = Unlimited
					</div>
				</div>

				<div>
					<label className="block text-[10px] text-(--text-dim) uppercase mb-2 font-mono">
						Status
					</label>
					<div
						className="flex items-center gap-3 cursor-pointer"
						onClick={() => setIsActive(!isActive)}
					>
						<div
							className={`w-8 h-4 rounded-full relative transition-colors ${
								isActive ? "bg-(--success)" : "bg-(--border-mid)"
							}`}
						>
							<div
								className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${
									isActive ? "right-0.5" : "left-0.5"
								}`}
							/>
						</div>
						<span className="text-[11px] font-mono">
							{isActive ? "ACTIVE ON CREATE" : "INACTIVE ON CREATE"}
						</span>
					</div>
				</div>

				<Button
					variant="primary"
					className="w-full mt-8"
					onClick={handleSubmit}
					isLoading={isSubmitting}
				>
					ADD MINTER
				</Button>
			</div>
		</Modal>
	);
};
