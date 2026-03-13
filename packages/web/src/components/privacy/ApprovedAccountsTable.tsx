import type { FC } from "react";
import { Badge } from "../ui/Badge";

interface ApprovedAccount {
	tokenAccount: string;
	owner: string;
	creditsEnabled: boolean;
	approvedAt: string;
	time: string;
}

const mockAccounts: ApprovedAccount[] = [
	{
		tokenAccount: "8x2A...f931",
		owner: "Treas...19k",
		creditsEnabled: true,
		approvedAt: "2023.10.24",
		time: "14:02:11",
	},
	{
		tokenAccount: "3M1b...a210",
		owner: "SolF...m3x",
		creditsEnabled: true,
		approvedAt: "2023.10.24",
		time: "13:45:02",
	},
	{
		tokenAccount: "mult...9x2w",
		owner: "Cold...Z99",
		creditsEnabled: false,
		approvedAt: "2023.10.24",
		time: "12:12:44",
	},
	{
		tokenAccount: "9v9z...e11p",
		owner: "BinE...11s",
		creditsEnabled: true,
		approvedAt: "2023.10.24",
		time: "10:05:31",
	},
	{
		tokenAccount: "4fKx...99Ka",
		owner: "Phan...W12",
		creditsEnabled: true,
		approvedAt: "2023.10.23",
		time: "23:59:59",
	},
	{
		tokenAccount: "5aLm...V34b",
		owner: "Vaut...999",
		creditsEnabled: false,
		approvedAt: "2023.10.23",
		time: "22:30:15",
	},
	{
		tokenAccount: "LPso...112x",
		owner: "Rayd...A1A",
		creditsEnabled: true,
		approvedAt: "2023.10.23",
		time: "21:12:00",
	},
	{
		tokenAccount: "Orac...v2mm",
		owner: "Pyth...SYS",
		creditsEnabled: true,
		approvedAt: "2023.10.23",
		time: "19:44:12",
	},
];

export const ApprovedAccountsTable: FC = () => {
	return (
		<div className="bg-(--bg-panel) border border-(--border-mid)">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Approved Accounts (Confidential Enabled)
				</span>
			</div>

			<table className="w-full font-mono text-[11px]">
				<thead>
					<tr className="border-b border-(--border-mid)">
						<th className="text-left p-3 text-(--text-dim) uppercase text-[10px] font-normal">
							Token Account
						</th>
						<th className="text-left p-3 text-(--text-dim) uppercase text-[10px] font-normal">
							Owner
						</th>
						<th className="text-left p-3 text-(--text-dim) uppercase text-[10px] font-normal">
							Credits Enabled
						</th>
						<th className="text-left p-3 text-(--text-dim) uppercase text-[10px] font-normal">
							Approved At
						</th>
						<th className="text-left p-3 text-(--text-dim) uppercase text-[10px] font-normal">
							Actions
						</th>
					</tr>
				</thead>
				<tbody>
					{mockAccounts.map((account, index) => (
						<tr key={index} className="border-b border-(--border-dim)">
							<td className="p-3">{account.tokenAccount}</td>
							<td className="p-3">{account.owner}</td>
							<td className="p-3">
								{account.creditsEnabled ? (
									<Badge variant="success">ENABLED</Badge>
								) : (
									<Badge variant="default" className="text-(--text-dark)">
										DISABLED
									</Badge>
								)}
							</td>
							<td className="p-3">
								{account.approvedAt}
								<br />
								<span className="text-(--text-dark)">{account.time}</span>
							</td>
							<td className="p-3">
								<button
									className={`border px-3 py-1 text-[10px] bg-transparent ${
										account.creditsEnabled
											? "border-(--text-dark) text-(--text-dark)"
											: "border-[#3b82f6] text-[#3b82f6]"
									}`}
								>
									{account.creditsEnabled ? "DISABLE" : "ENABLE"} CREDITS
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className="flex justify-end gap-2 p-4 font-mono text-[10px] text-(--text-dim)">
				PREV <span className="text-(--accent-primary) cursor-pointer">1</span> 2
				NEXT
			</div>
		</div>
	);
};
