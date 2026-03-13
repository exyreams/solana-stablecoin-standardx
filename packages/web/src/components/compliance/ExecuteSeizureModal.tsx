import {
	getAssociatedTokenAddressSync,
	TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Gavel, ShieldAlert, Wallet } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTokens } from "../../contexts/TokenContext";
import { adminApi } from "../../lib/api/admin";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface ExecuteSeizureModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

export const ExecuteSeizureModal: FC<ExecuteSeizureModalProps> = ({
	isOpen,
	onClose,
	onSuccess,
}) => {
	const { connection } = useConnection();
	const { selectedToken } = useTokens();
	const [sourceAddress, setSourceAddress] = useState("");
	const [toAddress, setToAddress] = useState("");
	const [amount, setAmount] = useState("");
	const [reason, setReason] = useState("");
	const [masterWallet, setMasterWallet] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [availableBalance, setAvailableBalance] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen) {
			const fetchMasterWallet = async () => {
				try {
					const data = await adminApi.getAuthority();
					setMasterWallet(data.publicKey);
				} catch (err) {
					console.error("Failed to fetch master wallet:", err);
				}
			};
			fetchMasterWallet();
		}
	}, [isOpen]);

	useEffect(() => {
		if (sourceAddress && sourceAddress.length >= 32) {
			const fetchBalance = async () => {
				try {
					const balance = await stablecoinApi.getAccountBalance(sourceAddress);
					setAvailableBalance(balance.uiAmountString);
				} catch (_err) {
					setAvailableBalance(null);
				}
			};
			fetchBalance();
		} else {
			setAvailableBalance(null);
		}
	}, [sourceAddress]);

	const handleSubmit = async () => {
		if (!sourceAddress) {
			toast.error("Source account is required");
			return;
		}
		if (!amount || parseFloat(amount) <= 0) {
			toast.error("Please enter a valid amount to seize");
			return;
		}

		const destination = toAddress || masterWallet;
		if (!destination) {
			toast.error("Destination address required");
			return;
		}

		setIsSubmitting(true);
		try {
			const decimals = selectedToken?.onChain?.decimals ?? 6;
			const scaledAmount = BigInt(
				Math.floor(parseFloat(amount) * 10 ** decimals),
			).toString();

			let resolvedSource = sourceAddress;
			try {
				const pubkey = new PublicKey(sourceAddress);
				const info = await connection.getAccountInfo(pubkey);

				// If it's not a Token Account (owner is not Token-2022), it's likely a wallet
				if (info && !info.owner.equals(TOKEN_2022_PROGRAM_ID)) {
					if (selectedToken?.mintAddress) {
						const ata = getAssociatedTokenAddressSync(
							new PublicKey(selectedToken.mintAddress),
							pubkey,
							false,
							TOKEN_2022_PROGRAM_ID,
						);
						resolvedSource = ata.toBase58();
						console.log("Resolved wallet address to ATA:", resolvedSource);
					}
				}
			} catch (pkErr) {
				console.error("Address resolution error:", pkErr);
			}

			const res = await stablecoinApi.seize(
				selectedToken?.mintAddress || "",
				resolvedSource,
				destination,
				scaledAmount,
				reason ||
					`Seized to ${destination === masterWallet ? "Master Treasury" : destination}`,
			);

			if (res.success) {
				toast.success(`Successfully seized ${amount} tokens`);
				onSuccess();
				onClose();
				setSourceAddress("");
				setToAddress("");
				setAmount("");
				setReason("");
			}
		} catch (err: any) {
			console.error("Seizure error details:", err);
			toast.error(`Seize failed: ${err.response?.data?.error || err.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleMax = () => {
		if (availableBalance) {
			setAmount(availableBalance);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Execute Asset Seizure"
			size="wide"
		>
			<div className="flex flex-col gap-6">
				<div className="bg-(--accent-red)/5 border border-(--accent-red)/20 p-4 flex items-start gap-4">
					<ShieldAlert className="w-5 h-5 text-(--accent-red) shrink-0 mt-0.5" />
					<div className="flex flex-col gap-1">
						<span className="text-[10px] font-bold text-(--accent-red) uppercase tracking-wider">
							SSS-2 COMPLIANCE PROTOCOL
						</span>
						<p className="text-[11px] text-(--text-dim) leading-relaxed">
							You are about to execute a mandatory asset seizure. This will move
							tokens from the source blacklisted wallet directly to the treasury
							or specified destination.
							<span className="text-(--accent-red) font-bold ml-1">
								THIS ACTION IS IRREVERSIBLE.
							</span>
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
								Source Blacklisted Account
							</span>
							<Input
								placeholder="Enter wallet or token address..."
								value={sourceAddress}
								onChange={(e) => setSourceAddress(e.target.value)}
								className="font-mono text-xs"
							/>
							{sourceAddress.length > 32 &&
								!sourceAddress.includes("11111") && (
									<div className="flex items-center gap-1.5 text-[8px] text-(--accent-primary) font-bold uppercase mt-1">
										<Wallet className="w-2.5 h-2.5" />
										Smart Resolution Active
									</div>
								)}
						</div>

						<div className="flex flex-col gap-1.5 opacity-60">
							<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
								Treasury Destination (ReadOnly)
							</span>
							<Input
								value={toAddress || masterWallet || "FETCHING TREASURY..."}
								readOnly
								className="font-mono text-xs bg-black/20"
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<div className="flex justify-between items-center">
								<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
									Override Destination (Optional)
								</span>
							</div>
							<Input
								placeholder="Leave empty for Master Treasury..."
								value={toAddress}
								onChange={(e) => setToAddress(e.target.value)}
								className="font-mono text-xs"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-1.5">
							<div className="flex justify-between items-center">
								<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
									Amount to Seize
								</span>
								{availableBalance && (
									<span className="text-[9px] font-mono text-(--text-dark)">
										AVAILABLE: {availableBalance}
									</span>
								)}
							</div>
							<div className="relative">
								<Input
									type="number"
									placeholder="0.00"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									className="font-mono text-xs pr-12"
								/>
								<button
									className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-(--accent-primary) hover:text-(--accent-active) transition-colors"
									onClick={handleMax}
									disabled={!availableBalance}
								>
									MAX
								</button>
							</div>
						</div>

						<div className="flex flex-col gap-1.5">
							<span className="text-[9px] uppercase font-bold text-(--text-dark) tracking-tight">
								Reason / Justification
							</span>
							<textarea
								placeholder="Enter regulatory order or audit reason..."
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) font-mono text-xs p-3 min-h-[100px] outline-none focus:border-(--accent-primary) transition-colors resize-none"
							/>
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-4 pt-4 border-t border-white/5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="w-2 h-2 rounded-full bg-(--accent-red) animate-pulse" />
							<span className="text-[10px] uppercase font-bold text-(--text-dim)">
								SYSTEMS READY // AUTH REQUIRED
							</span>
						</div>
						<div className="flex gap-3">
							<Button variant="secondary" onClick={onClose} size="sm">
								CANCEL
							</Button>
							<Button
								variant="danger"
								onClick={handleSubmit}
								isLoading={isSubmitting}
								className="px-8 flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none rounded-none"
							>
								<Gavel className="w-3.5 h-3.5" />
								EXECUTE SEIZURE
							</Button>
						</div>
					</div>
				</div>
			</div>
		</Modal>
	);
};
