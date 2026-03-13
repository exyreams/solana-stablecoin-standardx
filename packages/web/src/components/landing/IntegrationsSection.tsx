import { Globe, Link2, TrendingUp, Wallet, Zap } from "lucide-react";
import type { FC } from "react";

const partners = [
	{ name: "PHANTOM", icon: Wallet },
	{ name: "SOLFLARE", icon: Globe },
	{ name: "SWITCHBOARD", icon: Zap },
	{ name: "PYTH", icon: TrendingUp },
	{ name: "CHAINLINK", icon: Link2 },
];

export const IntegrationsSection: FC = () => {
	return (
		<section className="py-[100px] px-20 text-center">
			<div className="font-mono text-[11px] text-[#CCA352] uppercase font-bold mb-5">
				BUILT WITH BEST-IN-CLASS INFRASTRUCTURE
			</div>
			<div className="flex justify-center gap-6 font-mono text-[11px]">
				{partners.map((partner) => (
					<div
						key={partner.name}
						className="border border-[#222222] px-6 py-4 flex items-center gap-3 hover:border-[#CCA352] transition-colors"
					>
						<partner.icon className="w-6 h-6 text-[#333333] group-hover:text-[#CCA352] transition-colors" />
						{partner.name}
					</div>
				))}
			</div>
		</section>
	);
};
