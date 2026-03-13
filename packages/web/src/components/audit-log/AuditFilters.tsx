import type { FC } from "react";

interface AuditFiltersProps {
	onFilterChange: (filters: any) => void;
	filters: any;
}

export const AuditFilters: FC<AuditFiltersProps> = ({
	onFilterChange,
	filters,
}) => {
	const actionTypes = [
		{ label: "MINT", color: "text-green-400" },
		{ label: "BURN", color: "text-red-400" },
		{ label: "FREEZE", color: "text-yellow-400" },
		{ label: "BLACKLIST", color: "text-red-400" },
		{ label: "SEIZE", color: "text-red-400" },
		{ label: "THAW", color: "text-(--text-dim)" },
		{ label: "UPDATE_ROLES", color: "text-(--text-dim)" },
		{ label: "ORACLE", color: "text-(--text-dim)" },
	];

	return (
		<div className="bg-(--bg-surface) border border-(--border-mid) p-4">
			<div className="flex items-center gap-6">
				{/* Date Range */}
				<div className="flex flex-col gap-1.5 flex-[1.5]">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase font-bold">
						Date Range
					</label>
					<div className="flex items-center gap-1">
						<input
							type="text"
							placeholder="YYYY.MM.DD"
							value={filters.startDate}
							onChange={(e) => onFilterChange({ startDate: e.target.value })}
							className="w-full bg-(--bg-input) border border-(--border-dim) text-(--text-main) font-mono text-[11px] px-2.5 py-1.5 outline-none focus:border-(--accent-primary)"
						/>
						<span className="text-(--text-dark)">→</span>
						<input
							type="text"
							placeholder="YYYY.MM.DD"
							value={filters.endDate}
							onChange={(e) => onFilterChange({ endDate: e.target.value })}
							className="w-full bg-(--bg-input) border border-(--border-dim) text-(--text-main) font-mono text-[11px] px-2.5 py-1.5 outline-none focus:border-(--accent-primary)"
						/>
						<span className="px-1 cursor-pointer opacity-60 hover:opacity-100">
							📅
						</span>
					</div>
				</div>

				{/* Action Type */}
				<div className="flex flex-col gap-1.5 flex-[3]">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase font-bold">
						Action Type
					</label>
					<div className="flex gap-1.5 flex-wrap">
						{actionTypes.map((action) => (
							<button
								key={action.label}
								onClick={() =>
									onFilterChange({
										action: filters.action === action.label ? "" : action.label,
									})
								}
								className={`px-2.5 py-1 text-[10px] font-mono border border-(--border-dim) cursor-pointer bg-(--bg-input) transition-colors ${
									filters.action === action.label
										? action.color
										: "text-(--text-dim)"
								}`}
							>
								{action.label}
							</button>
						))}
					</div>
				</div>

				{/* Initiator */}
				<div className="flex flex-col gap-1.5 flex-[1.5]">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase font-bold">
						Initiator
					</label>
					<div className="relative">
						<input
							type="text"
							placeholder="Address..."
							value={filters.address}
							onChange={(e) => onFilterChange({ address: e.target.value })}
							className="w-full bg-(--bg-input) border border-(--border-mid) text-(--text-main) font-mono text-[11px] px-2.5 py-1.5 pr-8 outline-none focus:border-(--accent-primary)"
						/>
						<span className="absolute right-2 top-1.5 opacity-50">🔍</span>
					</div>
				</div>

				{/* Status */}
				<div className="flex flex-col gap-1.5">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase font-bold">
						Status
					</label>
					<div className="flex bg-(--bg-input) border border-(--border-dim)">
						<button
							onClick={() => onFilterChange({ status: "" })}
							className={`px-3 py-1.5 text-[10px] font-mono border-r border-(--border-dim) ${!filters.status ? "text-(--accent-primary)" : "text-(--text-dark)"}`}
						>
							ALL
						</button>
						<button
							onClick={() => onFilterChange({ status: "success" })}
							className={`px-3 py-1.5 text-[10px] font-mono border-r border-(--border-dim) ${filters.status === "success" ? "text-green-400" : "text-(--text-dark)"}`}
						>
							SUCCESS
						</button>
						<button
							onClick={() => onFilterChange({ status: "failed" })}
							className={`px-3 py-1.5 text-[10px] font-mono ${filters.status === "failed" ? "text-red-400" : "text-(--text-dark)"}`}
						>
							FAILED
						</button>
					</div>
				</div>

				{/* Live Updates */}
				<div className="flex flex-col gap-1.5 ml-auto">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase font-bold">
						Live Updates
					</label>
					<div className="flex items-center gap-2 bg-(--bg-input) border border-(--border-mid) px-2.5 py-1">
						<div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
						<span className="font-mono text-[10px] text-green-400">ACTIVE</span>
					</div>
				</div>
			</div>
		</div>
	);
};
