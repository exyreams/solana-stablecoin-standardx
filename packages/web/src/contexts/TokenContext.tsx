import { useWallet } from "@solana/wallet-adapter-react";
import type { FC, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { adminApi } from "../lib/api/admin";
import { type StablecoinDetails, stablecoinApi } from "../lib/api/stablecoin";
import { useAuth } from "./AuthContext";

interface TokenContextType {
	tokens: StablecoinDetails[];
	selectedToken: StablecoinDetails | null;
	setSelectedToken: (token: StablecoinDetails) => void;
	isLoading: boolean;
	refreshTokens: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

export const TokenProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const [tokens, setTokens] = useState<StablecoinDetails[]>([]);
	const [authorizedMints, setAuthorizedMints] = useState<string[] | null>(null);
	const [selectedToken, setSelectedToken] = useState<StablecoinDetails | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(true);
	const { publicKey } = useWallet();
	const { user } = useAuth();

	const isMinter = user?.role === "MINTER";

	const fetchTokens = async () => {
		try {
			setIsLoading(true);
			const data = await stablecoinApi.list();
			setTokens(data.stablecoins);

			// If minter, fetch authorized mints
			if (isMinter && publicKey) {
				try {
					const mints = await adminApi.getMinterStatus(publicKey.toBase58());
					setAuthorizedMints(mints);
				} catch (e) {
					console.error("Failed to fetch minter status:", e);
					setAuthorizedMints([]);
				}
			} else {
				setAuthorizedMints(null);
			}

			// Auto-select first token if none selected or if previously selected token is not in the list
			const savedMint = localStorage.getItem("selected_token_mint");
			const displayTokens =
				isMinter && publicKey && authorizedMints
					? data.stablecoins.filter((t) =>
							authorizedMints.includes(t.mintAddress),
						)
					: data.stablecoins;

			const found = displayTokens.find((t) => t.mintAddress === savedMint);

			if (found) {
				setSelectedToken(found);
			} else if (displayTokens.length > 0) {
				setSelectedToken(displayTokens[0]);
				localStorage.setItem(
					"selected_token_mint",
					displayTokens[0].mintAddress,
				);
			}
		} catch (error) {
			console.error("Failed to fetch tokens:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Refetch when wallet or role changes
	useEffect(() => {
		fetchTokens();
	}, [publicKey, user?.role]);

	const filteredTokens = useMemo(() => {
		if (isMinter) {
			if (!publicKey || authorizedMints === null) return [];
			return tokens.filter((t) => authorizedMints.includes(t.mintAddress));
		}
		return tokens;
	}, [tokens, authorizedMints, isMinter, publicKey]);

	const handleSetSelectedToken = (token: StablecoinDetails) => {
		setSelectedToken(token);
		localStorage.setItem("selected_token_mint", token.mintAddress);
	};

	return (
		<TokenContext.Provider
			value={{
				tokens: filteredTokens,
				selectedToken,
				setSelectedToken: handleSetSelectedToken,
				isLoading,
				refreshTokens: fetchTokens,
			}}
		>
			{children}
		</TokenContext.Provider>
	);
};

export const useTokens = () => {
	const context = useContext(TokenContext);
	if (context === undefined) {
		throw new Error("useTokens must be used within a TokenProvider");
	}
	return context;
};
