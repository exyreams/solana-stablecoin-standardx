import type { FC } from "react";

const features = [
	{ name: "Basic Mint/Burn", sss1: true, sss2: true, sss3: true },
	{ name: "Freeze/Thaw", sss1: false, sss2: true, sss3: true },
	{ name: "Blacklisting", sss1: false, sss2: true, sss3: true },
	{ name: "Asset Seizure", sss1: false, sss2: true, sss3: true },
	{ name: "Oracle Integration", sss1: true, sss2: true, sss3: true },
	{ name: "Confidential Transfers", sss1: false, sss2: false, sss3: true },
	{ name: "Transfer Hook", sss1: false, sss2: true, sss3: true },
	{ name: "Permanent Delegate", sss1: true, sss2: true, sss3: true },
];

export const FeatureMatrix: FC = () => {
	return (
		<div className="mt-12 border border-[#222222] bg-[#0f0f0f]">
			<table className="w-full border-collapse font-mono">
				<thead>
					<tr className="border-b border-[#222222]">
						<th className="p-4 text-left text-[#777777] text-[12px]">
							FEATURE MATRIX
						</th>
						<th className="p-4 text-left text-[#777777] text-[12px]">SSS-1</th>
						<th className="p-4 text-left text-[#777777] text-[12px]">SSS-2</th>
						<th className="p-4 text-left text-[#777777] text-[12px]">SSS-3</th>
					</tr>
				</thead>
				<tbody>
					{features.map((feature) => (
						<tr
							key={feature.name}
							className="border-b border-[#222222] hover:bg-[#161616]"
						>
							<td className="p-3 text-[#EAEAEA] text-[12px]">{feature.name}</td>
							<td
								className={`p-3 text-[12px] ${
									feature.sss1 ? "text-[#22c55e]" : "text-[#444444]"
								}`}
							>
								{feature.sss1 ? "✓" : "✕"}
							</td>
							<td
								className={`p-3 text-[12px] ${
									feature.sss2 ? "text-[#22c55e]" : "text-[#444444]"
								}`}
							>
								{feature.sss2 ? "✓" : "✕"}
							</td>
							<td
								className={`p-3 text-[12px] ${
									feature.sss3 ? "text-[#22c55e]" : "text-[#444444]"
								}`}
							>
								{feature.sss3 ? "✓" : "✕"}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
