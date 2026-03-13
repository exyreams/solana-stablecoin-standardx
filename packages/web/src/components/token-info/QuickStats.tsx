import type { FC } from "react";
import type { StablecoinDetails } from "../../lib/api/stablecoin";

interface QuickStatsProps {
	details: StablecoinDetails;
}

export const QuickStats: FC<QuickStatsProps> = ({ details }) => {
	const stats = [
		{
			label: "Master Authority",
			value: details.onChain
				? `${details.onChain.roles.masterAuthority.slice(0, 4)}...${details.onChain.roles.masterAuthority.slice(-4)}`
				: "---",
			subtitle: "Full control",
			color: "text-(--text-main)",
		},
		{
			label: "Pauser Role",
			value: details.onChain
				? `${details.onChain.roles.pauser.slice(0, 4)}...${details.onChain.roles.pauser.slice(-4)}`
				: "---",
			subtitle: "Global pause",
			color: "text-(--text-main)",
		},
		{
			label: "Blacklister",
			value: details.onChain
				? `${details.onChain.roles.blacklister.slice(0, 4)}...${details.onChain.roles.blacklister.slice(-4)}`
				: "---",
			subtitle: "Compliance",
			color: "text-(--text-main)",
		},
		{
			label: "Burner Role",
			value: details.onChain
				? `${details.onChain.roles.burner.slice(0, 4)}...${details.onChain.roles.burner.slice(-4)}`
				: "---",
			subtitle: "Supply reduction",
			color: "text-(--text-main)",
		},
	];

	return (
		<div className="grid grid-cols-4 gap-4">
			{stats.map((stat) => (
				<div
					key={stat.label}
					className="bg-(--bg-panel) border border-(--border-mid) p-4"
				>
					<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-2">
						{stat.label}
					</div>
					<div className={`text-xl font-mono font-light ${stat.color}`}>
						{stat.value}
					</div>
					<div className="text-[10px] mt-1 text-(--text-dim)">
						{stat.subtitle}
					</div>
				</div>
			))}
		</div>
	);
};
