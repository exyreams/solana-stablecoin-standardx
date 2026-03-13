import type { FC } from "react";
import { Badge } from "../ui/Badge";

interface Activity {
	timestamp: string;
	action: string;
	amount: string;
	target: string;
	status: string;
	actionColor?: string;
}

interface ActivityTableProps {
	activities: Activity[];
}

export const ActivityTable: FC<ActivityTableProps> = ({ activities }) => {
	return (
		<div className="bg-[rgba(15,15,15,0.8)] border border-(--border-mid) relative">
			<div className="border-b border-(--border-dim) px-4 py-2 flex justify-between items-center bg-linear-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Recent Activity Feed
				</span>
			</div>
			<table className="w-full border-collapse font-mono text-[11px]">
				<thead>
					<tr>
						<th className="text-left px-3 py-3 text-(--text-dim) border-b border-(--border-mid) font-normal uppercase text-[10px]">
							Timestamp
						</th>
						<th className="text-left px-3 py-3 text-(--text-dim) border-b border-(--border-mid) font-normal uppercase text-[10px]">
							Action Type
						</th>
						<th className="text-left px-3 py-3 text-(--text-dim) border-b border-(--border-mid) font-normal uppercase text-[10px]">
							Amount
						</th>
						<th className="text-left px-3 py-3 text-(--text-dim) border-b border-(--border-mid) font-normal uppercase text-[10px]">
							Target/Actor
						</th>
						<th className="text-left px-3 py-3 text-(--text-dim) border-b border-(--border-mid) font-normal uppercase text-[10px]">
							Status
						</th>
					</tr>
				</thead>
				<tbody>
					{activities.length === 0 ? (
						<tr>
							<td
								colSpan={5}
								className="px-3 py-8 text-center text-(--text-dim)"
							>
								NO RECENT ACTIVITY RECORDED
							</td>
						</tr>
					) : (
						activities.map((activity, index) => (
							<tr key={index}>
								<td className="px-3 py-3 border-b border-(--border-dim) text-(--text-dim)">
									{activity.timestamp}
								</td>
								<td
									className={`px-3 py-3 border-b border-(--border-dim) ${activity.actionColor || ""}`}
								>
									{activity.action}
								</td>
								<td className="px-3 py-3 border-b border-(--border-dim)">
									{activity.amount}
								</td>
								<td className="px-3 py-3 border-b border-(--border-dim) text-(--text-dim)">
									{activity.target.length > 20
										? `${activity.target.slice(0, 10)}...${activity.target.slice(-8)}`
										: activity.target}
								</td>
								<td className="px-3 py-3 border-b border-(--border-dim)">
									<Badge
										variant={
											activity.status === "FINALIZED" ||
											activity.status === "CONFIRMED"
												? "accent"
												: "default"
										}
									>
										{activity.status}
									</Badge>
								</td>
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
};
