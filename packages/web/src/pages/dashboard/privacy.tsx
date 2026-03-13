import { Zap } from "lucide-react";
import type { FC } from "react";
import {
	ApprovalForm,
	ApprovedAccountsTable,
	PrivacyGuide,
	PrivacyStats,
} from "../../components/privacy";
import { Badge } from "../../components/ui/Badge";

const Privacy: FC = () => {
	return (
		<>
			<div className="font-mono text-[10px] text-[#777777] uppercase mb-2">
				DASHBOARD <span className="text-[#444444]">&gt;</span> USDC-SOL{" "}
				<span className="text-[#444444]">&gt;</span> PRIVACY
			</div>

			<div className="flex items-center gap-3">
				<h1 className="text-2xl font-light tracking-wider">PRIVACY CONTROLS</h1>
				<Badge
					variant="info"
					className="text-[10px] px-3 py-1 border-[#3b82f6] text-[#3b82f6]"
				>
					SSS-3 ONLY
				</Badge>
			</div>

			<div className="mt-4 p-4 bg-[rgba(239,68,68,0.05)] border border-[#ef4444] rounded-sm flex gap-4">
				<div className="shrink-0 w-10 h-10 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
					<Zap className="w-5 h-5 text-[#ef4444] fill-[#ef4444]" />
				</div>
				<div>
					<h3 className="text-[#ef4444] font-bold text-sm uppercase tracking-tight mb-1">
						Confidential Transfers Suspended
					</h3>
					<p className="text-[11px] text-(--text-dim) leading-relaxed max-w-2xl">
						Solana's ZK ElGamal programs are currently inactive globally for
						security auditing. SSS-3 privacy features, including account
						configuration and confidential approvals, are temporarily disabled
						until the network re-enables the underlying ZK instructions.
					</p>
				</div>
			</div>

			<PrivacyStats />
			<ApprovalForm />
			<ApprovedAccountsTable />
			<PrivacyGuide />
		</>
	);
};

export default Privacy;
