import type { FC } from "react";

interface StatItem {
	label: string;
	value: string;
}

const stats: StatItem[] = [
	{ label: "STABLECOINS DEPLOYED", value: "1,247" },
	{ label: "TOTAL SUPPLY", value: "$2.4B USD" },
	{ label: "ACTIVE MINTERS", value: "89" },
	{ label: "NETWORKS", value: "MAINNET + DEVNET" },
];

export const StatsTicker: FC = () => {
	return (
		<div
			className="w-full overflow-hidden bg-[#0f0f0f] py-3 relative"
			style={{
				borderTop: "1px solid #222222",
				borderBottom: "1px solid #222222",
			}}
		>
			{/* Left blur gradient */}
			<div
				className="absolute left-0 top-0 bottom-0 w-96 z-10 pointer-events-none"
				style={{
					background:
						"linear-gradient(to right, rgba(15, 15, 15, 1) 0%, rgba(15, 15, 15, 0.95) 30%, rgba(15, 15, 15, 0) 100%)",
				}}
			/>

			{/* Right blur gradient */}
			<div
				className="absolute right-0 top-0 bottom-0 w-96 z-10 pointer-events-none"
				style={{
					background:
						"linear-gradient(to left, rgba(15, 15, 15, 1) 0%, rgba(15, 15, 15, 0.95) 30%, rgba(15, 15, 15, 0) 100%)",
				}}
			/>

			<div className="flex whitespace-nowrap">
				{/* First set */}
				{stats.map((stat, index) => (
					<div
						key={`stat-1-${index}`}
						className="flex items-center px-10 text-[#777777] font-mono text-[11px]"
					>
						{stat.label}:{" "}
						<span className="text-[#EAEAEA] ml-2">{stat.value}</span>
						{index < stats.length - 1 && (
							<span className="ml-10 text-[#333333]">|</span>
						)}
					</div>
				))}
				{/* Duplicate for seamless loop */}
				{stats.map((stat, index) => (
					<div
						key={`stat-2-${index}`}
						className="flex items-center px-10 text-[#777777] font-mono text-[11px]"
					>
						{stat.label}:{" "}
						<span className="text-[#EAEAEA] ml-2">{stat.value}</span>
						{index < stats.length - 1 && (
							<span className="ml-10 text-[#333333]">|</span>
						)}
					</div>
				))}
			</div>
		</div>
	);
};
