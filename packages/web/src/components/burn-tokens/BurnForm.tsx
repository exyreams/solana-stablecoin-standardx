import { AlertCircle } from "lucide-react";
import type { FC } from "react";
import { Input } from "../ui/Input";

export interface BurnFormProps {
	fromTokenAccount: string;
	onFromTokenAccountChange: (value: string) => void;
	amount: string;
	onAmountChange: (value: string) => void;
	symbol: string;
	balance: string;
	isFetchingBalance: boolean;
	onRefreshBalance: () => void;
}

export const BurnForm: FC<BurnFormProps> = ({
	fromTokenAccount,
	onFromTokenAccountChange,
	amount,
	onAmountChange,
	symbol,
	balance,
	isFetchingBalance,
	onRefreshBalance,
}) => {
	return (
		<div className="bg-[#161616] border border-[#222222] p-6">
			<div className="text-[10px] uppercase text-[#777777] font-semibold tracking-wider mb-4">
				Burn Configuration
			</div>
			<div className="space-y-4">
				<div>
					<label className="block text-xs font-mono text-[#777777] mb-2">
						Token Account Address
					</label>
					<Input
						value={fromTokenAccount}
						onChange={(e) => onFromTokenAccountChange(e.target.value)}
						placeholder="Enter token account address"
						className="font-mono text-xs"
					/>
					<p className="text-[10px] text-[#777777] mt-1">
						The associated token account from which tokens will be burned
					</p>
				</div>

				<div>
					<label className="block text-xs font-mono text-[#777777] mb-2">
						Amount to Burn ({symbol})
					</label>
					<div className="relative">
						<Input
							type="number"
							value={amount}
							onChange={(e) => onAmountChange(e.target.value)}
							placeholder="0.00"
							className="font-mono text-lg pr-20"
						/>
						<button
							onClick={() => {
								onAmountChange(balance);
							}}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#CCA352] hover:text-[#E6B966]"
						>
							MAX
						</button>
					</div>
					<div className="flex justify-between items-center mt-1">
						<p className="text-[10px] text-[#777777]">
							Available:{" "}
							{isFetchingBalance ? "Updating..." : `${balance} ${symbol}`}
						</p>
						<button
							onClick={onRefreshBalance}
							disabled={isFetchingBalance}
							className="text-[10px] font-mono text-[#CCA352] hover:text-[#E6B966] disabled:opacity-50"
						>
							REFRESH
						</button>
					</div>
				</div>

				<div className="flex items-center gap-2 p-3 bg-[#111111] border border-[#ff4444]">
					<AlertCircle className="w-4 h-4 text-[#ff4444]" />
					<span className="text-[10px] text-[#777777]">
						Burning tokens permanently removes them from circulation. This
						action cannot be undone.
					</span>
				</div>
			</div>
		</div>
	);
};
