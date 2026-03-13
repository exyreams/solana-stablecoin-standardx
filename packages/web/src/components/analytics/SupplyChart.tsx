import type { FC } from "react";
import {
	Area,
	AreaChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface AnalyticsSupplyChartProps {
	data: {
		date: string;
		supply: number;
	}[];
}

export const AnalyticsSupplyChart: FC<AnalyticsSupplyChartProps> = ({
	data,
}) => {
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
		<div className="w-full h-full relative min-h-0">
			<ResponsiveContainer width="100%" height="100%" minHeight={300}>
				<AreaChart
					data={data}
					margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
				>
					<defs>
						<linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
							<stop offset="5%" stopColor="#CCA352" stopOpacity={0.3} />
							<stop offset="95%" stopColor="#CCA352" stopOpacity={0} />
						</linearGradient>
					</defs>
					<XAxis
						dataKey="date"
						axisLine={false}
						tickLine={false}
						tick={{ fill: "#666", fontSize: 10, fontFamily: "monospace" }}
						tickFormatter={formatDate}
						minTickGap={30}
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
						formatter={(value: any) => [
							Number(value).toLocaleString(undefined, {
								minimumFractionDigits: 2,
							}),
							"Supply",
						]}
					/>
					<Area
						type="monotone"
						dataKey="supply"
						stroke="#CCA352"
						strokeWidth={2}
						fillOpacity={1}
						fill="url(#colorSupply)"
						animationDuration={1500}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
};
