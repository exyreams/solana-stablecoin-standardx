import type { FC } from "react";
import { Button } from "../ui/Button";

export const DisplaySettings: FC = () => {
	return (
		<div className="bg-(--bg-surface) border border-(--border-mid) p-4">
			<div className="text-[10px] uppercase text-(--text-dim) font-mono mb-4">
				DISPLAY PREFERENCES
			</div>
			<div className="grid grid-cols-2 gap-4">
				<div className="flex flex-col gap-2">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase">
						Theme
					</label>
					<div className="flex bg-(--bg-input) border border-(--border-mid) w-full">
						<button className="flex-1 px-4 py-2 text-[10px] font-mono text-(--accent-active) bg-[rgba(204,163,82,0.12)] shadow-[inset_0_-2px_0_var(--accent-primary)]">
							DARK
						</button>
						<button className="flex-1 px-4 py-2 text-[10px] font-mono text-(--text-dim)">
							LIGHT
						</button>
						<button className="flex-1 px-4 py-2 text-[10px] font-mono text-(--text-dim)">
							AUTO
						</button>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase">
						Language
					</label>
					<select className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2.5 py-2 font-mono text-[11px] outline-none focus:border-(--accent-primary)">
						<option>ENGLISH</option>
						<option>PORTUGUESE</option>
						<option>SPANISH</option>
					</select>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase">
						Timezone
					</label>
					<select className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2.5 py-2 font-mono text-[11px] outline-none focus:border-(--accent-primary)">
						<option>UTC</option>
						<option>UTC-5 (EST)</option>
						<option>UTC+1 (CET)</option>
						<option>UTC+9 (JST)</option>
					</select>
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase">
						Number Format
					</label>
					<select className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2.5 py-2 font-mono text-[11px] outline-none focus:border-(--accent-primary)">
						<option>1,000.00</option>
						<option>1.000,00</option>
						<option>1 000.00</option>
					</select>
				</div>
			</div>
			<div className="mt-4 flex justify-end">
				<Button variant="primary" size="sm">
					SAVE PREFERENCES
				</Button>
			</div>
		</div>
	);
};
