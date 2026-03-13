import { type FC, useState } from "react";
import { AddToBlacklist, BlacklistTable } from "../../components/blacklist";
import { Button } from "../../components/ui/Button";
import { useTokens } from "../../contexts/TokenContext";
import { useBlacklist } from "../../hooks/useBlacklist";

const Blacklist: FC = () => {
	const { selectedToken } = useTokens();
	const { entries } = useBlacklist();
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [reasonKeyword, setReasonKeyword] = useState("");

	const handleExportJSON = () => {
		const dataStr = JSON.stringify(entries, null, 2);
		const dataUri =
			"data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

		const exportFileDefaultName = `blacklist-${selectedToken?.symbol || "token"}.json`;

		const linkElement = document.createElement("a");
		linkElement.setAttribute("href", dataUri);
		linkElement.setAttribute("download", exportFileDefaultName);
		linkElement.click();
	};

	return (
		<main className="flex flex-col gap-4 animate-in fade-in duration-500">
			{/* Breadcrumb */}
			<div className="flex items-center gap-2 font-mono text-[10px] text-(--text-dim) uppercase tracking-wider">
				<span>DASHBOARD</span>
				<span className="text-(--text-dark)">/</span>
				<span>{selectedToken?.symbol || "TOKEN"}</span>
				<span className="text-(--text-dark)">/</span>
				<span className="text-(--accent-primary)">BLACKLIST</span>
			</div>

			{/* Filter Row */}
			<div className="flex justify-between items-end gap-6 pb-6 border-b border-(--border-dim)">
				<div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
					<div className="flex flex-col gap-1.5 shrink-0">
						<span className="text-[9px] uppercase text-(--text-dark) font-bold tracking-tight">
							Search
						</span>
						<input
							type="text"
							placeholder="Search address or reason..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) font-mono text-[11px] px-3 py-1.5 w-60 outline-none focus:border-(--accent-primary) transition-colors"
						/>
					</div>

					<div className="flex flex-col gap-1.5 shrink-0">
						<span className="text-[9px] uppercase text-(--text-dark) font-bold tracking-tight">
							Date Range
						</span>
						<div className="flex gap-1">
							<input
								type="text"
								placeholder="FROM"
								className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) font-mono text-[11px] px-3 py-1.5 w-20 outline-none focus:border-(--accent-primary) transition-colors"
							/>
							<input
								type="text"
								placeholder="TO"
								className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) font-mono text-[11px] px-3 py-1.5 w-20 outline-none focus:border-(--accent-primary) transition-colors"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5 shrink-0">
						<span className="text-[9px] uppercase text-(--text-dark) font-bold tracking-tight">
							Added By
						</span>
						<select className="bg-(--bg-input) border border-(--border-mid) text-(--text-dim) font-mono text-[11px] px-3 py-1.5 w-40 outline-none focus:border-(--accent-primary) transition-colors">
							<option>All Authorities</option>
							<option>Master</option>
						</select>
					</div>

					<div className="flex flex-col gap-1.5 shrink-0">
						<span className="text-[9px] uppercase text-(--text-dark) font-bold tracking-tight">
							Reason Keyword
						</span>
						<input
							type="text"
							placeholder="e.g. OFAC"
							value={reasonKeyword}
							onChange={(e) => setReasonKeyword(e.target.value)}
							className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) font-mono text-[11px] px-3 py-1.5 w-32 outline-none focus:border-(--accent-primary) transition-colors"
						/>
					</div>
				</div>

				<div className="flex items-center gap-3 shrink-0">
					<Button variant="secondary" size="sm" onClick={handleExportJSON}>
						EXPORT JSON ▼
					</Button>
					<Button
						variant="primary"
						size="sm"
						onClick={() => setIsAddModalOpen(true)}
					>
						+ ADD TO BLACKLIST
					</Button>
				</div>
			</div>

			{/* Results count text mentioned in design */}
			<div className="text-(--text-dim) font-mono text-[10px] mt-1 uppercase">
				Real-time sync enabled • Compliance standard: SSS-2
			</div>

			<BlacklistTable searchQuery={searchQuery} reasonKeyword={reasonKeyword} />

			<AddToBlacklist
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
			/>
		</main>
	);
};

export default Blacklist;
