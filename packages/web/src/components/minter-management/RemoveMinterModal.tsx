import { type FC, useState } from "react";
import { toast } from "sonner";
import { adminApi, type MinterResponse } from "../../lib/api/admin";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface RemoveMinterModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	minter: MinterResponse | null;
	mintAddress?: string;
}

export const RemoveMinterModal: FC<RemoveMinterModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
	minter,
	mintAddress,
}) => {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleRemove = async () => {
		if (!minter) return;

		setIsSubmitting(true);
		try {
			await adminApi.removeMinter(minter.minter, mintAddress);
			toast.success("Minter removed successfully");
			onSuccess();
			onClose();
		} catch (err: any) {
			toast.error(err.response?.data?.error || "Failed to remove minter");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!minter) return null;

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Remove Minter"
			variant="danger"
		>
			<div className="border border-dashed border-(--danger) bg-[rgba(255,68,68,0.02)] p-6">
				<span className="block text-(--danger) font-bold text-[11px] mb-2 uppercase tracking-widest">
					CRITICAL ACTION
				</span>
				<p className="text-[12px] leading-relaxed text-(--text-main) mb-4">
					Revoking minter status for{" "}
					<span className="font-mono font-bold text-(--danger)">
						{minter.minter}
					</span>
					. This action cannot be undone by this interface.
				</p>
				<div className="font-mono text-[10px] text-(--text-dim) bg-black/20 p-2 rounded">
					RENT RECLAIM:{" "}
					<span className="text-(--success)">~0.00203928 SOL</span> will be
					returned to the treasury authority.
				</div>
			</div>

			<div className="flex gap-3 mt-8">
				<Button variant="ghost" className="flex-1" onClick={onClose}>
					CANCEL
				</Button>
				<Button
					variant="danger"
					className="flex-1"
					onClick={handleRemove}
					isLoading={isSubmitting}
				>
					CONFIRM REMOVAL
				</Button>
			</div>
		</Modal>
	);
};
