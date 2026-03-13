import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTokens } from "../contexts/TokenContext";
import { stablecoinApi } from "../lib/api/stablecoin";

export interface BlacklistEntry {
	address: string;
	reason: string;
	timestamp: number;
}

export const useBlacklist = () => {
	const { selectedToken } = useTokens();
	const [entries, setEntries] = useState<BlacklistEntry[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const fetchBlacklist = useCallback(
		async (sync = false) => {
			if (!selectedToken) return;

			try {
				setIsLoading(true);
				const data = await stablecoinApi.listBlacklist(
					selectedToken.mintAddress,
					sync,
				);
				setEntries(data.entries);
			} catch (error) {
				console.error("Failed to fetch blacklist:", error);
				toast.error("Failed to load blacklist data");
			} finally {
				setIsLoading(false);
			}
		},
		[selectedToken],
	);

	useEffect(() => {
		fetchBlacklist();
	}, [fetchBlacklist]);

	const addToBlacklist = async (address: string, reason: string) => {
		if (!selectedToken) return;

		try {
			const promise = stablecoinApi.blacklist(
				selectedToken.mintAddress,
				address,
				reason,
			);
			toast.promise(promise, {
				loading: "Adding to blacklist...",
				success: () => {
					fetchBlacklist();
					return "Address blacklisted successfully";
				},
				error: (err) => `Failed to blacklist: ${err.message}`,
			});
			return await promise;
		} catch (error) {
			console.error("Failed to add to blacklist:", error);
		}
	};

	const removeFromBlacklist = async (address: string) => {
		if (!selectedToken) return;

		try {
			const promise = stablecoinApi.removeFromBlacklist(
				selectedToken.mintAddress,
				address,
			);
			toast.promise(promise, {
				loading: "Removing from blacklist...",
				success: () => {
					fetchBlacklist();
					return "Address removed from blacklist";
				},
				error: (err) => `Failed to remove: ${err.message}`,
			});
			return await promise;
		} catch (error) {
			console.error("Failed to remove from blacklist:", error);
		}
	};

	return {
		entries,
		isLoading,
		refresh: fetchBlacklist,
		addToBlacklist,
		removeFromBlacklist,
	};
};
