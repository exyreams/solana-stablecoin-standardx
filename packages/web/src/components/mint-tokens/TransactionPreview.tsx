import type { FC } from "react";

interface TransactionPreviewProps {
	amount: string;
	symbol: string;
	recipient: string;
	minter: string;
	currentSupply?: string;
}

export const TransactionPreview: FC<TransactionPreviewProps> = ({
	amount,
	symbol,
	recipient,
	minter,
	currentSupply = "0",
}) => {
	const amountNum = parseFloat(amount) || 0;
	const supplyNum = parseFloat(currentSupply) || 0;
	const newSupply = supplyNum + amountNum;

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-4">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-4">
				Transaction Preview
			</div>
			<div className="space-y-3 font-mono text-xs">
				<div className="flex justify-between">
					<span className="text-(--text-dim)">Amount</span>
					<span className="text-(--text-main)">
						{amountNum.toLocaleString()} {symbol}
					</span>
				</div>
				<div className="flex justify-between">
					<span className="text-(--text-dim)">Recipient</span>
					<span className="text-(--text-main) truncate w-32 text-right">
						{recipient
							? `${recipient.slice(0, 6)}...${recipient.slice(-6)}`
							: "Not set"}
					</span>
				</div>
				<div className="flex justify-between">
					<span className="text-(--text-dim)">Minter</span>
					<span className="text-(--text-main) truncate w-32 text-right">
						{minter ? `${minter.slice(0, 6)}...${minter.slice(-6)}` : "None"}
					</span>
				</div>
				<div className="border-t border-(--border-dim) pt-3 mt-3">
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Est. Fee</span>
						<span className="text-(--text-main)">~0.000005 SOL</span>
					</div>
				</div>
				<div className="border-t border-(--border-dim) pt-3 mt-3">
					<div className="flex justify-between items-center">
						<span className="text-(--text-dim)">New Supply</span>
						<div className="text-right">
							<div className="text-[10px] text-(--text-dim) line-through decoration-(--text-dark)">
								{supplyNum.toLocaleString()}
							</div>
							<div className="text-[#00ff88] font-bold">
								{newSupply.toLocaleString()}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
