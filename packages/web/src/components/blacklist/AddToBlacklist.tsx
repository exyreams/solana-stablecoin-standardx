import { AlertCircle } from "lucide-react";
import { type FC, useState } from "react";
import { useBlacklist } from "../../hooks/useBlacklist";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface AddToBlacklistProps {
	isOpen: boolean;
	onClose: () => void;
}

export const AddToBlacklist: FC<AddToBlacklistProps> = ({
	isOpen,
	onClose,
}) => {
	const { addToBlacklist } = useBlacklist();
	const [address, setAddress] = useState("");
	const [reason, setReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!address) return;
		setIsSubmitting(true);
		try {
			await addToBlacklist(address, reason);
			setAddress("");
			setReason("");
			onClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Add to Blacklist">
			<div className="space-y-6">
				<div className="flex flex-col gap-1.5">
					<label className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
						Wallet Address
					</label>
					<div className="relative">
						<Input
							placeholder="Enter Solana address..."
							className="font-mono text-xs bg-(--bg-input) border-(--border-mid) h-10"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
						/>
						{address.length >= 32 && (
							<span className="absolute right-3 top-2.5 text-green-500 font-bold">
								✓
							</span>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-1.5">
					<div className="flex justify-between">
						<label className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
							Reason / Justification
						</label>
						<span className="text-[9px] text-(--text-dark) font-mono uppercase">
							{reason.length} / 128 bytes
						</span>
					</div>
					<textarea
						placeholder="Provide justification for security audit..."
						className="w-full h-24 px-3 py-2 bg-(--bg-input) border border-(--border-mid) text-(--text-main) font-mono text-xs focus:border-(--accent-primary) focus:outline-none resize-none transition-colors"
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						maxLength={128}
					/>
				</div>

				<div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-(--border-dim)">
					<AlertCircle className="w-5 h-5 text-(--accent-primary) shrink-0 mt-0.5" />
					<div className="flex flex-col gap-1">
						<span className="text-[10px] font-bold text-(--accent-primary) uppercase">
							Compliance Warning
						</span>
						<p className="text-[10px] text-(--text-dim) leading-relaxed">
							Adding an address to the SSS-2 blacklist will freeze all its
							associated token accounts. This action is recorded on-chain and
							requires authority signatures.
						</p>
					</div>
				</div>

				<div className="flex gap-3 pt-2">
					<Button
						variant="secondary"
						className="flex-1 font-mono text-xs h-11"
						onClick={onClose}
					>
						CANCEL
					</Button>
					<Button
						variant="primary"
						className="flex-1 font-mono text-xs h-11"
						onClick={handleSubmit}
						disabled={!address || isSubmitting}
					>
						{isSubmitting ? "SYNCING..." : "CONFIRM BLACKLIST"}
					</Button>
				</div>
			</div>
		</Modal>
	);
};
