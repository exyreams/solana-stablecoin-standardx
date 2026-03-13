import type { FC } from "react";
import { Badge } from "../ui/Badge";

export const PrivacyStats: FC = () => {
	return (
		<div className="grid grid-cols-3 gap-4">
			<div className="bg-(--bg-panel) border border-(--border-dim) p-4">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider block mb-3">
					Extension Status
				</span>
				<div className="flex gap-2 mt-3">
					<Badge variant="success" className="px-2">
						ACTIVE
					</Badge>
					<Badge variant="default">TOKEN-2022</Badge>
				</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-dim) p-4">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider block mb-1">
					Approved Accounts
				</span>
				<div className="text-2xl font-mono font-light mt-1">47</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-dim) p-4">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider block mb-1">
					Credits Enabled
				</span>
				<div className="flex items-baseline gap-2">
					<span className="text-2xl font-mono font-light mt-1">31</span>
					<span className="text-xs font-mono text-(--text-dark)">/ 47</span>
				</div>
				<div className="h-0.5 w-full bg-(--border-dim) mt-2">
					<div className="h-full w-2/3 bg-[#3b82f6]" />
				</div>
			</div>
		</div>
	);
};
