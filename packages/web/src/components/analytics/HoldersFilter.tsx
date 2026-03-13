import type { FC } from "react";

interface HoldersFilterProps {
	onFilterChange: (filters: any) => void;
}

export const HoldersFilter: FC<HoldersFilterProps> = () => {
	return (
		<div className="bg-(--bg-surface) border border-(--border-mid) p-6 mb-6">
			<div className="flex justify-between items-center">
				<div className="flex gap-12 items-center">
					<div className="flex flex-col gap-1.5">
						<label className="text-[9px] text-(--text-dark) uppercase font-mono tracking-widest">
							Min Balance (USDC)
						</label>
						<div className="flex items-center gap-3">
							<input
								type="range"
								className="w-32 h-[2px] bg-(--border-mid) appearance-none cursor-pointer accent-(--accent-primary)"
							/>
							<span className="text-[10px] font-mono text-(--text-main)">
								0
							</span>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-[9px] text-(--text-dark) uppercase font-mono tracking-widest">
							Account Status
						</label>
						<div className="flex gap-4">
							<div className="flex items-center gap-1.5 cursor-pointer">
								<div className="w-2.5 h-2.5 border border-(--status-green) bg-(--status-green)" />
								<span className="text-[10px] font-mono text-(--status-green)">
									NORMAL
								</span>
							</div>
							<div className="flex items-center gap-1.5 cursor-pointer">
								<div className="w-2.5 h-2.5 border border-(--status-amber) bg-(--status-amber)" />
								<span className="text-[10px] font-mono text-(--status-amber)">
									FROZEN
								</span>
							</div>
							<div className="flex items-center gap-1.5 cursor-pointer">
								<div className="w-2.5 h-2.5 border border-(--status-red) bg-(--status-red)" />
								<span className="text-[10px] font-mono text-(--status-red)">
									BLACKLISTED
								</span>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-[9px] text-(--text-dark) uppercase font-mono tracking-widest">
							Sort By
						</label>
						<select className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) font-mono text-[10px] px-2 py-1 outline-none">
							<option>BALANCE DESC</option>
							<option>LAST ACTIVITY</option>
						</select>
					</div>
				</div>

				<div className="flex gap-2">
					<button className="px-3 py-1 border border-(--accent-primary) text-[9px] font-mono text-(--accent-primary) tracking-widest uppercase hover:bg-(--accent-primary)/10 transition-colors">
						Export CSV
					</button>
					<button className="px-3 py-1 border border-(--border-mid) text-[9px] font-mono text-(--text-dim) tracking-widest uppercase hover:border-(--border-bright) transition-colors">
						Export JSON
					</button>
				</div>
			</div>
		</div>
	);
};
