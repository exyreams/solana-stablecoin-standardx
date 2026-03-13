import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { FC, ReactNode } from "react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	variant?: "default" | "danger";
	size?: "default" | "wide";
}

export const Modal: FC<ModalProps> = ({
	isOpen,
	onClose,
	title,
	children,
	variant = "default",
	size = "default",
}) => {
	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-black/85 backdrop-blur-sm"
					/>

					{/* Modal Content */}
					<motion.div
						initial={{ opacity: 0, scale: 0.98, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.98, y: 10 }}
						className={`relative w-full ${
							size === "wide" ? "max-w-4xl" : "max-w-lg"
						} bg-(--bg-panel) border border-(--border-bright) shadow-2xl flex flex-col max-h-[90vh] overflow-hidden`}
					>
						<div className="flex items-center justify-between p-5 border-b border-(--border-mid) bg-white/2 shrink-0">
							<div
								className={`text-xs font-bold uppercase tracking-widest border-l-2 pl-3 ${
									variant === "danger"
										? "text-(--danger) border-(--danger)"
										: "text-(--accent-primary) border-(--accent-primary)"
								}`}
							>
								{title}
							</div>
							<button
								onClick={onClose}
								className="text-(--text-dim) hover:text-(--text-main) transition-colors p-1"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar">
							{children}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};
