import type { FC } from "react";

interface Step {
	number: number;
	label: string;
	active?: boolean;
	completed?: boolean;
}

interface StepperProps {
	steps: Step[];
}

export const Stepper: FC<StepperProps> = ({ steps }) => {
	return (
		<div className="flex items-center gap-3 mb-10 border-b border-(--border-dim) pb-6">
			{steps.map((step, idx) => (
				<>
					<div
						key={step.number}
						className={`flex items-center gap-2 font-mono text-[10px] ${
							step.active
								? "text-(--accent-active)"
								: step.completed
									? "text-(--text-main)"
									: "text-(--text-dark)"
						}`}
					>
						<div
							className={`w-[18px] h-[18px] border rounded-full flex items-center justify-center text-[9px] ${
								step.active
									? "bg-(--accent-primary) border-(--accent-primary) text-black font-bold shadow-[0_0_10px_rgba(204,163,82,0.12)]"
									: step.completed
										? "border-(--accent-primary) text-(--accent-primary)"
										: "border-(--border-mid)"
							}`}
						>
							{step.completed ? "✓" : step.number}
						</div>
						{step.label}
					</div>
					{idx < steps.length - 1 && (
						<div
							className={`flex-1 h-px max-w-[40px] ${
								step.completed ? "bg-(--accent-primary)" : "bg-(--border-dim)"
							}`}
						/>
					)}
				</>
			))}
		</div>
	);
};
