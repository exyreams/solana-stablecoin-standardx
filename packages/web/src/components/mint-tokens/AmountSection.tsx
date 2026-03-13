import type { FC } from "react";
import { Input } from "../ui/Input";

const quickAmounts = ["100", "1,000", "10,000", "100,000"];

export interface AmountSectionProps {
	value: string;
	onChange: (value: string) => void;
	symbol: string;
}

export const AmountSection: FC<AmountSectionProps> = ({
	value,
	onChange,
	symbol,
}) => {
	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-6">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-4">
				Mint Amount
			</div>
			<div className="space-y-4">
				<div>
					<label className="block text-xs font-mono text-(--text-dim) mb-2">
						Amount ({symbol})
					</label>
					<div className="relative">
						<Input
							type="number"
							value={value}
							onChange={(e) => onChange(e.target.value)}
							placeholder="0.00"
							className="font-mono text-lg pr-20"
						/>
						<button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-(--accent-primary) hover:text-(--accent-active)">
							MAX
						</button>
					</div>
					<p className="text-[10px] text-(--text-dim) mt-1">
						Enter amount with up to 6 decimal places
					</p>
				</div>
				<div className="grid grid-cols-4 gap-2">
					{quickAmounts.map((amount) => (
						<button
							key={amount}
							onClick={() => onChange(amount.replace(/,/g, ""))}
							className="px-3 py-2 bg-(--bg-surface) border border-(--border-dim) text-xs font-mono text-(--text-dim) hover:border-(--accent-primary) hover:text-(--accent-primary) transition-colors"
						>
							{amount}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};
