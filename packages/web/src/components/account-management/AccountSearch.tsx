import { AnimatePresence, motion } from "framer-motion";
import { Fingerprint, History, Search, Wallet, Zap } from "lucide-react";
import { type FC, useEffect, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface AccountSearchProps {
	onSearch: (address: string) => void;
	isLoading?: boolean;
}

export const AccountSearch: FC<AccountSearchProps> = ({
	onSearch,
	isLoading,
}) => {
	const [address, setAddress] = useState("");
	const [showHistory, setShowHistory] = useState(false);
	const [history, setHistory] = useState<string[]>([]);
	const historyRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const savedHistory = localStorage.getItem("account_search_history");
		if (savedHistory) {
			setHistory(JSON.parse(savedHistory));
		}

		const handleClickOutside = (event: MouseEvent) => {
			if (
				historyRef.current &&
				!historyRef.current.contains(event.target as Node)
			) {
				setShowHistory(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSearch = (searchAddr?: string) => {
		const targetAddr = searchAddr || address.trim();
		if (targetAddr) {
			onSearch(targetAddr);
			saveToHistory(targetAddr);
			setShowHistory(false);
		}
	};

	const saveToHistory = (addr: string) => {
		const newHistory = [addr, ...history.filter((h) => h !== addr)].slice(0, 5);
		setHistory(newHistory);
		localStorage.setItem("account_search_history", JSON.stringify(newHistory));
	};

	const clearHistory = () => {
		setHistory([]);
		localStorage.removeItem("account_search_history");
	};

	const isWalletAddress = address.length > 32 && !address.includes("11111111");

	return (
		<div className="relative mb-4 group" ref={historyRef}>
			<div className="flex border border-(--border-mid) bg-(--bg-input) focus-within:border-(--accent-primary) transition-all">
				<div className="flex items-center px-4 text-(--text-dark)">
					<Search className="w-4 h-4" />
				</div>
				<Input
					placeholder="Enter Wallet or Token Account address..."
					value={address}
					onChange={(e) => setAddress(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleSearch()}
					onFocus={() => history.length > 0 && setShowHistory(true)}
					className="flex-1 border-none bg-transparent focus:ring-0"
				/>

				<AnimatePresence>
					{isWalletAddress && (
						<motion.div
							initial={{ opacity: 0, x: 10 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: 10 }}
							className="flex items-center gap-1.5 px-3 border-l border-(--border-dim) text-(--accent-primary) text-[9px] font-mono whitespace-nowrap bg-[rgba(204,163,82,0.05)]"
						>
							<Wallet className="w-3 h-3" />
							SMART RESOLUTION ACTIVE
						</motion.div>
					)}
				</AnimatePresence>

				<Button
					variant="primary"
					className="rounded-none px-10 h-11"
					onClick={() => handleSearch()}
					isLoading={isLoading}
				>
					{isWalletAddress ? "RESOLVE" : "LOOKUP"}
				</Button>
			</div>

			<AnimatePresence>
				{showHistory && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="absolute top-full left-0 right-0 z-50 mt-1 bg-(--bg-panel) border border-(--border-mid) shadow-2xl"
					>
						<div className="flex justify-between items-center p-3 border-b border-(--border-dim) bg-(--bg-surface)">
							<span className="text-[9px] uppercase text-(--text-dim) font-bold flex items-center gap-2">
								<History className="w-3 h-3" />
								Recent Searches
							</span>
							<button
								onClick={clearHistory}
								className="text-[9px] text-(--text-dark) hover:text-red-400 transition-colors"
							>
								CLEAR ALL
							</button>
						</div>
						<div className="max-h-[300px] overflow-y-auto">
							{history.map((item, idx) => (
								<div
									key={idx}
									onClick={() => {
										setAddress(item);
										handleSearch(item);
									}}
									className="flex items-center justify-between p-3 hover:bg-[rgba(204,163,82,0.05)] cursor-pointer group/item border-b border-(--border-dim) last:border-none"
								>
									<div className="flex items-center gap-3 overflow-hidden">
										<Fingerprint className="w-3 h-3 text-(--text-dark) group-hover/item:text-(--accent-primary)" />
										<span className="font-mono text-[11px] truncate text-(--text-dim) group-hover/item:text-(--text-main)">
											{item}
										</span>
									</div>
									<Zap className="w-3 h-3 text-(--accent-primary) opacity-0 group-hover/item:opacity-100 transition-opacity" />
								</div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
