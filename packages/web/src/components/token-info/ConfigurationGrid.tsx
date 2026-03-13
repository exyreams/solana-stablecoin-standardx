import type { FC } from "react";
import type { StablecoinDetails } from "../../lib/api/stablecoin";
import { Button } from "../ui/Button";

interface ConfigurationGridProps {
	details: StablecoinDetails;
}

export const ConfigurationGrid: FC<ConfigurationGridProps> = ({ details }) => {
	const formatNumber = (num: string | number) => {
		return new Intl.NumberFormat().format(Number(num));
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString();
	};

	const truncateAddress = (addr: string) => {
		return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
	};

	return (
		<div className="grid grid-cols-3 gap-6">
			<div className="bg-(--bg-panel) border border-(--border-mid) p-4">
				<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-3">
					Token Configuration
				</div>
				<div className="space-y-3 font-mono text-xs">
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Decimals</span>
						<span className="text-(--text-main)">{details.decimals}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Version</span>
						<span className="text-(--text-main)">1.0.0</span>
					</div>
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Standard</span>
						<span className="text-(--accent-primary) uppercase">
							{details.preset}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Created</span>
						<span className="text-(--text-main)">
							{formatDate(details.createdAt)}
						</span>
					</div>
				</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-mid) p-4">
				<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-3">
					Supply Statistics
				</div>
				<div className="space-y-3 font-mono text-xs">
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Total Supply</span>
						<span className="text-(--text-main)">
							{details.onChain
								? formatNumber(
										Number(details.onChain.supply) /
											10 ** details.onChain.decimals,
									)
								: "---"}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Native Supply</span>
						<span className="text-[#00ff88]">
							{details.onChain ? formatNumber(details.onChain.supply) : "---"}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Status</span>
						<span
							className={
								details.onChain?.paused ? "text-[#ff4444]" : "text-[#00ff88]"
							}
						>
							{details.onChain?.paused ? "PAUSED" : "ACTIVE"}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-(--text-dim)">Decimals</span>
						<span className="text-(--text-main)">{details.decimals}</span>
					</div>
				</div>
			</div>

			<div className="bg-(--bg-panel) border border-(--border-mid) p-4">
				<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-3">
					Authority Info
				</div>
				<div className="space-y-3 font-mono text-xs">
					<div className="flex justify-between items-center">
						<span className="text-(--text-dim)">Master</span>
						<span className="text-(--text-main)">
							{details.onChain
								? truncateAddress(details.onChain.roles.masterAuthority)
								: "---"}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-(--text-dim)">Pending</span>
						<span className="text-(--text-dim)">
							{details.onChain?.roles.pendingMaster
								? truncateAddress(details.onChain.roles.pendingMaster)
								: "None"}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-(--text-dim)">Type</span>
						<span className="text-(--accent-primary)">PROGRAM PDA</span>
					</div>
					<div className="pt-2">
						<Button variant="secondary" size="sm" className="w-full">
							TRANSFER AUTHORITY
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};
