import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import { AlertCircle, ArrowRight } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
	AmountSection,
	ComplianceChecks,
	MinterSelection,
	RecentMints,
	RecipientSection,
	TransactionPreview,
} from "../../components/mint-tokens";
import { Badge, Button, TokenIcon } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useTokens } from "../../contexts/TokenContext";
import { adminApi, type MinterResponse } from "../../lib/api/admin";
import { stablecoinApi } from "../../lib/api/stablecoin";

const MintTokens: FC = () => {
	const { connection } = useConnection();
	const { publicKey, signTransaction } = useWallet();
	const { user } = useAuth();
	const { selectedToken } = useTokens();
	const [recipient, setRecipient] = useState("");
	const [amount, setAmount] = useState("");
	const [loading, setLoading] = useState(false);
	const [minters, setMinters] = useState<MinterResponse[]>([]);
	const [selectedMinter, setSelectedMinter] = useState<MinterResponse | null>(
		null,
	);
	const [backendAuthority, setBackendAuthority] = useState<string>("");
	const [isLoadingMinters, setIsLoadingMinters] = useState(true);

	const fetchMinters = useCallback(async () => {
		if (!selectedToken) return;
		setIsLoadingMinters(true);
		try {
			const data = await adminApi.getMinters(selectedToken.mintAddress);
			setMinters(data);
		} catch (err) {
			console.error("Failed to fetch minters:", err);
		} finally {
			setIsLoadingMinters(false);
		}
	}, [selectedToken]);

	const fetchBackendAuthority = useCallback(async () => {
		try {
			const data = await adminApi.getAuthority();
			setBackendAuthority(data.publicKey);
		} catch (err) {
			console.error("Failed to fetch backend authority:", err);
		}
	}, []);

	useEffect(() => {
		fetchBackendAuthority();
	}, [fetchBackendAuthority]);

	// Selection Logic Effect (Declarative)
	useEffect(() => {
		if (minters.length === 0) return;

		const walletAddr = publicKey?.toBase58();
		const isAdmin = user?.role === "ADMIN";

		// 1. If MINTER role, strictly select their own wallet record
		if (!isAdmin) {
			if (walletAddr) {
				const ownMinter = minters.find((m) => m.minter === walletAddr);
				if (ownMinter) {
					setSelectedMinter(ownMinter);
				} else {
					setSelectedMinter(null);
				}
			} else {
				setSelectedMinter(null);
			}
			return;
		}

		// 2. Admin Logic: Default selection if none exists
		if (isAdmin && !selectedMinter) {
			const backendMinter = minters.find(
				(m) => backendAuthority && m.minter === backendAuthority,
			);
			if (backendMinter) {
				setSelectedMinter(backendMinter);
			} else {
				setSelectedMinter(minters[0]);
			}
		}
	}, [
		minters,
		publicKey,
		user?.role,
		backendAuthority,
		selectedMinter === null,
	]);

	useEffect(() => {
		if (backendAuthority || user?.role === "MINTER") {
			fetchMinters();
		}
	}, [fetchMinters, backendAuthority, user?.role]);

	const [isOverQuota, setIsOverQuota] = useState(false);

	const handleMint = async () => {
		if (!selectedToken || !recipient || !amount) {
			toast.error("Please fill in all fields");
			return;
		}

		setLoading(true);
		try {
			if (user?.role === "MINTER") {
				if (!publicKey || !signTransaction) {
					toast.error("Please connect your wallet first");
					return;
				}

				if (selectedMinter?.minter !== publicKey.toBase58()) {
					toast.error("You must select your connected wallet as the minter");
					return;
				}

				// Prepare transaction
				const { transaction: txBase64 } = await stablecoinApi.prepareMint(
					selectedToken.mintAddress,
					recipient,
					parseFloat(amount),
					publicKey.toBase58(),
				);

				const tx = Transaction.from(Buffer.from(txBase64, "base64"));

				// Set recent blockhash and fee payer
				const { blockhash, lastValidBlockHeight } =
					await connection.getLatestBlockhash("confirmed");
				tx.recentBlockhash = blockhash;
				tx.lastValidBlockHeight = lastValidBlockHeight;
				tx.feePayer = publicKey;

				const signedTx = await signTransaction(tx);
				const sig = await connection.sendRawTransaction(signedTx.serialize());
				await connection.confirmTransaction(sig);

				toast.success("Minted successfully!");
			} else {
				// Admin / Server flow
				const response = await stablecoinApi.mint(
					selectedToken.mintAddress,
					recipient,
					parseFloat(amount),
					selectedMinter?.minter,
				);
				if (response.success) {
					toast.success("Mint transaction queued successfully");
				}
			}

			setRecipient("");
			setAmount("");
			fetchMinters();
		} catch (error: any) {
			console.error("Minting failed:", error);
			const errorMsg =
				error.response?.data?.error || error.message || "Failed to mint tokens";
			toast.error(errorMsg);
		} finally {
			setLoading(false);
		}
	};

	const complianceChecks: {
		label: string;
		status: "passed" | "failed" | "pending";
	}[] = [
		{
			label: "Token Status (Not Paused)",
			status: selectedToken?.onChain?.paused ? "failed" : "passed",
		},
		{
			label: "Minter Authorized & Quota",
			status: !selectedMinter ? "pending" : isOverQuota ? "failed" : "passed",
		},
		{
			label: "Recipient Address Format",
			status: !recipient
				? "pending"
				: recipient.length >= 32 && recipient.length <= 44
					? "passed"
					: "failed",
		},
		{
			label: "Valid Mint Amount",
			status: !amount
				? "pending"
				: parseFloat(amount) > 0
					? "passed"
					: "failed",
		},
	];

	const isReady =
		complianceChecks.every((c) => c.status === "passed") &&
		!loading &&
		(user?.role === "ADMIN" ||
			(selectedMinter &&
				publicKey &&
				selectedMinter.minter === publicKey.toBase58()));

	return (
		<>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					{selectedToken && (
						<TokenIcon
							symbol={selectedToken.symbol}
							logoUri={selectedToken.onChain?.uri || selectedToken.uri}
							size="lg"
						/>
					)}

					<div>
						<h1 className="text-2xl font-mono font-light mb-1">Mint Tokens</h1>
						<p className="text-[#777777] text-sm">
							Create new token supply for{" "}
							<span className="text-[#EAEAEA] font-mono">
								{selectedToken?.name || "selected token"}
							</span>
						</p>
					</div>
				</div>
				<Badge variant="accent">
					{selectedToken?.preset?.toUpperCase() || "SSS"} COMPLIANT
				</Badge>
			</div>

			<div className="grid grid-cols-3 gap-6 mt-6">
				<div className="col-span-2 space-y-6">
					<RecipientSection value={recipient} onChange={setRecipient} />
					<AmountSection
						value={amount}
						onChange={setAmount}
						symbol={selectedToken?.symbol || "TOKENS"}
					/>
					<MinterSelection
						minters={minters}
						selectedMinter={selectedMinter}
						onSelect={setSelectedMinter}
						isLoading={isLoadingMinters}
						amountToMint={parseFloat(amount) || 0}
						onQuotaStatusChange={setIsOverQuota}
						backendAuthority={backendAuthority}
						decimals={selectedToken?.onChain?.decimals ?? 6}
						publicKey={publicKey?.toBase58()}
					/>

					<div className="flex gap-3">
						{user?.role === "MINTER" && !publicKey ? (
							<Button
								variant="primary"
								className="flex-1 h-12"
								onClick={() => {
									// Trigger wallet modal - but usually handled by WalletMultiButton
									// We can just show a message or use the select wallet trigger if exposed.
									toast.info("Please connect your wallet in the top bar");
								}}
							>
								CONNECT WALLET TO MINT
							</Button>
						) : (
							<Button
								variant="primary"
								className="flex-1 h-12"
								onClick={handleMint}
								disabled={!isReady}
								isLoading={loading}
							>
								<span className="flex items-center justify-center gap-2">
									{selectedMinter &&
									selectedMinter.quota !== "0" &&
									(isOverQuota ||
										BigInt(selectedMinter.minted) >=
											BigInt(selectedMinter.quota))
										? "INSUFFICIENT QUOTA"
										: "MINT TOKENS"}
									{!loading && <ArrowRight className="w-4 h-4" />}
								</span>
							</Button>
						)}
						<Button
							variant="ghost"
							className="h-12 px-8"
							onClick={() => {
								setRecipient("");
								setAmount("");
							}}
						>
							CANCEL
						</Button>
					</div>
				</div>

				<div className="space-y-6">
					<TransactionPreview
						amount={amount}
						symbol={selectedToken?.symbol || ""}
						recipient={recipient}
						minter={selectedMinter?.minter || ""}
						currentSupply={selectedToken?.onChain?.supply}
					/>
					<ComplianceChecks checks={complianceChecks} />
					<RecentMints />

					<div className="bg-[#161616] border border-[#222222] p-4">
						<div className="flex items-start gap-2">
							<AlertCircle className="w-4 h-4 text-[#CCA352] shrink-0 mt-0.5" />
							<div className="text-[10px] text-[#777777] leading-relaxed font-mono">
								Minting creates new tokens and increases total supply. This
								action is recorded on-chain and cannot be reversed.
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default MintTokens;
