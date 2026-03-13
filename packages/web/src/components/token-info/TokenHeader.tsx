import { Copy, ExternalLink } from "lucide-react";
import type { FC } from "react";
import { toast } from "sonner";
import type { StablecoinDetails } from "../../lib/api/stablecoin";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

interface TokenHeaderProps {
	details: StablecoinDetails;
}

export const TokenHeader: FC<TokenHeaderProps> = ({ details }) => {
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	};

	const explorerUrl = `${import.meta.env.VITE_EXPLORER_URL}/address/${details.mintAddress}?cluster=${import.meta.env.VITE_NETWORK}`;

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-6">
			<div className="flex items-start justify-between mb-4">
				<div>
					<div className="flex items-center gap-3 mb-2">
						<h1 className="text-2xl font-mono font-light">
							{details.symbol}-SOL
						</h1>
						<Badge variant="accent" className="uppercase">
							{details.preset}
						</Badge>
						<Badge
							variant={details.onChain?.paused ? "danger" : "success"}
							className="uppercase"
						>
							{details.onChain?.paused ? "PAUSED" : "ACTIVE"}
						</Badge>
					</div>
					<p className="text-(--text-dim) text-sm">{details.name}</p>
				</div>
				<div className="flex gap-2">
					<Button variant="secondary" size="sm">
						{details.onChain?.paused ? "UNPAUSE TOKEN" : "PAUSE TOKEN"}
					</Button>
					<Button variant="danger" size="sm">
						CLOSE MINT
					</Button>
				</div>
			</div>

			<div className="flex items-center gap-2 font-mono text-xs text-(--text-dim)">
				<span>Mint:</span>
				<span className="text-(--text-main) truncate max-w-[200px] md:max-w-none">
					{details.mintAddress}
				</span>
				<button
					onClick={() => copyToClipboard(details.mintAddress)}
					className="text-(--accent-primary) hover:text-(--accent-active)"
				>
					<Copy className="w-3 h-3" />
				</button>
				<a
					href={explorerUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="text-(--accent-primary) hover:text-(--accent-active)"
				>
					<ExternalLink className="w-3 h-3" />
				</a>
			</div>
		</div>
	);
};
