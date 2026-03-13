import { AlertCircle, CheckCircle2, Copy, Terminal } from "lucide-react";
import type { FC } from "react";
import { toast } from "sonner";
import { Badge } from "../ui/Badge";

interface TransferAuthorityProps {
	roles?: {
		masterAuthority: string;
		pendingMaster: string | null;
	};
	mint: string;
}

export const TransferAuthority: FC<TransferAuthorityProps> = ({
	roles,
	mint,
}) => {
	const copyToClipboard = (text: string, description: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Command copied!", { description });
	};

	const initiateCommand = `sss-token admin roles transfer <newMaster> --mint ${mint}`;
	const acceptCommand = `sss-token admin roles accept --mint ${mint}`;

	return (
		<div
			id="transfer-section"
			className="bg-(--bg-panel) border border-(--border-mid) overflow-hidden"
		>
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<div className="flex items-center gap-2">
					<Terminal className="w-4 h-4 text-(--accent-primary)" />
					<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
						Master Authority (CLI)
					</span>
				</div>
				{roles?.pendingMaster && (
					<Badge variant="warning" className="animate-pulse">
						Transfer Pending
					</Badge>
				)}
			</div>

			<div className="p-5 space-y-6">
				{/* Warning Info */}
				<div className="bg-orange-500/5 border border-orange-500/20 rounded-sm p-4 flex gap-3">
					<AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
					<div className="space-y-1">
						<p className="text-[11px] font-medium text-orange-200 uppercase tracking-tight">
							Security Protocol
						</p>
						<p className="text-[10px] text-orange-200/60 leading-relaxed font-mono">
							Master Authority transfers are critical operations. For maximum
							security, these must be executed via the Secure Admin CLI.
						</p>
					</div>
				</div>

				{/* Two-Step Flow Display */}
				<div className="space-y-4">
					<div className="relative pl-6 border-l border-(--border-dim) space-y-8">
						{/* Step 1 */}
						<div className="relative">
							<div className="absolute -left-[31px] top-0 w-2.5 h-2.5 rounded-full bg-(--bg-panel) border-2 border-(--border-mid) z-10" />
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<span className="text-[10px] font-bold text-(--text-dim) opacity-50 font-mono">
										STEP 01
									</span>
									<span className="text-[11px] font-semibold text-(--text-primary) uppercase tracking-wide">
										Initiate Transfer
									</span>
								</div>
								<p className="text-[10px] text-(--text-dim) leading-relaxed">
									Current Master proposes a new address. This can be cancelled
									anytime before acceptance.
								</p>
								<div
									className="group relative bg-[#0a0a0a] border border-(--border-dim) p-3 rounded-sm font-mono text-[10px] text-[#888888] cursor-pointer hover:border-(--accent-primary)/30 transition-colors"
									onClick={() =>
										copyToClipboard(initiateCommand, "Initiation command")
									}
								>
									<span className="text-(--accent-primary)">$</span>{" "}
									{initiateCommand}
									<div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
										<Copy className="w-3 h-3 text-(--accent-primary)" />
									</div>
								</div>
							</div>
						</div>

						{/* Step 2 */}
						<div className="relative">
							<div
								className={`absolute -left-[31px] top-0 w-2.5 h-2.5 rounded-full bg-(--bg-panel) border-2 ${roles?.pendingMaster ? "border-(--accent-primary) shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.5)]" : "border-(--border-mid)"} z-10`}
							/>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<span className="text-[10px] font-bold text-(--text-dim) opacity-50 font-mono">
										STEP 02
									</span>
									<span className="text-[11px] font-semibold text-(--text-primary) uppercase tracking-wide">
										Accept Transfer
									</span>
								</div>
								<p className="text-[10px] text-(--text-dim) leading-relaxed">
									The New Master must execute the acceptance command using their
									own keypair.
								</p>
								<div
									className={`group relative bg-[#0a0a0a] border p-3 rounded-sm font-mono text-[10px] transition-colors ${
										roles?.pendingMaster
											? "border-(--accent-primary)/30 text-(--text-primary) cursor-pointer"
											: "border-(--border-dim) text-[#888888] cursor-not-allowed"
									}`}
									onClick={() =>
										roles?.pendingMaster &&
										copyToClipboard(acceptCommand, "Acceptance command")
									}
								>
									<span
										className={
											roles?.pendingMaster
												? "text-(--accent-primary)"
												: "text-[#555555]"
										}
									>
										$
									</span>{" "}
									{acceptCommand}
									<div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
										<Copy className="w-3 h-3 text-(--accent-primary)" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Current Status */}
				{roles?.pendingMaster && (
					<div className="mt-8 pt-6 border-t border-(--border-dim) space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-semibold text-(--text-dim) uppercase tracking-wider">
								Transfer Status
							</span>
							<Badge variant="warning">AWAITING ACCEPTANCE</Badge>
						</div>
						<div className="bg-(--bg-surface) p-3 rounded-sm border border-(--border-dim) space-y-2">
							<div className="flex items-center justify-between text-[9px] font-mono">
								<span className="text-(--text-dim)">PROPOSED MASTER</span>
								<span className="text-(--text-primary)">
									{roles.pendingMaster}
								</span>
							</div>
						</div>
					</div>
				)}

				{!roles?.pendingMaster && (
					<div className="flex items-center gap-2 text-[9px] text-(--text-dim) opacity-60 font-mono mt-4">
						<CheckCircle2 className="w-3 h-3" />
						<span>MASTER AUTHORITY IS CURRENTLY LOCKED</span>
					</div>
				)}
			</div>
		</div>
	);
};
