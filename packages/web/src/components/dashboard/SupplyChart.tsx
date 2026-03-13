import type { FC } from "react";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const filters = ["7D", "30D", "90D", "ALL"];

interface SupplyChartProps {
	data: {
		date: string;
		supply: number;
	}[];
}

export const SupplyChart: FC<SupplyChartProps> = ({ data }) => {
	const formatYAxis = (value: number) => {
		if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
		if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
		return value.toString();
	};

	const formatDate = (dateStr: string) => {
		const d = new Date(dateStr);
		return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
	};

	return (
		<div className="bg-[rgba(15,15,15,0.8)] border border-(--border-mid) relative">
			<div className="border-b border-(--border-dim) px-4 py-2 flex justify-between items-center bg-linear-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Supply Trajectory
				</span>
				<div className="flex gap-1">
					{filters.map((filter) => (
						<button
							key={filter}
							className={`bg-(--bg-input) border border-(--border-mid) text-(--text-dim) px-2.5 py-1 text-[10px] font-mono cursor-pointer ${
								filter === "7D"
									? "text-(--accent-primary) border-(--accent-primary)"
									: "hover:border-(--border-bright)"
							}`}
						>
							{filter}
						</button>
					))}
				</div>
			</div>
			<div className="p-4">
				<div className="h-[200px] w-full relative min-h-0">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={data}
							margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
						>
							<defs>
								<linearGradient id="gradSupply" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#CCA352" stopOpacity={0.15} />
									<stop offset="95%" stopColor="#CCA352" stopOpacity={0} />
								</linearGradient>
							</defs>
							<XAxis
								dataKey="date"
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }}
								tickFormatter={formatDate}
							/>
							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }}
								tickFormatter={formatYAxis}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "#111",
									border: "1px solid #333",
									fontSize: "12px",
									fontFamily: "monospace",
									color: "#EAEAEA",
								}}
								itemStyle={{ color: "#CCA352" }}
								labelFormatter={(label: any) => formatDate(label)}
							/>
							<Area
								type="monotone"
								dataKey="supply"
								stroke="#CCA352"
								strokeWidth={2}
								fillOpacity={1}
								fill="url(#gradSupply)"
								animationDuration={1000}
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
};
