import type { FC } from "react";
import { Link } from "react-router-dom";
import {
	DashboardFooter,
	DashboardLayout,
	DashboardSidebar,
	DashboardTopBar,
} from "../components/layout";
import { Badge } from "../components/ui/Badge";

const Profile: FC = () => {
	const userStablecoins = [
		{
			name: "USD Coin",
			symbol: "USDC",
			mint: "8x2A...F93A",
			preset: "SSS-2",
			supply: "1,250,000",
			status: "active",
		},
		{
			name: "Euro Stablecoin",
			symbol: "EURC",
			mint: "9kL3...2Bv7",
			preset: "SSS-2",
			supply: "850,000",
			status: "active",
		},
	];

	return (
		<DashboardLayout>
			<DashboardTopBar />
			<DashboardSidebar />

			<main className="col-start-2 row-start-2 overflow-y-auto flex flex-col bg-(--bg-body) p-8">
				<div className="font-mono text-[10px] text-(--text-dim) mb-2">
					<Link to="/" className="hover:text-(--accent-primary)">
						HOME
					</Link>
					<span className="text-(--text-dark) mx-2">/</span>
					<span className="text-(--text-main)">PROFILE</span>
				</div>

				<h1 className="text-2xl font-light tracking-[0.2em] text-(--text-main) mb-8">
					USER PROFILE
				</h1>

				{/* Wallet Info */}
				<div className="bg-(--bg-surface) border border-(--border-mid) p-6 mb-6">
					<div className="font-mono text-[11px] text-(--text-dark) uppercase mb-4">
						CONNECTED WALLET
					</div>
					<div className="flex items-center gap-4 mb-4">
						<div className="w-12 h-12 bg-(--bg-input) border border-(--border-mid) flex items-center justify-center font-mono text-[18px] text-(--accent-primary)">
							W
						</div>
						<div>
							<div className="font-mono text-[13px] text-(--text-main) mb-1">
								8x2AbY7c...F93A44kLp9M2xZ1qBv7nWs
							</div>
							<div className="flex gap-2">
								<Badge variant="success">CONNECTED</Badge>
								<Badge variant="default">MAINNET-BETA</Badge>
							</div>
						</div>
					</div>
					<div className="grid grid-cols-3 gap-4 pt-4 border-t border-(--border-dim)">
						<div>
							<div className="font-mono text-[9px] text-(--text-dark) uppercase mb-1">
								SOL BALANCE
							</div>
							<div className="font-mono text-[14px] text-(--text-main)">
								2.45100 SOL
							</div>
						</div>
						<div>
							<div className="font-mono text-[9px] text-(--text-dark) uppercase mb-1">
								STABLECOINS
							</div>
							<div className="font-mono text-[14px] text-(--text-main)">
								{userStablecoins.length}
							</div>
						</div>
						<div>
							<div className="font-mono text-[9px] text-(--text-dark) uppercase mb-1">
								TOTAL SUPPLY
							</div>
							<div className="font-mono text-[14px] text-(--text-main)">
								2.1M
							</div>
						</div>
					</div>
				</div>

				{/* User's Stablecoins */}
				<div className="bg-(--bg-surface) border border-(--border-mid)">
					<div className="px-6 py-4 border-b border-(--border-mid) flex justify-between items-center">
						<div className="font-mono text-[11px] text-(--text-dark) uppercase">
							YOUR STABLECOINS
						</div>
						<Link
							to="/create"
							className="font-mono text-[10px] text-(--accent-primary) hover:underline"
						>
							+ CREATE NEW
						</Link>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-(--border-dim)">
									<th className="text-left px-6 py-3 font-mono text-[9px] text-(--text-dark) uppercase">
										Token
									</th>
									<th className="text-left px-6 py-3 font-mono text-[9px] text-(--text-dark) uppercase">
										Mint Address
									</th>
									<th className="text-left px-6 py-3 font-mono text-[9px] text-(--text-dark) uppercase">
										Preset
									</th>
									<th className="text-right px-6 py-3 font-mono text-[9px] text-(--text-dark) uppercase">
										Supply
									</th>
									<th className="text-center px-6 py-3 font-mono text-[9px] text-(--text-dark) uppercase">
										Status
									</th>
									<th className="text-right px-6 py-3 font-mono text-[9px] text-(--text-dark) uppercase">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{userStablecoins.map((coin) => (
									<tr
										key={coin.mint}
										className="border-b border-(--border-dim) hover:bg-white/2"
									>
										<td className="px-6 py-4">
											<div className="font-mono text-[12px] text-(--text-main) font-bold">
												{coin.symbol}
											</div>
											<div className="text-[11px] text-(--text-dim)">
												{coin.name}
											</div>
										</td>
										<td className="px-6 py-4 font-mono text-[11px] text-(--text-dim)">
											{coin.mint}
										</td>
										<td className="px-6 py-4">
											<Badge variant="accent">{coin.preset}</Badge>
										</td>
										<td className="px-6 py-4 text-right font-mono text-[12px] text-(--text-main)">
											{coin.supply}
										</td>
										<td className="px-6 py-4 text-center">
											<Badge variant="success">
												{coin.status.toUpperCase()}
											</Badge>
										</td>
										<td className="px-6 py-4 text-right">
											<Link
												to="/dashboard"
												className="font-mono text-[10px] text-(--accent-primary) hover:underline"
											>
												MANAGE
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</main>

			<DashboardFooter />
		</DashboardLayout>
	);
};

export default Profile;
