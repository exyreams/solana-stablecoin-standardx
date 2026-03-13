import type { FC } from "react";
import {
	Bar,
	BarChart,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface TransactionBreakdownProps {
	data: {
		name: string;
		value: number;
	}[];
}

const COLORS = ["#CCA352", "#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

export const TransactionBreakdown: FC<TransactionBreakdownProps> = ({
	data,
}) => {
	const total = data.reduce((acc, curr) => acc + curr.value, 0);

	return (
		<div className="w-full h-full flex flex-col">
			{data.length === 0 ? (
				<div className="flex-1 flex items-center justify-center">
					<div className="text-sm font-mono text-(--text-dim)">
						NO ACTIVITY RECORDED
					</div>
				</div>
			) : (
				<div className="flex-1 w-full relative min-h-0">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							layout="vertical"
							data={data}
							margin={{ left: -20, right: 20 }}
						>
							<XAxis type="number" hide />
							<YAxis
								dataKey="name"
								type="category"
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#777", fontSize: 10, fontFamily: "monospace" }}
								width={100}
							/>
							<Tooltip
								cursor={{ fill: "transparent" }}
								contentStyle={{
									backgroundColor: "#111",
									border: "1px solid #333",
									fontSize: "12px",
									fontFamily: "monospace",
									color: "#EAEAEA",
								}}
							/>
							<Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
								{data.map((_, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[index % COLORS.length]}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			)}

			{total > 0 && (
				<div className="mt-4 pt-4 border-t border-(--border-dim) text-[10px] text-(--text-dim) font-mono">
					TOTAL EVENTS RECORDED: {total}
				</div>
			)}
		</div>
	);
};
