import { type FC, useEffect, useState } from "react";
import { useTokens } from "../../contexts/TokenContext";
import { stablecoinApi } from "../../lib/api/stablecoin";

export const RecentBurns: FC = () => {
	const { selectedToken } = useTokens();
	const [burns, setBurns] = useState<any[]>([]);

	useEffect(() => {
		if (!selectedToken) return;

		const fetchHistory = async () => {
			try {
				const data = await stablecoinApi.getHistory(selectedToken.mintAddress);
				setBurns(data.burns);
			} catch (err) {
				console.error("Failed to fetch burn history", err);
			}
		};

		fetchHistory();
		const interval = setInterval(fetchHistory, 30000);
		return () => clearInterval(interval);
	}, [selectedToken]);

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) p-4">
			<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-4">
				Recent Burns
			</div>
			<div className="space-y-3">
				{burns.length === 0 ? (
					<p className="text-[10px] text-(--text-dark) font-mono italic">
						No recent burns
					</p>
				) : (
					burns.map((burn, i) => (
						<div key={i} className="space-y-1">
							<div className="flex justify-between items-center text-xs font-mono">
								<span className="text-[#ff4444]">
									-{parseFloat(burn.amount).toLocaleString()}
								</span>
								<span className="text-(--text-dim)">
									{new Date(burn.createdAt).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
							<div className="flex justify-between items-center text-[9px] font-mono">
								<span className="text-(--text-dark) truncate w-32">
									From: {burn.fromTokenAccount}
								</span>
								<span
									className={`uppercase ${burn.status === "COMPLETED" ? "text-success" : "text-warning"}`}
								>
									{burn.status}
								</span>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};
