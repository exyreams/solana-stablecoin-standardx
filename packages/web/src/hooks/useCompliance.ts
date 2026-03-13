import { useCallback, useEffect, useState } from "react";
import { useTokens } from "../contexts/TokenContext";
import { stablecoinApi } from "../lib/api/stablecoin";

export interface ComplianceStats {
	totalBlacklisted: number;
	totalSeized: number;
	lastUpdate: string;
	lastAuthority: string;
	hookStatus: "ACTIVE" | "INACTIVE";
}

export interface SeizureRecord {
	from: string;
	to: string;
	amount: string;
	signature: string;
	timestamp: string;
}

export const useCompliance = () => {
	const { selectedToken } = useTokens();
	const [stats, setStats] = useState<ComplianceStats>({
		totalBlacklisted: 0,
		totalSeized: 0,
		lastUpdate: "-",
		lastAuthority: "-",
		hookStatus: "ACTIVE",
	});
	const [history, setHistory] = useState<SeizureRecord[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchComplianceData = useCallback(async () => {
		if (!selectedToken) return;

		try {
			setIsLoading(true);

			// 1. Fetch Blacklist for total count
			const blacklistData = await stablecoinApi.listBlacklist(
				selectedToken.mintAddress,
			);

			// 2. Fetch Audit Logs for seizure history and total seized
			const auditData = await stablecoinApi.getAuditLogs(100);

			const seizures = auditData.entries
				.filter((entry: any) => entry.action === "SEIZE")
				.map((entry: any) => {
					let amount = "0";
					let to = "-";
					try {
						const details = JSON.parse(entry.reason || "{}");
						amount = details.amount || "0";
						to = details.destination || "-";
					} catch (_e) {
						// Fallback if reason is not JSON
					}

					return {
						from: entry.address || "-",
						to,
						amount,
						signature: entry.signature || "",
						timestamp: entry.timestamp,
					};
				});

			// Calculate total seized
			const decimals = selectedToken.onChain?.decimals || 6;
			const totalSeizedRaw = seizures.reduce(
				(acc: number, curr: any) => acc + Number(curr.amount),
				0,
			);
			const totalSeized = totalSeizedRaw / Math.pow(10, decimals);

			// Find last update
			const lastEntry = auditData.entries[0];
			let lastUpdate = "-";
			let lastAuthority = "-";

			if (lastEntry) {
				const d = new Date(lastEntry.timestamp);
				lastUpdate = `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")} UTC`;
				lastAuthority = "ADMIN"; // Audit logs currently track admin actions
			}

			setStats({
				totalBlacklisted: blacklistData.entries.length,
				totalSeized,
				lastUpdate,
				lastAuthority,
				hookStatus: "ACTIVE", // TODO: Real hook status check if needed
			});

			setHistory(seizures);
		} catch (error) {
			console.error("Failed to fetch compliance data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [selectedToken]);

	useEffect(() => {
		fetchComplianceData();
	}, [fetchComplianceData]);

	return {
		stats,
		history,
		isLoading,
		refresh: fetchComplianceData,
	};
};
