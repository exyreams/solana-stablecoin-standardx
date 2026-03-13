import { type FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTokens } from "../../contexts/TokenContext";
import { adminApi, type MinterResponse } from "../../lib/api/admin";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface EditMinterModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	minter: MinterResponse | null;
	mintAddress?: string;
}

export const EditMinterModal: FC<EditMinterModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	minter,
	mintAddress,
}) => {
	const { selectedToken } = useTokens();
	const [quota, setQuota] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [resetMinted, setResetMinted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (minter) {
			const decimals = selectedToken?.onChain?.decimals ?? 6;
			// Convert atomic units to UI units for display
			const quotaVal = parseFloat(minter.quota) / 10 ** decimals;
			setQuota(quotaVal.toString());
			setIsActive(minter.active);
			setResetMinted(false);
		}
	}, [minter, selectedToken]);

	const handleSubmit = async () => {
		if (!minter) return;

		setIsSubmitting(true);
		try {
			const decimals = selectedToken?.onChain?.decimals ?? 6;
			const scaledQuota =
				quota && quota !== "0"
					? BigInt(Math.floor(parseFloat(quota) * 10 ** decimals)).toString()
					: "0";

			await adminApi.updateMinter(minter.minter, {
				quota: scaledQuota,
				active: isActive,
				resetMinted,
				mintAddress,
			});
			toast.success("Minter updated successfully");
			onSuccess();
			onClose();
		} catch (err: any) {
			toast.error(err.response?.data?.error || "Failed to update minter");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!minter) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Edit Minter Profile">
			<div className="space-y-5">
				<div>
					<label className="block text-[10px] text-(--text-dim) uppercase mb-2 font-mono">
						Authority Address
					</label>
					<Input
						value={minter.minter}
						readOnly
						className="cursor-not-allowed opacity-70"
					/>
				</div>

				<div>
					<label className="block text-[10px] text-(--text-dim) uppercase mb-2 font-mono">
						Update Quota
					</label>
					<Input
						type="number"
						value={quota}
						onChange={(e) => setQuota(e.target.value)}
						placeholder="0 = Unlimited"
					/>
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
							{isActive ? "MINTING ENABLED" : "MINTING DISABLED"}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<input
						type="checkbox"
						id="reset-counter"
						className="cursor-pointer"
						checked={resetMinted}
						onChange={(e) => setResetMinted(e.target.checked)}
					/>
					<label
						htmlFor="reset-counter"
						className="text-[10px] text-(--text-dim) uppercase cursor-pointer"
					>
						Reset Minted Counter
					</label>
				</div>

				<Button
					variant="secondary"
					className="w-full mt-8"
					onClick={handleSubmit}
					isLoading={isSubmitting}
				>
					SAVE CHANGES
				</Button>
			</div>
		</Modal>
	);
};
