import type { FC } from "react";

export const BurnPreview: FC = () => {
	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-4">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-4">
				Burn Preview
			</div>
			<div className="space-y-3 font-mono text-xs">
				<div className="flex justify-between">
					<span className="text-(--text-dim)">Amount</span>
					<span className="text-[#ff4444]">0.00 USDC</span>
				</div>
				<div className="flex justify-between">
					<span className="text-(--text-dim)">From Account</span>
					<span className="text-(--text-main)">Not set</span>
				</div>
				<div className="flex justify-between">
					<span className="text-(--text-dim)">Burner</span>
					<span className="text-(--text-main)">Treasury</span>
				</div>
				<div className="border-t border-(--border-dim) pt-3 mt-3">
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Est. Fee</span>
						<span className="text-(--text-main)">0.000005 SOL</span>
					</div>
				</div>
				<div className="border-t border-(--border-dim) pt-3 mt-3">
					<div className="flex justify-between">
						<span className="text-(--text-dim)">New Supply</span>
						<span className="text-[#ff4444]">42,500,000</span>
					</div>
				</div>
				<div className="border-t border-(--border-dim) pt-3 mt-3">
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Rent Reclaim</span>
						<span className="text-[#00ff88]">~0.002 SOL</span>
					</div>
				</div>
			</div>
		</div>
	);
};
