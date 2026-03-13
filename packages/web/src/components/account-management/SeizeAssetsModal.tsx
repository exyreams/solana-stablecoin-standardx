import { type FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTokens } from "../../contexts/TokenContext";
import { adminApi } from "../../lib/api/admin";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface SeizeAssetsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	sourceAddress: string;
	mintAddress: string;
}

export const SeizeAssetsModal: FC<SeizeAssetsModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	sourceAddress,
	mintAddress,
}) => {
	const { selectedToken } = useTokens();
	const [toAddress, setToAddress] = useState("");
	const [amount, setAmount] = useState("");
	const [reason, setReason] = useState("");
	const [masterWallet, setMasterWallet] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (isOpen) {
			const fetchMasterWallet = async () => {
				try {
					const data = await adminApi.getAuthority();
					setMasterWallet(data.publicKey);
				} catch (err) {
					console.error("Failed to fetch master wallet:", err);
				}
			};
			fetchMasterWallet();
		}
	}, [isOpen]);

	const handleSubmit = async () => {
		if (!amount || parseFloat(amount) <= 0) {
			toast.error("Please enter a valid amount to seize");
			return;
		}

		const destination = toAddress || masterWallet;
		if (!destination) {
			toast.error(
				"Destination address required (or failed to fetch master wallet)",
			);
			return;
		}

		setIsSubmitting(true);
		try {
			const decimals = selectedToken?.onChain?.decimals ?? 6;
			const scaledAmount = BigInt(
				Math.floor(parseFloat(amount) * 10 ** decimals),
			).toString();

			await stablecoinApi.seize(
				mintAddress,
				sourceAddress,
				destination,
				scaledAmount,
				reason ||
					`Seized to ${destination === masterWallet ? "Master Wallet" : destination}`,
			);

			toast.success(
				`Successfully seized ${amount} ${selectedToken?.symbol || "tokens"}`,
			);
			onSuccess();
			onClose();
			setToAddress("");
			setAmount("");
			setReason("");
		} catch (err: any) {
			toast.error(`Seize failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Seize Account Assets">
			<div className="space-y-5">
				<div>
					<label className="block text-[10px] text-(--text-dim) uppercase mb-2 font-mono font-bold">
						Source Account
					</label>
					<div className="p-3 bg-black/20 border border-white/5 font-mono text-xs text-white/50 truncate">
						{sourceAddress}
					</div>
				</div>

				<div>
					<label className="block text-[10px] text-(--text-dim) uppercase mb-2 font-mono font-bold">
						Destination Wallet Address
					</label>
					<Input
						placeholder={
							masterWallet
								? `Default: ${masterWallet.slice(0, 8)}... (Treasury)`
								: "Solana Wallet Address"
						}
						value={toAddress}
						onChange={(e) => setToAddress(e.target.value)}
					/>
					<div className="text-[9px] text-(--text-dark) mt-1 font-mono">
						Leave empty to use Master Treasury Wallet as destination.
					</div>
				</div>

				<div>
					<label className="block text-[10px] text-(--text-dim) uppercase mb-2 font-mono font-bold">
						Amount to Seize ({selectedToken?.symbol || "Tokens"})
					</label>
					<Input
						type="number"
						placeholder="0.00"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
					/>
				</div>

				<div>
					<label className="block text-[10px] text-(--text-dim) uppercase mb-2 font-mono font-bold">
						Reason / Audit Note
					</label>
					<Input
						placeholder="e.g. Regulatory compliance - Order #123"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
					/>
				</div>

				<div className="p-3 bg-red-500/5 border border-red-500/20 rounded-sm">
					<div className="text-[10px] text-red-500 font-bold uppercase mb-1">
						Warning
					</div>
					<div className="text-[9px] text-red-500/70 leading-relaxed font-mono">
						This is an irreversible administrative action. Tokens will be moved
						immediately without owner authorization.
					</div>
				</div>

				<Button
					variant="danger"
					className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold h-[45px]"
					onClick={handleSubmit}
					isLoading={isSubmitting}
				>
					EXECUTE SEIZURE
				</Button>
			</div>
		</Modal>
	);
};
