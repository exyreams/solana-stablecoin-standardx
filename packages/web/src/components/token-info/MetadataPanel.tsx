import type { FC } from "react";
import type { StablecoinDetails } from "../../lib/api/stablecoin";

interface MetadataPanelProps {
	details: StablecoinDetails;
}

export const MetadataPanel: FC<MetadataPanelProps> = ({ details }) => {
	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-6">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-4">
				Token Metadata
			</div>
			<div className="grid grid-cols-2 gap-6">
				<div className="space-y-3 font-mono text-xs">
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Name</span>
						<span className="text-(--text-main)">{details.name}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Symbol</span>
						<span className="text-(--text-main)">{details.symbol}</span>
					</div>
					<div className="flex justify-between gap-4">
						<span className="text-(--text-dim) shrink-0">URI</span>
						<span className="text-(--accent-primary) truncate">
							{details.uri || "---"}
						</span>
					</div>
				</div>
				<div className="flex items-center justify-center border border-(--border-dim) p-4">
					<div className="w-24 h-24 bg-(--bg-surface) flex items-center justify-center text-(--text-dim) text-[10px] text-center p-2 uppercase">
						{details.symbol} ICON
					</div>
				</div>
			</div>
		</div>
	);
};
