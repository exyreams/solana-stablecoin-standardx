import { Check, X } from "lucide-react";
import type { FC } from "react";

interface Permission {
	action: string;
	master: boolean;
	minter: boolean;
	burner: boolean;
	pauser: boolean;
	blacklister: boolean;
	seizer: boolean;
}

const permissions: Permission[] = [
	{
		action: "Mint Tokens",
		master: false,
		minter: true,
		burner: false,
		pauser: false,
		blacklister: false,
		seizer: false,
	},
	{
		action: "Burn Tokens",
		master: false,
		minter: false,
		burner: true,
		pauser: false,
		blacklister: false,
		seizer: false,
	},
	{
		action: "Pause/Unpause",
		master: false,
		minter: false,
		burner: false,
		pauser: true,
		blacklister: false,
		seizer: false,
	},
	{
		action: "Freeze/Thaw",
		master: false,
		minter: false,
		burner: false,
		pauser: true,
		blacklister: false,
		seizer: false,
	},
	{
		action: "Blacklist Add/Remove",
		master: false,
		minter: false,
		burner: false,
		pauser: false,
		blacklister: true,
		seizer: false,
	},
	{
		action: "Seize Tokens",
		master: false,
		minter: false,
		burner: false,
		pauser: false,
		blacklister: false,
		seizer: true,
	},
	{
		action: "Update Roles",
		master: true,
		minter: false,
		burner: false,
		pauser: false,
		blacklister: false,
		seizer: false,
	},
	{
		action: "Transfer Authority",
		master: true,
		minter: false,
		burner: false,
		pauser: false,
		blacklister: false,
		seizer: false,
	},
];

export const PermissionsMatrix: FC = () => {
	return (
		<div className="bg-(--bg-panel) border border-(--border-mid)">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Role Permissions Matrix
				</span>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full font-mono text-[10px]">
					<thead>
						<tr className="border-b border-(--border-mid)">
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Action
							</th>
							<th className="text-center p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Master
							</th>
							<th className="text-center p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Minter
							</th>
							<th className="text-center p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Burner
							</th>
							<th className="text-center p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Pauser
							</th>
							<th className="text-center p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Blacklister
							</th>
							<th className="text-center p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Seizer
							</th>
						</tr>
					</thead>
					<tbody>
						{permissions.map((perm, index) => (
							<tr key={index} className="border-b border-(--border-dim)">
								<td className="p-3">{perm.action}</td>
								<td className="p-3 text-center">
									{perm.master ? (
										<Check className="w-4 h-4 text-(--success) inline" />
									) : (
										<X className="w-4 h-4 text-(--text-dark) inline" />
									)}
								</td>
								<td className="p-3 text-center">
									{perm.minter ? (
										<Check className="w-4 h-4 text-(--success) inline" />
									) : (
										<X className="w-4 h-4 text-(--text-dark) inline" />
									)}
								</td>
								<td className="p-3 text-center">
									{perm.burner ? (
										<Check className="w-4 h-4 text-(--success) inline" />
									) : (
										<X className="w-4 h-4 text-(--text-dark) inline" />
									)}
								</td>
								<td className="p-3 text-center">
									{perm.pauser ? (
										<Check className="w-4 h-4 text-(--success) inline" />
									) : (
										<X className="w-4 h-4 text-(--text-dark) inline" />
									)}
								</td>
								<td className="p-3 text-center">
									{perm.blacklister ? (
										<Check className="w-4 h-4 text-(--success) inline" />
									) : (
										<X className="w-4 h-4 text-(--text-dark) inline" />
									)}
								</td>
								<td className="p-3 text-center">
									{perm.seizer ? (
										<Check className="w-4 h-4 text-(--success) inline" />
									) : (
										<X className="w-4 h-4 text-(--text-dark) inline" />
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};
