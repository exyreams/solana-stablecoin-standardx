import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AlertCircle, ArrowRight, Flame } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	BurnForm,
	BurnPreview,
	RecentBurns,
} from "../../components/burn-tokens";
import { Badge, Button } from "../../components/ui";
import { useTokens } from "../../contexts/TokenContext";
import { stablecoinApi } from "../../lib/api/stablecoin";

const BurnTokens: FC = () => {
	const { connection } = useConnection();
	const { publicKey } = useWallet();
	const { selectedToken } = useTokens();
	const [fromTokenAccount, setFromTokenAccount] = useState("");
	const [amount, setAmount] = useState("");
	const [loading, setLoading] = useState(false);

	const [tokenAccountBalance, setTokenAccountBalance] = useState<string>("0");
	const [isFetchingBalance, setIsFetchingBalance] = useState(false);

	const resolveTokenAccount = useCallback(
		async (address: string) => {
			if (!selectedToken || !connection) return address;
			try {
				const pubkey = new PublicKey(address);
				const accountInfo = await connection.getAccountInfo(pubkey);

				// If it matches System Program (Wallet), find its ATA
				if (
					accountInfo &&
					accountInfo.owner.toBase58() === "11111111111111111111111111111111"
				) {
					const ata = await connection.getParsedTokenAccountsByOwner(pubkey, {
						mint: new PublicKey(selectedToken.mintAddress),
					});
					if (ata.value.length > 0) {
						return ata.value[0].pubkey.toBase58();
					}
				}
			} catch (_e) {
				// Ignore invalid format
			}
			return address;
		},
		[selectedToken, connection],
	);

	const fetchTokenAccount = useCallback(async () => {
		if (!selectedToken || !connection || !fromTokenAccount) {
			setTokenAccountBalance("0");
			return;
		}

		setIsFetchingBalance(true);
		try {
			const targetAccount = await resolveTokenAccount(fromTokenAccount);
			const response = await connection.getParsedAccountInfo(
				new PublicKey(targetAccount),
			);
			if (response.value) {
				const data = response.value.data as any;
				if (data.parsed?.info?.tokenAmount) {
					setTokenAccountBalance(data.parsed.info.tokenAmount.uiAmountString);
				}
			} else {
				setTokenAccountBalance("0");
			}
		} catch (err) {
			console.error("Failed to fetch token account balance:", err);
			setTokenAccountBalance("0");
		} finally {
			setIsFetchingBalance(false);
		}
	}, [fromTokenAccount, selectedToken, connection, resolveTokenAccount]);

	useEffect(() => {
		fetchTokenAccount();
	}, [fetchTokenAccount]);

	const handleBurn = async () => {
		if (!selectedToken || !fromTokenAccount || !amount) {
			toast.error("Please fill in all fields");
			return;
		}

		setLoading(true);
		try {
			// Resolve address one last time before burning
			const resolvedAccount = await resolveTokenAccount(fromTokenAccount);

			// Backend-only flow
			const response = await stablecoinApi.burn(
				selectedToken.mintAddress,
				resolvedAccount,
				parseFloat(amount),
			);

			if (response.success) {
				toast.success("Burn transaction queued successfully");
				setFromTokenAccount("");
				setAmount("");
				setTokenAccountBalance("0");
			}
		} catch (error: any) {
			console.error("Burning failed:", error);
			const errorMsg =
				error.response?.data?.error || error.message || "Failed to burn tokens";
			toast.error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className="font-mono text-[10px] text-[#777777] mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<a href="#" className="hover:text-[#CCA352]">
						Dashboard
					</a>
					<span className="text-[#444444]">/</span>
					<a href="#" className="hover:text-[#CCA352]">
						{selectedToken?.symbol || "TOKEN"}
					</a>
					<span className="text-[#444444]">/</span>
					<span className="text-[#EAEAEA]">Burn</span>
				</div>
				<Badge variant="danger">ADMIN PRIVILEGE</Badge>
			</div>

			<div className="flex items-center gap-4 mb-8">
				<div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
					<Flame className="w-6 h-6 text-red-500" />
				</div>
				<div>
					<h1 className="text-2xl font-mono font-light tracking-tight flex items-center gap-3">
						TREASURY SUPPLY BURN ({selectedToken?.symbol})
						<Badge
							variant="accent"
							className="text-[10px] border-red-500/30 text-red-500/70"
						>
							SUPPLY CONTROL
						</Badge>
					</h1>

					<p className="text-[#777777] text-xs font-mono uppercase tracking-wider">
						Permanently delete tokens from the treasury to reduce total supply
					</p>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-8">
				<div className="col-span-2 space-y-6">
					<BurnForm
						fromTokenAccount={fromTokenAccount}
						onFromTokenAccountChange={setFromTokenAccount}
						amount={amount}
						onAmountChange={setAmount}
						symbol={selectedToken?.symbol || "TOKEN"}
						balance={tokenAccountBalance}
						isFetchingBalance={isFetchingBalance}
						onRefreshBalance={fetchTokenAccount}
					/>

					<div className="flex justify-end -mt-4">
						<Button
							variant="ghost"
							size="sm"
							className="text-[10px] text-[#CCA352] hover:bg-[#CCA352]/10 h-6"
							onClick={() => {
								if (publicKey) {
									setFromTokenAccount(publicKey.toBase58());
									toast.success("Wallet address auto-filled");
								} else {
									toast.error("Please connect your wallet first");
								}
							}}
						>
							<span className="flex items-center gap-1">
								<ArrowRight className="w-3 h-3 rotate-180" />
								USE MY CONNECTED WALLET (TREASURY BURN)
							</span>
						</Button>
					</div>

					<div className="flex gap-3">
						<Button
							variant="danger"
							className="flex-1 h-12"
							onClick={handleBurn}
							disabled={loading || !fromTokenAccount || !amount}
							isLoading={loading}
						>
							<span className="flex items-center justify-center gap-2">
								<Flame className="w-4 h-4" />
								{loading ? "BURNING..." : "BURN TOKENS (SIGN AS ADMIN)"}
								{!loading && <ArrowRight className="w-4 h-4" />}
							</span>
						</Button>
						<Button
							variant="ghost"
							className="h-12 px-8"
							onClick={() => {
								setFromTokenAccount("");
								setAmount("");
							}}
						>
							CANCEL
						</Button>
					</div>
				</div>

				<div className="space-y-6">
					<BurnPreview />
					<RecentBurns />

					<div className="bg-[#161616] border border-[#222222] p-4">
						<div className="flex items-start gap-2">
							<AlertCircle className="w-4 h-4 text-[#ff4444] shrink-0 mt-0.5" />
							<div className="text-[10px] text-[#777777] leading-relaxed">
								Burning tokens permanently destroys them and reduces total
								supply. The transaction will be signed by the system master
								authority.
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default BurnTokens;
