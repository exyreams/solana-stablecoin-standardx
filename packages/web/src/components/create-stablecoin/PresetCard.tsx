import type { FC } from "react";

interface Feature {
	label: string;
	enabled: boolean;
	color?: string;
}

interface PresetCardProps {
	name: string;
	description: string;
	useCase: string;
	features: Feature[];
	selected?: boolean;
	recommended?: boolean;
	dashed?: boolean;
	onSelect?: () => void;
}

export const PresetCard: FC<PresetCardProps> = ({
	name,
	description,
	useCase,
	features,
	selected = false,
	recommended = false,
	dashed = false,
	onSelect,
}) => {
	return (
		<div
			onClick={onSelect}
			className={`bg-(--bg-surface) border p-6 relative transition-all cursor-pointer flex flex-col ${
				dashed
					? "border-dashed border-(--border-mid) opacity-80"
					: selected
						? "border-(--accent-primary) bg-[rgba(204,163,82,0.12)] outline outline-1 outline-(--accent-primary)"
						: "border-(--border-mid) hover:border-(--border-bright)"
			}`}
		>
			{recommended && (
				<div className="absolute top-0 right-6 -translate-y-1/2 bg-(--accent-primary) text-black text-[9px] font-mono px-2 py-0.5 font-bold">
					RECOMMENDED
				</div>
			)}

			<div className="flex justify-between items-start mb-4">
				<div className="font-mono text-sm tracking-wider text-(--text-main)">
					{name}
				</div>
			</div>

			<div className="text-xs text-(--text-dim) leading-relaxed mb-5 h-9">
				{description}
			</div>

			<div className="mb-5">
				<div className="text-[9px] text-(--text-dark) uppercase font-mono mb-2">
					Ideal for:
				</div>
				<div className="text-[11px] text-(--text-main) font-mono">
					{useCase}
				</div>
			</div>

			<div className="grid grid-cols-3 gap-2 mb-6">
				{features.map((feature, idx) => (
					<div
						key={idx}
						className={`font-mono text-[9px] px-2 py-1 border flex justify-between items-center ${
							feature.enabled
								? feature.color
									? `${feature.color} border-current/20`
									: "text-green-400 border-green-400/20"
								: "text-(--text-dark) border-(--border-dim)"
						} bg-(--bg-input)`}
					>
						{feature.label}
					</div>
				))}
			</div>

			<div className="mt-auto">
				<button
					className={`w-full px-2.5 py-2.5 font-mono text-[11px] border cursor-pointer ${
						selected
							? "bg-(--accent-primary) border-(--accent-primary) text-black font-bold"
							: "bg-transparent border-(--border-mid) text-(--text-main)"
					}`}
				>
					{selected ? "SELECTED" : dashed ? "CONFIGURE" : "SELECT"}
				</button>
			</div>
		</div>
	);
};
