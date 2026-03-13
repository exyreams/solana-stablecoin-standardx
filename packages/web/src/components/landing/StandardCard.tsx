import type { FC } from "react";

interface StandardCardProps {
	title: string;
	description: string;
	features: string[];
	variant?: "default" | "recommended" | "private";
}

export const StandardCard: FC<StandardCardProps> = ({
	title,
	description,
	features,
	variant = "default",
}) => {
	const borderColor = {
		default: "border-(border-dim)",
		recommended: "border-(accent-primary)",
		private: "border-[#3b82f6]",
	}[variant];

	const titleColor = {
		default: "",
		recommended: "text-(accent-primary)",
		private: "text-[#3b82f6]",
	}[variant];

	const checkColor = {
		default: "text-(accent-primary)",
		recommended: "text-(accent-primary)",
		private: "text-[#3b82f6]",
	}[variant];

	const boxShadow =
		variant === "recommended"
			? { boxShadow: "inset 0 0 10px var(--accent-glow)" }
			: {};

	return (
		<div
			className={`bg-(bg-panel) border ${borderColor} p-6 relative`}
			style={boxShadow}
		>
			{variant === "recommended" && (
				<div className="absolute -top-2.5 right-2.5 bg-(accent-primary) text-black px-2 py-0.5 font-extrabold text-[10px] mono">
					RECOMMENDED
				</div>
			)}
			<h3 className={`font-mono text-2xl m-0 mb-2 ${titleColor}`}>{title}</h3>
			<p className="text-(text-dim) text-[13px] mb-4 h-10 leading-tight">
				{description}
			</p>
			<ul className="list-none p-0 m-0">
				{features.map((feature, index) => (
					<li
						key={index}
						className="mb-2 text-(text-main) flex items-center gap-2 text-[13px]"
					>
						<span className={checkColor}>✓</span> {feature}
					</li>
				))}
			</ul>
		</div>
	);
};
