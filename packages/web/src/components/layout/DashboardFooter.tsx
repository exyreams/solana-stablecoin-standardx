import type { FC } from "react";
import { Badge } from "../ui/Badge";

export const DashboardFooter: FC = () => {
	return (
		<footer className="col-span-2 row-start-3 bg-(--bg-panel) border-t border-(--border-dim) flex items-center justify-between px-4 font-mono text-[10px] text-(--text-dim)">
			<div className="flex gap-6">
				<span>
					NETWORK <span className="text-(--text-dark)">MAINNET-BETA //</span>
				</span>
				<span>
					STATUS <span className="text-green-400">READY</span>
				</span>
			</div>
			<div className="flex items-center gap-2">
				<Badge variant="accent">v1.0.0</Badge>
				<span>SSS MANAGER</span>
			</div>
		</footer>
	);
};
