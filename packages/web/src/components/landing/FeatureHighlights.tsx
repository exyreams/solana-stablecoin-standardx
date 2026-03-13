import { Activity, CheckCircle, FileText, Shield } from "lucide-react";
import type { FC } from "react";

const highlights = [
	{
		icon: Shield,
		title: "ROLE-BASED ACCESS",
		description:
			"Granular minter, burner, pauser, blacklister and seizer authorities via Multisig.",
	},
	{
		icon: Activity,
		title: "ORACLE INTEGRATION",
		description:
			"Switchboard, Pyth and Chainlink feeds with weighted aggregation and circuit breakers.",
	},
	{
		icon: CheckCircle,
		title: "COMPLIANCE READY",
		description:
			"SSS-2 ships with blacklisting, asset seizure, and full audit logs out of the box.",
	},
	{
		icon: FileText,
		title: "OPEN SOURCE",
		description:
			"MIT licensed. Audit-ready codebase. Deploy with confidence on mainnet.",
	},
];

export const FeatureHighlights: FC = () => {
	return (
		<section className="py-[100px] px-20 max-w-[1200px] mx-auto">
			<div className="border-l-2 border-(--accent-primary) pl-4 mb-12">
				<div className="mono label-amber">SYSTEM OVERVIEW</div>
				<h2 className="mono text-2xl mt-2">4 FEATURE HIGHLIGHTS</h2>
			</div>

			<div className="grid grid-cols-2 gap-6">
				{highlights.map((highlight) => {
					const Icon = highlight.icon;
					return (
						<div
							key={highlight.title}
							className="flex gap-4 border border-(--border-dim) p-4"
						>
							<Icon className="w-8 h-8 shrink-0 stroke-(--accent-primary)" />
							<div>
								<h4 className="m-0 mb-2 font-mono">{highlight.title}</h4>
								<p className="m-0 text-(--text-dim) text-xs leading-relaxed">
									{highlight.description}
								</p>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
};
