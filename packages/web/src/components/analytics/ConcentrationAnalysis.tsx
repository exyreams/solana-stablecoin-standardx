import type { FC } from "react";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";

interface ConcentrationAnalysisProps {
	data: {
		address: string;
		percentage: string;
		balance: string;
	}[];
}

const COLORS = ["#CCA352", "#9c7d3f", "#6e582d", "#45371c", "#222222"];

const CustomizedContent = (props: any) => {
	const { x, y, width, height, index, name, percentage } = props;

	return (
		<g>
			<rect
				x={x}
				y={y}
				width={width}
				height={height}
				style={{
					fill: COLORS[index % COLORS.length],
					stroke: "#080808",
					strokeWidth: 2,
				}}
			/>
			{width > 50 && height > 30 && (
				<>
					<text
						x={x + 8}
						y={y + 20}
						fill={index === 0 ? "#000" : "#fff"}
						fontSize={9}
						fontFamily="var(--font-mono)"
					>
						{name}
					</text>
					<text
						x={x + 8}
						y={y + 36}
						fill={index === 0 ? "#000" : index === 4 ? "#777" : "#fff"}
						fontSize={index === 0 ? 14 : 11}
						fontWeight={index === 0 ? "bold" : "normal"}
						fontFamily="var(--font-mono)"
					>
						{percentage}%
					</text>
				</>
			)}
		</g>
	);
};

export const ConcentrationAnalysis: FC<ConcentrationAnalysisProps> = ({
	data,
}) => {
	const treemapData = data.slice(0, 4).map((h) => ({
		name: `${h.address.slice(0, 4)}...${h.address.slice(-4)}`,
		percentage: h.percentage,
		size: Number(h.percentage),
	}));

	const othersValue =
		100 - treemapData.reduce((acc, curr) => acc + curr.size, 0);
	if (othersValue > 0) {
		treemapData.push({
			name: "Others",
			percentage: othersValue.toFixed(1),
			size: othersValue,
		});
	}

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid) h-full flex flex-col">
			<div className="border-b border-(--border-dim) px-6 py-3 bg-linear-to-r from-(--bg-surface) to-transparent">
				<div className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Concentration Analysis
				</div>
			</div>

			<div className="p-6 flex-1 flex flex-col">
				<div className="h-[280px] mb-6">
					<ResponsiveContainer width="100%" height="100%">
						<Treemap
							data={treemapData}
							dataKey="size"
							aspectRatio={4 / 3}
							stroke="#080808"
							content={<CustomizedContent />}
						>
							<Tooltip
								contentStyle={{
									backgroundColor: "#111",
									border: "1px solid #333",
									fontSize: "12px",
									fontFamily: "monospace",
								}}
							/>
						</Treemap>
					</ResponsiveContainer>
				</div>

				<div className="flex flex-col gap-2">
					{treemapData.slice(0, 3).map((item, index) => (
						<div
							key={item.name}
							className="flex justify-between items-center text-[10px] font-mono border-b border-(--border-dim) pb-2"
						>
							<span className="text-(--text-dim)">
								{index + 1}. {item.name}
							</span>
							<span className="text-(--text-main)">{item.percentage}%</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
