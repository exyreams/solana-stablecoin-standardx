import { Loader2 } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { PresetCard, Stepper } from "../components/create-stablecoin";
import { Button } from "../components/ui/Button";
import { adminApi } from "../lib/api/admin";
import {
	type CreateStablecoinResponse,
	stablecoinApi,
} from "../lib/api/stablecoin";

type Preset = "sss1" | "sss2" | "sss3" | "custom" | null;
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const Create: FC = () => {
	const [currentStep, setCurrentStep] = useState<Step>(1);
	const [selectedPreset, setSelectedPreset] = useState<Preset>("sss2");
	const [isDeploying, setIsDeploying] = useState(false);
	const [authorityPubkey, setAuthorityPubkey] = useState<string>("");
	const [deploymentResult, setDeploymentResult] =
		useState<CreateStablecoinResponse | null>(null);

	const [formData, setFormData] = useState({
		tokenName: "",
		tokenSymbol: "",
		decimals: 6,
		metadataUri: "",
		extensions: {
			permanentDelegate: false,
			transferHook: false,
			defaultFrozen: false,
			confidential: false,
			transferFee: false,
			nonTransferable: false,
		},
		roles: {
			master: "",
			minter: "",
			burner: "",
			pauser: "",
			blacklister: "",
		},
		oracle: {
			enabled: false,
			baseAsset: "EUR",
			quoteAsset: "USD",
			feedAddress: "",
			weight: 100,
		},
	});

	useEffect(() => {
		adminApi
			.getAuthority()
			.then((res) => {
				setAuthorityPubkey(res.publicKey);
			})
			.catch((err) => {
				console.error("Failed to fetch authority", err);
			});
	}, []);

	const handleDeploy = async () => {
		if (!formData.tokenName || !formData.tokenSymbol) {
			toast.error("Please fill in basic info");
			setCurrentStep(2);
			return;
		}

		setIsDeploying(true);
		try {
			const payload = {
				preset: selectedPreset as "sss1" | "sss2" | "sss3",
				name: formData.tokenName,
				symbol: formData.tokenSymbol,
				decimals: formData.decimals,
				uri: formData.metadataUri || undefined,
				extensions: {
					permanentDelegate:
						selectedPreset === "sss2" || formData.extensions.permanentDelegate,
					transferHook:
						selectedPreset === "sss2" || formData.extensions.transferHook,
					defaultFrozen: formData.extensions.defaultFrozen,
				},
				roles: {
					minter: formData.roles.minter || authorityPubkey,
					burner: formData.roles.burner || authorityPubkey,
					pauser: formData.roles.pauser || authorityPubkey,
					blacklister:
						formData.roles.blacklister ||
						(selectedPreset === "sss2" ? authorityPubkey : undefined),
				},
			};

			const result = await stablecoinApi.create(payload);
			setDeploymentResult(result);
			setCurrentStep(7);
			toast.success("Stablecoin deployed successfully!");
		} catch (error: any) {
			toast.error(error.response?.data?.error || "Deployment failed");
		} finally {
			setIsDeploying(false);
		}
	};

	const steps = [
		{
			number: 1,
			label: "PRESET",
			active: currentStep === 1,
			completed: currentStep > 1,
		},
		{
			number: 2,
			label: "BASIC INFO",
			active: currentStep === 2,
			completed: currentStep > 2,
		},
		{
			number: 3,
			label: "EXTENSIONS",
			active: currentStep === 3,
			completed: currentStep > 3,
		},
		{
			number: 4,
			label: "ROLES",
			active: currentStep === 4,
			completed: currentStep > 4,
		},
		{
			number: 5,
			label: "ORACLE",
			active: currentStep === 5,
			completed: currentStep > 5,
		},
		{
			number: 6,
			label: "REVIEW",
			active: currentStep === 6,
			completed: currentStep > 6,
		},
	];

	const nextStep = () => {
		if (currentStep < 7) setCurrentStep((currentStep + 1) as Step);
	};

	const prevStep = () => {
		if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
	};

	// Step 1: Preset Selection
	const renderStep1 = () => (
		<div className="grid grid-cols-2 gap-6 px-8 pb-24">
			<PresetCard
				name="SSS-1 MINIMAL"
				description="Standard SPL token with basic mint/burn authority. No compliance extensions."
				useCase="Governance tokens, Simple stable assets, Testnet prototypes"
				features={[
					{ label: "MINT ✓", enabled: true },
					{ label: "BURN ✓", enabled: true },
					{ label: "FREEZE ✗", enabled: false },
					{ label: "BLACKLIST ✗", enabled: false },
					{ label: "ORACLE ✗", enabled: false },
					{ label: "CONFIDENTIAL ✗", enabled: false },
				]}
				selected={selectedPreset === "sss1"}
				onSelect={() => setSelectedPreset("sss1")}
			/>
			<PresetCard
				name="SSS-2 COMPLIANT"
				description="Full regulatory compliance suite with blacklist, seizure, and freeze capabilities."
				useCase="Regulated stablecoins, CBDC prototypes, Institutional assets"
				features={[
					{ label: "MINT ✓", enabled: true },
					{ label: "BURN ✓", enabled: true },
					{ label: "FREEZE ✓", enabled: true },
					{ label: "BLACKLIST ✓", enabled: true },
					{ label: "SEIZE ✓", enabled: true },
					{ label: "ORACLE OPT", enabled: true, color: "text-(--text-dim)" },
				]}
				selected={selectedPreset === "sss2"}
				recommended
				onSelect={() => setSelectedPreset("sss2")}
			/>
			<PresetCard
				name="SSS-3 PRIVATE"
				description="Confidential transfers via ZK proofs. Token-2022 extension required."
				useCase="Privacy-preserving payments, Institutional settlement"
				features={[
					{ label: "MINT ✓", enabled: true },
					{ label: "BURN ✓", enabled: true },
					{ label: "FREEZE ✓", enabled: true },
					{ label: "BLACKLIST ✓", enabled: true },
					{ label: "SEIZE ✓", enabled: true },
					{ label: "CONFIDENTIAL ✓", enabled: true, color: "text-blue-400" },
				]}
				selected={selectedPreset === "sss3"}
				onSelect={() => setSelectedPreset("sss3")}
			/>
			<PresetCard
				name="CUSTOM"
				description="Build a custom extension configuration from scratch."
				useCase="Advanced users, Research deployments"
				features={[
					{ label: "MINT O/I", enabled: false },
					{ label: "BURN O/I", enabled: false },
					{ label: "FREEZE O/I", enabled: false },
					{ label: "BLACKLIST O/I", enabled: false },
					{ label: "TRANSFER FEE", enabled: false },
					{ label: "INTEREST", enabled: false },
				]}
				selected={selectedPreset === "custom"}
				dashed
				onSelect={() => setSelectedPreset("custom")}
			/>
		</div>
	);

	// Step 2: Basic Info
	const renderStep2 = () => (
		<div className="grid grid-cols-[1fr_380px] gap-12 px-8 pb-24">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<label className="font-mono text-[10px] text-(--text-dim) uppercase tracking-wider">
						Token Name
					</label>
					<input
						type="text"
						placeholder="e.g. USD Coin"
						value={formData.tokenName}
						onChange={(e) =>
							setFormData({ ...formData, tokenName: e.target.value })
						}
						className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-3 py-3 font-mono text-[13px] outline-none focus:border-(--accent-primary)"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<div className="flex justify-between items-end">
						<label className="font-mono text-[10px] text-(--text-dim) uppercase tracking-wider">
							Token Symbol
						</label>
						<span className="font-mono text-[9px] text-(--text-dark)">
							{formData.tokenSymbol.length} / 8
						</span>
					</div>
					<input
						type="text"
						placeholder="e.g. USDC"
						maxLength={8}
						value={formData.tokenSymbol}
						onChange={(e) =>
							setFormData({ ...formData, tokenSymbol: e.target.value })
						}
						className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-3 py-3 font-mono text-[13px] outline-none focus:border-(--accent-primary)"
					/>
				</div>
				<div className="flex flex-col gap-2">
					<label className="font-mono text-[10px] text-(--text-dim) uppercase tracking-wider">
						Decimals
					</label>
					<div className="flex bg-(--bg-input) border border-(--border-mid) w-fit">
						{[6, 8, 9].map((d) => (
							<button
								key={d}
								onClick={() => setFormData({ ...formData, decimals: d })}
								className={`px-6 py-2 text-[11px] font-mono ${
									formData.decimals === d
										? "bg-(--accent-primary) text-black font-bold"
										: "text-(--text-dim)"
								}`}
							>
								{d}
							</button>
						))}
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<label className="font-mono text-[10px] text-(--text-dim) uppercase tracking-wider">
						Metadata URI{" "}
						<span className="text-(--text-dark) normal-case">(Optional)</span>
					</label>
					<input
						type="text"
						placeholder="https://arweave.net/..."
						value={formData.metadataUri}
						onChange={(e) =>
							setFormData({ ...formData, metadataUri: e.target.value })
						}
						className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-3 py-3 font-mono text-[13px] outline-none focus:border-(--accent-primary)"
					/>
				</div>
			</div>
			<div className="sticky top-0">
				<div className="font-mono text-[9px] text-(--text-dark) mb-3 tracking-widest">
					LIVE PREVIEW
				</div>
				<div className="bg-(--bg-surface) border border-(--border-mid) aspect-square flex flex-col items-center justify-center p-10 relative overflow-hidden">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(204,163,82,0.12)_0%,transparent_70%)]" />
					<div className="text-5xl font-light tracking-widest text-(--accent-active) mb-2 font-mono relative z-10">
						{formData.tokenSymbol || "USDC"}
					</div>
					<div className="font-mono text-sm text-(--text-dim) uppercase tracking-[0.2em] relative z-10">
						{formData.tokenName || "USD COIN"}
					</div>
					<div className="absolute bottom-6 left-6 right-6 flex justify-between font-mono text-[10px] text-(--text-dark)">
						<div>DECIMALS: {formData.decimals}</div>
						<div>
							TYPE: SSS-
							{selectedPreset === "sss1"
								? "1"
								: selectedPreset === "sss2"
									? "2"
									: "3"}
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	// Step 3: Extensions
	const renderStep3 = () => (
		<div className="px-8 pb-24 max-w-4xl">
			<div className="font-mono text-[11px] text-(--text-dark) tracking-wider mb-5 border-b border-(--border-dim) pb-2">
				TOKEN-2022 EXTENSIONS
			</div>
			<div className="space-y-2">
				{[
					{
						key: "permanentDelegate",
						label: "PERMANENT DELEGATE",
						desc: "Allows delegate to transfer/burn without owner approval",
						badge: "SSS-2",
					},
					{
						key: "transferHook",
						label: "TRANSFER HOOK",
						desc: "Execute custom program logic on every transfer",
						badge: "CUSTOM",
					},
					{
						key: "defaultFrozen",
						label: "DEFAULT ACCOUNT FROZEN",
						desc: "New token accounts start in frozen state",
						badge: "SSS-2",
					},
					{
						key: "confidential",
						label: "CONFIDENTIAL TRANSFERS",
						desc: "ZK-proof based private balance transfers",
						badge: "SSS-3",
					},
				].map((ext) => (
					<div
						key={ext.key}
						className="bg-(--bg-surface) border border-(--border-mid) p-4 flex items-center gap-4"
					>
						<div
							onClick={() =>
								setFormData({
									...formData,
									extensions: {
										...formData.extensions,
										[ext.key]:
											!formData.extensions[
												ext.key as keyof typeof formData.extensions
											],
									},
								})
							}
							className={`w-8 h-4 border relative cursor-pointer ${
								formData.extensions[ext.key as keyof typeof formData.extensions]
									? "bg-[rgba(204,163,82,0.2)] border-(--accent-primary)"
									: "bg-(--bg-input) border-(--border-mid)"
							}`}
						>
							<div
								className={`absolute w-2.5 h-2.5 top-px transition-all ${
									formData.extensions[
										ext.key as keyof typeof formData.extensions
									]
										? "left-4 bg-(--accent-primary)"
										: "left-px bg-(--text-dark)"
								}`}
							/>
						</div>
						<div className="flex-1">
							<div className="font-mono font-bold text-[11px] tracking-wider text-(--text-main) mb-1">
								{ext.label}{" "}
								<span className="text-[9px] px-1.5 py-0.5 border border-(--border-mid) text-(--text-dark) ml-2">
									{ext.badge}
								</span>
							</div>
							<div className="text-[11px] text-(--text-dim)">{ext.desc}</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);

	// Step 4: Roles
	const renderStep4 = () => (
		<div className="px-8 pb-24 max-w-4xl">
			<div className="bg-(--bg-surface) border border-(--border-mid) px-3 py-3 flex items-center gap-3 mb-8">
				<div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#00ff88]" />
				<div className="font-mono text-[11px] text-(--accent-active)">
					SYSTEM AUTHORITY: {authorityPubkey}
				</div>
			</div>
			{[
				{ key: "master", label: "MASTER AUTHORITY", required: true },
				{ key: "minter", label: "INITIAL MINTER", required: false },
				{ key: "burner", label: "BURNER AUTHORITY", required: false },
				{ key: "pauser", label: "PAUSER AUTHORITY", required: false },
				{
					key: "blacklister",
					label: "BLACKLISTER AUTHORITY",
					required: false,
					badge: "SSS-2",
				},
			].map((role) => (
				<div
					key={role.key}
					className="grid grid-cols-[200px_1fr] gap-8 py-5 border-b border-(--border-dim)"
				>
					<div className="flex flex-col gap-1">
						<div className="font-mono text-[11px] font-bold text-(--text-main) tracking-wider">
							{role.label}
							{role.badge && (
								<span className="text-[8px] px-1 py-0.5 border border-(--text-dark) text-(--text-dark) ml-1.5">
									{role.badge}
								</span>
							)}
						</div>
						{!role.required && (
							<div className="text-[9px] text-(--text-dark) uppercase">
								Optional
							</div>
						)}
					</div>
					<div className="relative">
						{role.key === "master" ? (
							<div className="relative">
								<input
									type="text"
									value={authorityPubkey}
									readOnly
									className="w-full bg-black/20 border border-(--border-dim) text-(--text-dim) px-3 py-2.5 font-mono text-[12px] pr-10"
								/>
								<span className="absolute right-3 top-3 text-[12px]">🔒</span>
							</div>
						) : (
							<input
								type="text"
								placeholder="Defaults to Master if empty"
								value={formData.roles[role.key as keyof typeof formData.roles]}
								onChange={(e) =>
									setFormData({
										...formData,
										roles: { ...formData.roles, [role.key]: e.target.value },
									})
								}
								className="w-full bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-3 py-2.5 font-mono text-[12px] outline-none focus:border-(--accent-primary)"
							/>
						)}
					</div>
				</div>
			))}
			{/* Smart Defaulting Hint */}
			<div className="mt-8 p-4 bg-[rgba(204,163,82,0.05)] border border-dashed border-[rgba(204,163,82,0.3)] flex items-start gap-4">
				<div className="text-(--accent-primary) text-lg mt-0.5">💡</div>
				<div>
					<div className="font-mono text-[11px] font-bold text-(--accent-primary) mb-1 uppercase tracking-wider">
						Smart Defaulting
					</div>
					<p className="text-[11px] text-(--text-dim) leading-relaxed">
						By default, the <strong>Master Authority</strong> (
						{authorityPubkey.slice(0, 8)}...) is assigned to all administrative
						roles. Fill in specific addresses only if you need to delegate
						distinct permissions (e.g., to a multi-sig or a separate compliance
						entity).
					</p>
				</div>
			</div>
		</div>
	);

	// Step 5: Oracle
	const renderStep5 = () => (
		<div className="px-8 pb-24 max-w-4xl">
			<div className="bg-(--bg-surface) border border-(--border-mid) p-4 flex items-center gap-4 mb-8">
				<div
					onClick={() =>
						setFormData({
							...formData,
							oracle: { ...formData.oracle, enabled: !formData.oracle.enabled },
						})
					}
					className={`w-10 h-5 border relative cursor-pointer ${
						formData.oracle.enabled
							? "bg-[rgba(204,163,82,0.2)] border-(--accent-primary)"
							: "bg-(--bg-input) border-(--border-mid)"
					}`}
				>
					<div
						className={`absolute w-3.5 h-3.5 top-px transition-all ${
							formData.oracle.enabled
								? "left-[22px] bg-(--accent-primary)"
								: "left-px bg-(--text-dark)"
						}`}
					/>
				</div>
				<div className="font-mono text-[12px] text-(--text-dim)">
					ENABLE ORACLE PRICING DATA
				</div>
			</div>
			{formData.oracle.enabled && (
				<div className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div className="flex flex-col gap-2">
							<label className="font-mono text-[9px] text-(--text-dim) uppercase">
								Base Asset
							</label>
							<select className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2.5 py-2.5 font-mono text-[12px] outline-none">
								<option>EUR</option>
								<option>USD</option>
								<option>SOL</option>
							</select>
						</div>
						<div className="flex flex-col gap-2">
							<label className="font-mono text-[9px] text-(--text-dim) uppercase">
								Quote Asset
							</label>
							<select className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2.5 py-2.5 font-mono text-[12px] outline-none">
								<option>USD</option>
								<option>USDC</option>
								<option>USDT</option>
							</select>
						</div>
					</div>
				</div>
			)}
			<div className="mt-10 font-mono text-[10px] text-(--text-dark) p-4 border border-dashed border-(--border-mid) text-center">
				Oracle can be configured after deployment from the Oracle Management
				page. Skip if not needed.
			</div>
		</div>
	);

	// Step 6: Review
	const renderStep6 = () => (
		<div className="grid grid-cols-[1fr_400px] gap-8 px-8 pb-24">
			<div className="bg-(--bg-surface) border border-(--border-mid) flex flex-col">
				<div className="px-5 py-4 border-b border-(--border-mid) font-mono text-[12px] tracking-widest bg-white/2">
					CONFIGURATION SUMMARY
				</div>
				<div className="p-6 space-y-8">
					<div>
						<div className="text-[9px] text-(--text-dark) font-mono uppercase mb-3 border-b border-(--border-dim) pb-1">
							PRESET
						</div>
						<div className="bg-(--accent-primary) text-black text-[9px] font-mono px-1.5 py-0.5 font-bold inline-block">
							SSS-
							{selectedPreset === "sss1"
								? "1 MINIMAL"
								: selectedPreset === "sss2"
									? "2 COMPLIANT"
									: "3 PRIVATE"}
						</div>
					</div>
					<div>
						<div className="text-[9px] text-(--text-dark) font-mono uppercase mb-3 border-b border-(--border-dim) pb-1">
							BASIC INFO
						</div>
						<div className="space-y-2 text-[11px]">
							<div className="grid grid-cols-[140px_1fr] font-mono">
								<span className="text-(--text-dim)">Token Name</span>
								<span className="text-(--text-main)">
									{formData.tokenName || "—"}
								</span>
							</div>
							<div className="grid grid-cols-[140px_1fr] font-mono">
								<span className="text-(--text-dim)">Symbol</span>
								<span className="text-(--text-main)">
									{formData.tokenSymbol || "—"}
								</span>
							</div>
							<div className="grid grid-cols-[140px_1fr] font-mono">
								<span className="text-(--text-dim)">Decimals</span>
								<span className="text-(--text-main)">{formData.decimals}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="bg-(--bg-surface) border border-(--border-mid) flex flex-col">
				<div className="px-5 py-4 border-b border-(--border-mid) font-mono text-[12px] tracking-widest bg-white/2">
					COSTS & DEPLOYMENT
				</div>
				<div className="p-6">
					<div className="space-y-3 text-[11px] font-mono text-(--text-dim) mb-4">
						<div className="flex justify-between">
							<span>Mint Account Rent</span>
							<span>0.00148 SOL</span>
						</div>
						<div className="flex justify-between">
							<span>Metadata Rent</span>
							<span>0.00230 SOL</span>
						</div>
						<div className="flex justify-between">
							<span>Extension Accounts</span>
							<span>0.00410 SOL</span>
						</div>
						<div className="flex justify-between">
							<span>Transaction Fee</span>
							<span>0.000025 SOL</span>
						</div>
					</div>
					<div className="border-t border-(--border-mid) pt-4 flex justify-between items-baseline">
						<div className="font-mono text-[10px] text-(--text-main)">
							TOTAL ESTIMATED
						</div>
						<div className="text-xl text-(--accent-primary) font-mono">
							0.00791 SOL
						</div>
					</div>
					<div className="mt-6 p-4 bg-(--bg-input) border border-(--border-dim) flex justify-between items-center">
						<div className="font-mono text-[10px] text-(--text-dark)">
							WALLET BALANCE
						</div>
						<div className="font-mono text-sm text-green-400">2.45100 SOL</div>
					</div>
					<Button
						variant="primary"
						size="md"
						className="w-full mt-6 flex items-center justify-center gap-3"
						onClick={handleDeploy}
						disabled={isDeploying}
					>
						{isDeploying ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							"🚀 DEPLOY STABLECOIN"
						)}
					</Button>
				</div>
			</div>
		</div>
	);

	// Step 7: Success
	const renderStep7 = () => (
		<div className="flex flex-col items-center px-8 py-16">
			<div className="w-16 h-16 border-2 border-green-400 rounded-full flex items-center justify-center text-green-400 text-3xl mb-6 shadow-[0_0_30px_rgba(0,255,136,0.1)]">
				✓
			</div>
			<h1 className="font-mono text-3xl tracking-[0.3em] font-light mb-2">
				STABLECOIN DEPLOYED
			</h1>
			<p className="font-mono text-[11px] text-(--text-dim) tracking-widest mb-12">
				TRANSACTION CONFIRMED ON MAINNET-BETA
			</p>
			<div className="grid grid-cols-2 gap-6 w-full max-w-3xl mb-16">
				<div className="bg-(--bg-surface) border border-(--border-mid) p-5">
					<span className="font-mono text-[9px] text-(--text-dark) uppercase block mb-3">
						MINT ADDRESS
					</span>
					<span className="font-mono text-[12px] text-(--accent-primary) block mb-4 break-all">
						{deploymentResult?.mintAddress || "N/A"}
					</span>
					<div className="flex gap-4">
						<button
							onClick={() => {
								if (deploymentResult?.mintAddress) {
									navigator.clipboard.writeText(deploymentResult.mintAddress);
									toast.success("Copied to clipboard");
								}
							}}
							className="bg-transparent border border-(--border-mid) text-(--text-dim) font-mono text-[10px] px-2.5 py-1 cursor-pointer hover:border-(--border-bright)"
						>
							COPY
						</button>
						<a
							href={`https://explorer.solana.com/address/${deploymentResult?.mintAddress}?cluster=devnet`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-(--accent-primary) font-mono text-[10px] border-b border-transparent hover:border-(--accent-primary)"
						>
							VIEW ON EXPLORER
						</a>
					</div>
				</div>
				<div className="bg-(--bg-surface) border border-(--border-mid) p-5">
					<span className="font-mono text-[9px] text-(--text-dark) uppercase block mb-3">
						TX SIGNATURE
					</span>
					<span className="font-mono text-[12px] text-(--accent-primary) block mb-4 break-all">
						{deploymentResult?.signature || "N/A"}
					</span>
					<div className="flex gap-4">
						<button
							onClick={() => {
								if (deploymentResult?.signature) {
									navigator.clipboard.writeText(deploymentResult.signature);
									toast.success("Copied to clipboard");
								}
							}}
							className="bg-transparent border border-(--border-mid) text-(--text-dim) font-mono text-[10px] px-2.5 py-1 cursor-pointer hover:border-(--border-bright)"
						>
							COPY
						</button>
						<a
							href={`https://explorer.solana.com/tx/${deploymentResult?.signature}?cluster=devnet`}
							target="_blank"
							rel="noopener noreferrer"
							className="text-(--accent-primary) font-mono text-[10px] border-b border-transparent hover:border-(--accent-primary)"
						>
							VIEW ON EXPLORER
						</a>
					</div>
				</div>
			</div>
			<div className="w-full max-w-4xl">
				<span className="font-mono text-[10px] text-(--text-dark) uppercase tracking-[0.2em] block text-center mb-6">
					QUICK ACTIONS
				</span>
				<div className="grid grid-cols-3 gap-4">
					<div className="bg-(--bg-panel) border border-(--border-dim) p-6 flex flex-col">
						<div className="font-mono text-[12px] text-(--text-main) mb-3">
							ADD MINTER
						</div>
						<div className="text-[11px] text-(--text-dim) leading-relaxed mb-4 flex-1">
							Assign a minter authority to begin minting
						</div>
						<button className="px-2 py-2 font-mono text-[10px] bg-(--accent-primary) text-black font-semibold">
							ADD MINTER
						</button>
					</div>
					<div className="bg-(--bg-panel) border border-(--border-dim) p-6 flex flex-col">
						<div className="font-mono text-[12px] text-(--text-main) mb-3">
							MINT TOKENS
						</div>
						<div className="text-[11px] text-(--text-dim) leading-relaxed mb-4 flex-1">
							Issue the first batch of tokens to an account
						</div>
						<button className="px-2 py-2 font-mono text-[10px] border border-(--accent-primary) bg-transparent text-(--accent-primary)">
							MINT TOKENS
						</button>
					</div>
					<div className="bg-(--bg-panel) border border-(--border-dim) p-6 flex flex-col">
						<div className="font-mono text-[12px] text-(--text-main) mb-3">
							GO TO DASHBOARD
						</div>
						<div className="text-[11px] text-(--text-dim) leading-relaxed mb-4 flex-1">
							View your new token overview and stats
						</div>
						<button className="px-2 py-2 font-mono text-[10px] border border-(--border-mid) bg-transparent text-(--text-dim)">
							GO TO DASHBOARD
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="flex flex-col h-full -m-6">
			{currentStep < 7 && (
				<header className="px-8 pt-6 pb-0">
					<div className="font-mono text-[10px] text-[#777777] mb-2">
						OPERATIONS <span className="text-[#444444]">/</span> NEW STABLECOIN
					</div>
					<h1 className="text-2xl font-light tracking-[0.2em] text-[#EAEAEA] mb-6 flex items-center gap-4">
						CREATE STABLECOIN{" "}
						<span className="text-[11px] text-[#444444] tracking-normal">
							STEP {currentStep} OF 6
						</span>
					</h1>
					<Stepper steps={steps} />
				</header>
			)}

			{currentStep === 1 && renderStep1()}
			{currentStep === 2 && renderStep2()}
			{currentStep === 3 && renderStep3()}
			{currentStep === 4 && renderStep4()}
			{currentStep === 5 && renderStep5()}
			{currentStep === 6 && renderStep6()}
			{currentStep === 7 && renderStep7()}

			{currentStep < 7 && (
				<div className="fixed bottom-8 right-0 left-[300px] px-8 py-6 bg-linear-to-t from-[#080808] via-[#080808]/60 to-transparent border-t border-[#222222] flex justify-end gap-4 z-10">
					{currentStep > 1 && (
						<Button variant="secondary" size="md" onClick={prevStep}>
							← PREVIOUS
						</Button>
					)}
					{currentStep === 5 && (
						<Button variant="ghost" size="md" onClick={nextStep}>
							SKIP
						</Button>
					)}
					<Button
						variant="primary"
						size="md"
						className="flex items-center gap-3"
						onClick={currentStep === 6 ? handleDeploy : nextStep}
						disabled={isDeploying}
					>
						{isDeploying ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<>
								{currentStep === 6 ? "DEPLOY STABLECOIN" : "NEXT STEP"}{" "}
								<span>→</span>
							</>
						)}
					</Button>
				</div>
			)}
		</div>
	);
};

export default Create;
