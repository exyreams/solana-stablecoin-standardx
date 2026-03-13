import { type FC, useEffect, useState } from "react";
import { useTokens } from "../../contexts/TokenContext";
import { stablecoinApi } from "../../lib/api/stablecoin";

export const RecentMints: FC = () => {
	const { selectedToken } = useTokens();
	const [mints, setMints] = useState<any[]>([]);

	useEffect(() => {
		if (!selectedToken) return;

		const fetchHistory = async () => {
			try {
				const data = await stablecoinApi.getHistory(selectedToken.mintAddress);
				setMints(data.mints);
			} catch (err) {
				console.error("Failed to fetch mint history", err);
			}
		};

		fetchHistory();
		const interval = setInterval(fetchHistory, 30000);
		return () => clearInterval(interval);
	}, [selectedToken]);

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-4">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-4">
				Recent Mints
			</div>
			<div className="space-y-3">
				{mints.length === 0 ? (
					<p className="text-[10px] text-(--text-dark) font-mono italic">
						No recent mints
					</p>
				) : (
					mints.map((mint, i) => (
						<div
							key={i}
							className="flex justify-between items-center text-xs font-mono"
						>
							<div className="flex flex-col">
								<span className="text-[#00ff88]">
									+{parseFloat(mint.amount).toLocaleString()}
								</span>
								<span className="text-[9px] text-(--text-dark) truncate w-24">
									{mint.recipient}
								</span>
							</div>
							<div className="flex flex-col items-end">
								<span className="text-(--text-dim)">
									{new Date(mint.createdAt).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
								<span
									className={`text-[9px] uppercase ${mint.status === "COMPLETED" ? "text-success" : "text-warning"}`}
								>
									{mint.status}
								</span>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};
