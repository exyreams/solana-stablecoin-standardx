import type { FC } from "react";
import { Badge } from "../ui/Badge";

interface AuditDetailProps {
	event: any;
}

export const AuditDetail: FC<AuditDetailProps> = ({ event }) => {
	if (!event) return null;

	const getActionBadge = (action: string) => {
		const variants: Record<string, any> = {
			MINT: { variant: "success", text: "MINT" },
			BURN: { variant: "danger", text: "BURN" },
			FREEZE: { variant: "warning", text: "FREEZE" },
			BLACKLIST: { variant: "danger", text: "BLACKLIST" },
			BLACKLIST_ADD: { variant: "danger", text: "BLACKLIST+" },
			BLACKLIST_REMOVE: { variant: "default", text: "BLACKLIST-" },
			SEIZE: { variant: "danger", text: "SEIZE" },
			THAW: { variant: "default", text: "THAW" },
			UPDATE_ROLES: { variant: "warning", text: "ROLES" },
		};
		const config = variants[action] || { variant: "default", text: action };
		return <Badge variant={config.variant}>{config.text}</Badge>;
	};

	return (
		<div className="py-4 px-6 bg-black/40 border-y border-(--border-dim) shadow-inner">
			<div className="grid grid-cols-2 gap-8">
				{/* Left Side: Structured Data */}
				<div className="space-y-3">
					<div className="grid grid-cols-[100px_1fr] gap-4 items-center text-[10px]">
						<span className="text-(--text-dark) uppercase font-bold tracking-tighter">
							Action Type
						</span>
						<div className="flex items-center gap-2">
							{getActionBadge(event.action)}
							<Badge
								variant="default"
								className="opacity-50 text-[8px] px-1 py-0"
							>
								{event.type}
							</Badge>
						</div>
					</div>
					<div className="grid grid-cols-[100px_1fr] gap-4 items-start text-[10px]">
						<span className="text-(--text-dark) uppercase font-bold tracking-tighter pt-0.5">
							Address
						</span>
						<span className="font-mono text-(--text-dim) break-all leading-tight">
							{event.address}
						</span>
					</div>
					<div className="grid grid-cols-[100px_1fr] gap-4 items-center text-[10px]">
						<span className="text-(--text-dark) uppercase font-bold tracking-tighter">
							Amount
						</span>
						{event.amount ? (
							<span
								className={`font-mono font-bold ${event.action === "MINT" ? "text-green-400" : "text-red-400"}`}
							>
								{event.action === "MINT" ? "+" : "-"}
								{event.amount}
							</span>
						) : (
							<span className="font-mono text-(--text-dark)">—</span>
						)}
					</div>
					<div className="grid grid-cols-[100px_1fr] gap-4 items-start text-[10px]">
						<span className="text-(--text-dark) uppercase font-bold tracking-tighter pt-0.5">
							Signature
						</span>
						<div className="flex flex-col gap-1">
							<span className="font-mono text-(--text-dark) break-all leading-tight">
								{event.signature || "—"}
							</span>
							{event.signature && (
								<a
									href={`https://explorer.solana.com/tx/${event.signature}?cluster=custom&customUrl=http://localhost:8899`}
									target="_blank"
									rel="noreferrer"
									className="text-(--accent-primary) no-underline text-[9px] hover:underline w-fit"
								>
									VIEW ON EXPLORER →
								</a>
							)}
						</div>
					</div>
				</div>

				{/* Right Side: Log Data */}
				<div className="flex flex-col">
					<span className="text-[9px] text-(--text-dark) font-mono uppercase font-bold mb-1.5 opacity-60">
						Reason / Log Item
					</span>
					<div className="flex-grow bg-black/60 border border-(--border-mid) p-3 font-mono text-[10px] text-(--text-dim) leading-relaxed whitespace-pre-wrap max-h-[120px] overflow-y-auto custom-scrollbar">
						{event.reason}
					</div>
				</div>
			</div>
		</div>
	);
};
