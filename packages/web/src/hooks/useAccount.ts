import {
	getAssociatedTokenAddressSync,
	TOKEN_2022_PROGRAM_ID,
	unpackAccount,
} from "@solana/spl-token";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useEffect, useState } from "react";
import { useTokens } from "../contexts/TokenContext";

export interface AccountData {
	address: string;
	owner: string;
	balance: string;
	symbol: string;
	isFrozen: boolean;
	delegate: string | null;
	isNative: boolean;
	mint: string;
	resolvedFromWallet?: string;
}

export const useAccount = (address: string | null) => {
	const { connection } = useConnection();
	const { selectedToken } = useTokens();
	const [accountData, setAccountData] = useState<AccountData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchAccount = useCallback(async () => {
		if (!address || !selectedToken) {
			setAccountData(null);
			return;
		}

		try {
			setIsLoading(true);
			setError(null);

			let pubkey = new PublicKey(address);
			let info = await connection.getAccountInfo(pubkey);
			let resolvedFromWallet: string | undefined;

			if (!info) {
				// Address doesn't exist, maybe it's a wallet and we need to find its ATA?
				// Or it's an empty ATA?
				// Let's check if it's a valid wallet by trying to derive ATA
				const ata = getAssociatedTokenAddressSync(
					new PublicKey(selectedToken.mintAddress),
					pubkey,
					false,
					TOKEN_2022_PROGRAM_ID,
				);

				const ataInfo = await connection.getAccountInfo(ata);
				if (ataInfo) {
					resolvedFromWallet = pubkey.toBase58();
					pubkey = ata;
					info = ataInfo;
				} else {
					setError("Account or Wallet ATA not found");
					setAccountData(null);
					return;
				}
			} else {
				// Address exists. Is it a Token Account or a System Account?
				// If it's a Token Account, program owner will be TOKEN_2022_PROGRAM_ID
				if (!info.owner.equals(TOKEN_2022_PROGRAM_ID)) {
					// It's likely a System Account (Wallet). Resolve ATA.
					const ata = getAssociatedTokenAddressSync(
						new PublicKey(selectedToken.mintAddress),
						pubkey,
						false,
						TOKEN_2022_PROGRAM_ID,
					);
					const ataInfo = await connection.getAccountInfo(ata);
					if (ataInfo) {
						resolvedFromWallet = pubkey.toBase58();
						pubkey = ata;
						info = ataInfo;
					} else {
						setError(
							`Wallet found, but no ${selectedToken.symbol} account exists for it.`,
						);
						setAccountData(null);
						return;
					}
				}
			}

			const account = unpackAccount(pubkey, info, TOKEN_2022_PROGRAM_ID);

			if (account.mint.toBase58() !== selectedToken.mintAddress) {
				setError("Account does not match current mint");
				setAccountData(null);
				return;
			}

			setAccountData({
				address: pubkey.toBase58(),
				owner: account.owner.toBase58(),
				balance: (
					Number(account.amount) / Math.pow(10, selectedToken.decimals)
				).toLocaleString(undefined, {
					minimumFractionDigits: 2,
					maximumFractionDigits: selectedToken.decimals,
				}),
				symbol: selectedToken.symbol,
				isFrozen: account.isFrozen,
				delegate: account.delegate ? account.delegate.toBase58() : null,
				isNative: account.isNative,
				mint: account.mint.toBase58(),
				resolvedFromWallet,
			});
		} catch (e: any) {
			console.error("Failed to fetch account:", e);
			setError(e.message || "Invalid address");
			setAccountData(null);
		} finally {
			setIsLoading(false);
		}
	}, [address, selectedToken, connection]);

	useEffect(() => {
		fetchAccount();
	}, [fetchAccount]);

	return { accountData, isLoading, error, refresh: fetchAccount };
};
