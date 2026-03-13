import type { FC } from "react";
import type { StablecoinDetails } from "../../lib/api/stablecoin";

interface RolePanelProps {
	details: StablecoinDetails;
	roles?: {
		masterAuthority: string;
		pauser: string;
		blacklister: string;
		burner: string;
		seizer: string;
	};
}

export const RolePanel: FC<RolePanelProps> = ({
	details,
	roles: summaryRoles,
}) => {
	const truncateAddress = (addr: string) => {
		if (addr === "---" || !addr) return "---";
		return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
	};

	const roles = [
		{
			name: "Master Authority",
			address: summaryRoles?.masterAuthority
				? truncateAddress(summaryRoles.masterAuthority)
				: details.onChain
					? truncateAddress(details.onChain.roles.masterAuthority)
					: "---",
		},
		{
			name: "Pauser",
			address: summaryRoles?.pauser
				? truncateAddress(summaryRoles.pauser)
				: details.onChain
					? truncateAddress(details.onChain.roles.pauser)
					: "---",
		},
		{
			name: "Blacklister",
			address: summaryRoles?.blacklister
				? truncateAddress(summaryRoles.blacklister)
				: details.onChain
					? truncateAddress(details.onChain.roles.blacklister)
					: "---",
		},
		{
			name: "Burner",
			address: summaryRoles?.burner
				? truncateAddress(summaryRoles.burner)
				: details.onChain
					? truncateAddress(details.onChain.roles.burner)
					: "---",
		},
		{
			name: "Seizer",
			address: summaryRoles?.seizer
				? truncateAddress(summaryRoles.seizer)
				: details.onChain
					? truncateAddress(details.onChain.roles.seizer)
					: "---",
		},
	];

	return (
		<div className="bg-[rgba(15,15,15,0.8)] border border-(--border-mid) relative flex-1">
			<div className="border-b border-(--border-dim) px-4 py-2 flex justify-between items-center bg-linear-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Role Assignments
				</span>
			</div>
			<div className="p-4">
				{roles.map((role, index) => (
					<div
						key={role.name}
						className={`flex justify-between items-center py-2.5 ${
							index < roles.length - 1 ? "border-b border-(--border-dim)" : ""
						}`}
					>
						<span className="text-[11px] font-mono text-(--text-dim)">
							{role.name}
						</span>
						<span className="text-[11px] font-mono text-(--text-main)">
							{role.address}
						</span>
						<button className="bg-transparent border border-(--accent-primary) text-(--accent-primary) text-[9px] px-2 py-0.5 cursor-pointer font-mono hover:bg-[rgba(204,163,82,0.1)] transition-colors">
							EDIT
						</button>
					</div>
				))}
			</div>
		</div>
	);
};
