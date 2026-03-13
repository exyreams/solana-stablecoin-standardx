import type { FC } from "react";
import { Button } from "../ui/Button";

export const NotificationSettings: FC = () => {
	const toggles = [
		{ label: "MINT EVENT", enabled: true },
		{ label: "BURN EVENT", enabled: true },
		{ label: "BLACKLIST EVENT", enabled: true },
		{ label: "SEIZE EVENT", enabled: true },
		{ label: "ROLE UPDATE", enabled: false },
		{ label: "ORACLE UPDATE", enabled: false },
	];

	return (
		<>
			<div className="bg-(--bg-surface) border border-(--border-mid) p-4 mb-4">
				<div className="text-[10px] uppercase text-(--text-dim) font-mono mb-4">
					EMAIL ALERTS
				</div>
				<div className="flex flex-col gap-2 mb-4">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase">
						Alert Email Address
					</label>
					<input
						type="text"
						defaultValue="alerts@example.com"
						className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2.5 py-2.5 font-mono text-[11px] w-full outline-none focus:border-(--accent-primary)"
					/>
				</div>
				{toggles.map((toggle, idx) => (
					<div
						key={idx}
						className={`flex justify-between items-center py-3 ${
							idx < toggles.length - 1 ? "border-b border-(--border-dim)" : ""
						}`}
					>
						<span
							className={`font-mono text-[11px] ${
								toggle.enabled ? "text-(--text-main)" : "text-(--text-dim)"
							}`}
						>
							{toggle.label}
						</span>
						<div
							className={`w-8 h-4 border relative cursor-pointer ${
								toggle.enabled
									? "bg-green-400 border-green-400"
									: "bg-(--bg-input) border-(--border-mid)"
							}`}
						>
							<div
								className={`absolute w-3 h-3 top-[1px] transition-all ${
									toggle.enabled
										? "left-4 bg-(--bg-body)"
										: "left-[1px] bg-(--border-bright)"
								}`}
							/>
						</div>
					</div>
				))}
			</div>

			<div className="bg-(--bg-surface) border border-(--border-mid) p-4 mb-4">
				<div className="text-[10px] uppercase text-(--text-dim) font-mono mb-4">
					WEBHOOK CONFIGURATION
				</div>
				<div className="flex flex-col gap-2">
					<label className="text-[9px] text-(--text-dark) font-mono uppercase">
						Webhook URL
					</label>
					<div className="flex gap-2">
						<input
							type="text"
							placeholder="https://hooks.example.com/..."
							className="flex-1 bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2.5 py-2.5 font-mono text-[11px] outline-none focus:border-(--accent-primary)"
						/>
						<Button variant="secondary" size="sm">
							TEST
						</Button>
					</div>
				</div>
			</div>

			<div className="bg-(--bg-surface) border border-(--border-mid) p-4">
				<div className="text-[10px] uppercase text-(--text-dim) font-mono mb-4">
					INTEGRATIONS
				</div>
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-3">
						<div className="font-mono text-[10px] text-(--text-dim) w-20">
							SLACK
						</div>
						<input
							type="text"
							placeholder="https://hooks.slack.com/services/..."
							className="flex-1 bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2.5 py-2.5 font-mono text-[11px] outline-none focus:border-(--accent-primary)"
						/>
						<Button variant="secondary" size="sm">
							CONNECT
						</Button>
					</div>
					<div className="flex items-center gap-3">
						<div className="font-mono text-[10px] text-(--text-dim) w-20">
							DISCORD
						</div>
						<input
							type="text"
							placeholder="https://discord.com/api/webhooks/..."
							className="flex-1 bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2.5 py-2.5 font-mono text-[11px] outline-none focus:border-(--accent-primary)"
						/>
						<Button variant="secondary" size="sm">
							CONNECT
						</Button>
					</div>
				</div>
			</div>
		</>
	);
};
