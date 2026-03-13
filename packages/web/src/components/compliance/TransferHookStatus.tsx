import { Copy } from "lucide-react";
import { type FC } from "react";
import { toast } from "sonner";
import { useTokens } from "../../contexts/TokenContext";
import { Badge } from "../ui/Badge";

export const TransferHookStatus: FC = () => {
	const { selectedToken } = useTokens();
	const hookId = "Sook2x...H7aWy4";

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	};

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) flex flex-col">
			<div className="border-b border-(--border-dim) px-3 py-1.5 bg-gradient-to-r from-(--bg-surface) to-transparent">
				<span className="text-[9px] uppercase text-(--text-dim) font-bold tracking-widest">
					Protocol Intelligence
				</span>
			</div>

			<div className="px-3 py-1 flex flex-col divide-y divide-(--border-dim)/50">
				<div className="flex justify-between items-center py-2">
					<span className="font-mono text-[10px] text-(--text-main) tracking-tighter">
						STATE_INITIALIZATION
					</span>
					<Badge
						variant="success"
						className="px-1.5 py-0 text-[8px] font-bold border-(--success)/20 bg-(--success)/5"
					>
						READY
					</Badge>
				</div>

				<div className="flex justify-between items-center py-2">
					<span className="font-mono text-[10px] text-(--text-main) tracking-tighter">
						METADATA_PTR_ACCOUNT
					</span>
					<div className="flex items-center gap-1.5">
						<span className="font-mono text-(--text-dim) text-[10px]">
							{selectedToken?.mintAddress.slice(0, 10)}...
						</span>
						<button
							onClick={() => copyToClipboard(selectedToken?.mintAddress || "")}
						>
							<Copy className="w-2.5 h-2.5 text-(--text-dark) hover:text-(--accent-primary) transition-colors" />
						</button>
					</div>
				</div>

				<div className="flex justify-between items-center py-2 border-none">
					<span className="font-mono text-[10px] text-(--text-main) tracking-tighter">
						HOOK_PROGRAM_AUTHORITY
					</span>
					<div className="flex items-center gap-1.5">
						<span className="font-mono text-(--text-dim) text-[10px]">
							{hookId}
						</span>
						<button onClick={() => copyToClipboard(hookId)}>
							<Copy className="w-2.5 h-2.5 text-(--text-dark) hover:text-(--accent-primary) transition-colors" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
