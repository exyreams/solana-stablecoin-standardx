import type { FC } from "react";

const wallets = ["PHANTOM", "SOLFLARE", "BACKPACK", "LEDGER"];

export const WalletBanner: FC = () => {
	return (
		<div className="bg-(--bg-surface) border border-(--border-mid) p-4 flex items-center gap-4 mb-2">
			<div className="w-[100px] text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
				Connect Authority
			</div>
			{wallets.map((wallet) => (
				<button
					key={wallet}
					className="bg-(--bg-panel) border border-(--border-dim) text-(--text-main) px-4 py-2 font-mono text-[11px] cursor-pointer flex items-center gap-2 transition-colors hover:border-(--accent-primary)"
				>
					{wallet}
				</button>
			))}
			<div className="flex-1 text-right font-mono text-[10px] text-(--text-dim)">
				NO WALLET CONNECTED
			</div>
		</div>
	);
};
