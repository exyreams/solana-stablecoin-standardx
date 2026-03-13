import type { FC } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export const ApprovalForm: FC = () => {
	return (
		<div className="bg-(--bg-panel) border border-(--border-mid)">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Initialize Account Approval
				</span>
			</div>

			<div className="p-4 space-y-4">
				<div className="flex gap-2 opacity-50 pointer-events-none">
					<Input
						placeholder="Token account address..."
						className="flex-1"
						disabled
					/>
					<Button variant="secondary" size="sm" className="px-5" disabled>
						VALIDATE
					</Button>
				</div>

				<div className="border-t border-(--border-dim) pt-4 grid grid-cols-3 gap-4 opacity-30">
					<div>
						<div className="text-[9px] text-(--text-dark) uppercase mb-1">
							Owner
						</div>
						<div className="font-mono text-[11px]">N/A</div>
					</div>

					<div>
						<div className="text-[9px] text-(--text-dark) uppercase mb-1">
							Balance
						</div>
						<div className="font-mono text-[11px]">0.00 USDC</div>
					</div>

					<div>
						<div className="text-[9px] text-(--text-dark) uppercase mb-1">
							Status
						</div>
						<Badge variant="default" className="text-[8px]">
							FEATURE SUSPENDED
						</Badge>
					</div>
				</div>

				<button
					disabled
					className="w-full border border-(--border-dim) text-(--text-dark) bg-transparent py-2.5 font-mono text-[11px] cursor-not-allowed uppercase tracking-tighter"
				>
					Confidential Features Currently Unavailable
				</button>
			</div>
		</div>
	);
};
