import type { FC } from "react";
import { FeatureMatrix } from "./FeatureMatrix";

const standards = [
	{
		title: "SSS-1 MINIMAL",
		description: "Basic mint/burn with minimal overhead for utility tokens.",
		features: ["Mint & Burn Auth", "Supply Caps", "Permanent Delegate"],
		variant: "default" as const,
	},
	{
		title: "SSS-2 COMPLIANT",
		description:
			"Full regulatory controls for institutional issuers and fiat-backed assets.",
		features: [
			"Blacklisting / Freezing",
			"Asset Seizure Engine",
			"Token-2022 Transfer Hooks",
		],
		variant: "recommended" as const,
	},
	{
		title: "SSS-3 PRIVATE",
		description:
			"Zero-knowledge confidential transfers for enterprise privacy needs.",
		features: ["ElGamal Encryption", "Private Balances", "Auditable Privacy"],
		variant: "private" as const,
	},
];

export const StandardsSection: FC = () => {
	return (
		<section className="py-[100px] px-20 max-w-[1200px] mx-auto">
			<div className="border-l-2 border-[#CCA352] pl-4 mb-12">
				<div className="font-mono text-[11px] text-[#CCA352] uppercase font-bold">
					CHOOSE YOUR STANDARD
				</div>
				<h2 className="font-mono text-2xl mt-2">COMPLIANCE PRESETS</h2>
			</div>

			{/* Standard Cards */}
			<div className="grid grid-cols-3 gap-6">
				{standards.map((standard) => (
					<div
						key={standard.title}
						className={`bg-[#0f0f0f] border p-6 relative ${
							standard.variant === "recommended"
								? "border-[#CCA352] shadow-[inset_0_0_10px_rgba(204,163,82,0.2)]"
								: standard.variant === "private"
									? "border-[#3b82f6]"
									: "border-[#222222]"
						}`}
					>
						{standard.variant === "recommended" && (
							<div className="absolute -top-2.5 right-2.5 bg-[#CCA352] text-black px-2 py-0.5 font-extrabold text-[10px] font-mono">
								RECOMMENDED
							</div>
						)}
						<h3
							className={`font-mono text-[24px] m-0 mb-1 font-bold ${
								standard.variant === "recommended"
									? "text-[#CCA352]"
									: standard.variant === "private"
										? "text-[#3b82f6]"
										: "text-[#EAEAEA]"
							}`}
						>
							{standard.title}
						</h3>
						<p className="text-[10px] text-[#777777] leading-relaxed m-0 mb-6">
							{standard.description}
						</p>
						<ul className="list-none p-0 m-0">
							{standard.features.map((feature, index) => (
								<li
									key={index}
									className="mb-2 text-[#EAEAEA] flex items-center gap-2 text-[13px]"
								>
									<span
										className={
											standard.variant === "private"
												? "text-[#3b82f6]"
												: "text-[#CCA352]"
										}
									>
										✓
									</span>{" "}
									{feature}
								</li>
							))}
						</ul>
					</div>
				))}
			</div>

			{/* Feature Matrix */}
			<FeatureMatrix />
		</section>
	);
};
