import { AlertCircle } from "lucide-react";
import type { FC } from "react";
import { Input } from "../ui/Input";

export interface RecipientSectionProps {
	value: string;
	onChange: (value: string) => void;
}

export const RecipientSection: FC<RecipientSectionProps> = ({
	value,
	onChange,
}) => {
	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-6">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-4">
				Recipient Information
			</div>
			<div className="space-y-4">
				<div>
					<label className="block text-xs font-mono text-(--text-dim) mb-2">
						Recipient Address
					</label>
					<Input
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder="Enter Solana address (e.g., 9zK...M22)"
						className="font-mono text-xs"
					/>
					<p className="text-[10px] text-(--text-dim) mt-1">
						The wallet address that will receive the minted tokens
					</p>
				</div>
				<div className="flex items-center gap-2 p-3 bg-(--bg-surface) border border-(--border-dim)">
					<AlertCircle className="w-4 h-4 text-(--accent-primary)" />
					<span className="text-[10px] text-(--text-dim)">
						Address will be validated against blacklist before minting
					</span>
				</div>
			</div>
		</div>
	);
};
