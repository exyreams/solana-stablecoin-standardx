import type { FC } from "react";
import { Button } from "../ui/Button";

export const GeneralSettings: FC = () => {
	return (
		<div className="bg-(--bg-surface) border border-(--border-mid) p-4">
			<div className="text-[10px] uppercase text-(--text-dim) font-mono mb-4 flex items-center gap-2">
				TOKEN METADATA
			</div>

			<div className="flex flex-col gap-2 mb-4">
				<label className="text-[9px] text-(--text-dark) font-mono uppercase">
					Token Name
				</label>
				<div className="bg-(--bg-input) border border-(--border-dim) text-(--text-dark) px-2.5 py-2.5 font-mono text-[11px] flex items-center justify-between">
					USDC-SOL <span className="text-[10px]">🔒</span>
				</div>
			</div>

			<div className="flex flex-col gap-2 mb-4">
				<label className="text-[9px] text-(--text-dark) font-mono uppercase">
					Token Symbol
				</label>
				<div className="bg-(--bg-input) border border-(--border-dim) text-(--text-dark) px-2.5 py-2.5 font-mono text-[11px]">
					USDC
				</div>
			</div>

			<div className="flex flex-col gap-2 mb-4">
				<label className="text-[9px] text-(--text-dark) font-mono uppercase">
					Metadata URI
				</label>
				<div className="bg-(--bg-input) border border-(--border-dim) text-(--text-dark) px-2.5 py-2.5 font-mono text-[11px] flex items-center justify-between">
					https://arweave.net/7xG9...ZqP8
					<Button variant="secondary" size="sm">
						COPY
					</Button>
				</div>
			</div>

			<div className="border border-(--border-dim) border-l-[3px] border-l-(--accent-primary) px-2.5 py-2.5 bg-(--bg-panel) text-[10px] font-mono text-(--text-dim)">
				METADATA IS ON-CHAIN AND IMMUTABLE VIA THIS INTERFACE
			</div>
		</div>
	);
};
