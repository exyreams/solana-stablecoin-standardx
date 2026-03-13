import { type FC, useState } from "react";

interface TokenIconProps {
	symbol: string;
	logoUri?: string | null;
	size?: "sm" | "md" | "lg";
	className?: string;
}

export const TokenIcon: FC<TokenIconProps> = ({
	symbol,
	logoUri,
	size = "md",
	className = "",
}) => {
	const [imageError, setImageError] = useState(false);

	const sizeMap = {
		sm: "w-6 h-6 text-[10px]",
		md: "w-10 h-10 text-sm",
		lg: "w-16 h-16 text-xl",
	};

	// Generate a consistent background color based on symbol
	const getColor = (str: string) => {
		const colors = [
			"bg-[#CCA352]",
			"bg-[#2E7D32]",
			"bg-[#1565C0]",
			"bg-[#C62828]",
			"bg-[#6A1B9A]",
			"bg-[#00838F]",
		];
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = str.charCodeAt(i) + ((hash << 5) - hash);
		}
		return colors[Math.abs(hash) % colors.length];
	};

	if (logoUri && !imageError) {
		return (
			<div
				className={`${sizeMap[size]} rounded-full overflow-hidden border border-[#ffffff22] shadow-sm bg-[#111111] flex items-center justify-center ${className}`}
			>
				<img
					src={logoUri}
					alt={symbol}
					className="w-full h-full object-cover"
					onError={() => setImageError(true)}
				/>
			</div>
		);
	}

	return (
		<div
			className={`${sizeMap[size]} ${getColor(symbol)} rounded-full flex items-center justify-center font-bold text-[#0a0a0a] border border-[#ffffff22] shadow-sm select-none ${className}`}
		>
			{symbol.slice(0, 1).toUpperCase()}
		</div>
	);
};
