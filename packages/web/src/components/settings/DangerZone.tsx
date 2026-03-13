import type { FC } from "react";
import { Button } from "../ui/Button";

export const DangerZone: FC = () => {
	return (
		<div className="bg-(--bg-surface) border border-red-600 p-4">
			<div className="text-[10px] uppercase text-red-600 font-mono mb-4">
				⚠ DANGER ZONE
			</div>

			<div className="flex justify-between items-center py-4 border-b border-red-600/10">
				<div>
					<div className="text-[10px] text-(--text-main) font-mono uppercase mb-1">
						EXPORT ALL DATA
					</div>
					<div className="font-mono text-[10px] text-(--text-dim)">
						Download complete audit log and holder snapshot as ZIP
					</div>
				</div>
				<Button
					variant="secondary"
					size="sm"
					className="flex-shrink-0 border-(--border-mid) text-(--text-dim)"
				>
					EXPORT ZIP
				</Button>
			</div>

			<div className="flex justify-between items-center py-4 border-b border-red-600/10">
				<div>
					<div className="text-[10px] text-(--text-main) font-mono uppercase mb-1">
						DELETE LOCAL CACHE
					</div>
					<div className="font-mono text-[10px] text-(--text-dim)">
						Clear locally cached RPC data and session storage
					</div>
				</div>
				<button className="flex-shrink-0 bg-transparent border border-red-600 border-dashed text-red-600 font-mono text-[10px] px-4 py-2 cursor-pointer">
					DELETE CACHE
				</button>
			</div>

			<div className="flex justify-between items-center py-4">
				<div>
					<div className="text-[10px] text-(--text-main) font-mono uppercase mb-1">
						CLOSE MINT
					</div>
					<div className="font-mono text-[10px] text-(--text-dim)">
						Permanently close this mint. Requires zero supply. This action is
						irreversible.
					</div>
					<div className="font-mono text-[9px] text-red-600 mt-2">
						CURRENT SUPPLY: 42,500,000 USDC — MUST BE ZERO TO CLOSE
					</div>
				</div>
				<button
					disabled
					className="flex-shrink-0 bg-(--bg-panel) text-(--text-dark) border border-(--border-dim) font-mono text-[10px] px-4 py-2 cursor-not-allowed"
				>
					CLOSE MINT
				</button>
			</div>
		</div>
	);
};
