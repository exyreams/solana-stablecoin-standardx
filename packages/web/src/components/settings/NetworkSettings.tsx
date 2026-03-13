import type { FC } from "react";

export const NetworkSettings: FC = () => {
	return (
		<>
			<div className="bg-(--bg-surface) border border-(--border-mid) p-4 mb-4">
				<div className="text-[10px] uppercase text-(--text-dim) font-mono mb-4">
					RPC ENDPOINT
				</div>
				<div className="flex bg-(--bg-input) border border-(--border-mid) w-fit">
					<button className="px-4 py-2 text-[10px] font-mono text-(--accent-active) bg-(--bg-surface) shadow-[inset_0_-2px_0_var(--accent-primary)]">
						MAINNET-BETA
					</button>
					<button className="px-4 py-2 text-[10px] font-mono text-(--text-dim)">
						DEVNET
					</button>
					<button className="px-4 py-2 text-[10px] font-mono text-(--text-dim)">
						LOCALNET
					</button>
					<button className="px-4 py-2 text-[10px] font-mono text-(--text-dim)">
						CUSTOM
					</button>
				</div>
				<div className="mt-3 flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-green-400" />
					<span className="font-mono text-[10px] text-(--text-dim)">
						Latency: 42ms — https://api.mainnet-beta.solana.com
					</span>
				</div>
			</div>

			<div className="bg-(--bg-surface) border border-(--border-mid) p-4">
				<div className="text-[10px] uppercase text-(--text-dim) font-mono mb-4">
					EXPLORER PREFERENCE
				</div>
				<div className="flex gap-3">
					<div className="border border-(--accent-primary) bg-[rgba(204,163,82,0.12)] px-3 py-3 flex-1 cursor-pointer">
						<div className="w-6 h-6 bg-(--border-mid) mb-2" />
						<div className="font-mono text-[10px] text-(--accent-active)">
							SOLANA EXPLORER
						</div>
						<div className="font-mono text-[9px] text-(--text-dark) mt-1">
							explorer.solana.com
						</div>
					</div>
					<div className="border border-(--border-mid) px-3 py-3 flex-1 cursor-pointer transition-colors hover:border-(--border-bright)">
						<div className="w-6 h-6 bg-(--border-mid) mb-2" />
						<div className="font-mono text-[10px] text-(--text-dim)">
							SOLSCAN
						</div>
						<div className="font-mono text-[9px] text-(--text-dark) mt-1">
							solscan.io
						</div>
					</div>
					<div className="border border-(--border-mid) px-3 py-3 flex-1 cursor-pointer transition-colors hover:border-(--border-bright)">
						<div className="w-6 h-6 bg-(--border-mid) mb-2" />
						<div className="font-mono text-[10px] text-(--text-dim)">
							SOLANA FM
						</div>
						<div className="font-mono text-[9px] text-(--text-dark) mt-1">
							solana.fm
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
