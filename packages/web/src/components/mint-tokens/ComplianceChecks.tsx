import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import type { FC } from "react";

interface ComplianceChecksProps {
	checks: {
		label: string;
		status: "passed" | "failed" | "pending";
	}[];
}

export const ComplianceChecks: FC<ComplianceChecksProps> = ({ checks }) => {
	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-4">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-4">
				Pre-Mint Checks
			</div>
			<div className="space-y-3">
				{checks.map((check) => (
					<div key={check.label} className="flex items-center gap-2">
						{check.status === "passed" ? (
							<CheckCircle className="w-4 h-4 text-[#00ff88]" />
						) : check.status === "failed" ? (
							<AlertCircle className="w-4 h-4 text-(--danger)" />
						) : (
							<Clock className="w-4 h-4 text-(--text-dark)" />
						)}
						<span
							className={`text-xs ${
								check.status === "passed"
									? "text-(--text-main)"
									: "text-(--text-dim)"
							}`}
						>
							{check.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};
