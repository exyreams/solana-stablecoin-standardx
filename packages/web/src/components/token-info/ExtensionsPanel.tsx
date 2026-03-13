import type { FC } from "react";
import type { StablecoinDetails } from "../../lib/api/stablecoin";
import { Badge } from "../ui/Badge";

interface ExtensionsPanelProps {
	details: StablecoinDetails;
}

export const ExtensionsPanel: FC<ExtensionsPanelProps> = ({ details }) => {
	const extensions = [
		{
			name: "Permanent Delegate",
			enabled: details.onChain?.extensions.permanentDelegate ?? false,
			description: "Allows seizure of tokens from blacklisted accounts",
		},
		{
			name: "Transfer Hook",
			enabled: details.onChain?.extensions.transferHook ?? false,
			description: "Enforces blacklist checks on every transfer",
		},
		{
			name: "Metadata",
			enabled: true, // Always enabled if created via SSS
			description: "On-chain token name, symbol, and URI",
		},
		{
			name: "Confidential Transfer",
			enabled: details.onChain?.extensions.confidentialTransfers ?? false,
			description: "Privacy-preserving transfers (SSS-3 only)",
		},
		{
			name: "Default Frozen",
			enabled: details.onChain?.extensions.defaultAccountFrozen ?? false,
			description: "New accounts are frozen by default",
		},
	];

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-6">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-4">
				Token-2022 Extensions
			</div>
			<div className="grid grid-cols-5 gap-4">
				{extensions.map((ext) => (
					<div key={ext.name} className="border border-(--border-mid) p-4">
						<div className="flex items-center justify-between mb-2">
							<span className="font-mono text-[10px] text-(--text-main)">
								{ext.name}
							</span>
							<Badge
								variant={ext.enabled ? "success" : "default"}
								className="text-[8px] scale-90"
							>
								{ext.enabled ? "ON" : "OFF"}
							</Badge>
						</div>
						<p className="text-[10px] text-(--text-dim) leading-tight">
							{ext.description}
						</p>
					</div>
				))}
			</div>
		</div>
	);
};
