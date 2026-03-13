import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Trash2 } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface PriceFeed {
	priceFeedPda: string;
	feedIndex: number;
	feedType: number;
	label: string;
	feedAddress: string;
	weight: number;
	enabled: boolean;
	lastTimestamp: number;
	lastPrice: string;
}

interface PriceFeedsTableProps {
	refreshKey?: number;
	onRefresh?: () => void;
}

export const PriceFeedsTable: FC<PriceFeedsTableProps> = ({
	refreshKey,
	onRefresh,
}) => {
	const [feeds, setFeeds] = useState<PriceFeed[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingFeed, setEditingFeed] = useState<PriceFeed | null>(null);

	const [formData, setFormData] = useState({
		label: "",
		feedAddress: "",
		weight: 1.0,
		feedType: 0,
		feedIndex: 0,
	});

	// Contract stores price in 6 decimals internally
	const DISPLAY_DECIMALS = 1_000_000;

	const fetchFeeds = async () => {
		try {
			const data = await stablecoinApi.getOracleStatus();
			setFeeds(data.feeds);
		} catch (err) {
			console.error("Failed to fetch oracle feeds", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchFeeds();
		const interval = setInterval(fetchFeeds, 10000);
		return () => clearInterval(interval);
	}, [refreshKey]);

	const handleCrank = async (index: number) => {
		try {
			// Crank with 9-decimal precision price
			const mockPrice = 1.0 + (Math.random() * 0.02 - 0.01);
			const res = await stablecoinApi.crankOracleFeed({
				feedIndex: index,
				price: mockPrice,
			});
			if (res.success) {
				toast.success(`Cranked Feed #${index}`);
				fetchFeeds();
				onRefresh?.();
			}
		} catch (err: any) {
			toast.error(`Crank failed: ${err.message}`);
		}
	};

	const handleRemove = async (index: number) => {
		if (!confirm(`Remove oracle feed #${index}? This action is immediate.`))
			return;
		try {
			const res = await stablecoinApi.removeOracleFeed(index);
			if (res.success) {
				toast.success("Feed removed");
				fetchFeeds();
				onRefresh?.();
			}
		} catch (err: any) {
			toast.error(`Removal failed: ${err.message}`);
		}
	};

	const openAddModal = () => {
		setEditingFeed(null);
		const nextIndex =
			feeds.length > 0 ? Math.max(...feeds.map((f) => f.feedIndex)) + 1 : 0;
		setFormData({
			label: "",
			feedAddress: "",
			weight: 1.0,
			feedType: 0,
			feedIndex: nextIndex,
		});
		setIsModalOpen(true);
	};

	const openEditModal = (feed: PriceFeed) => {
		setEditingFeed(feed);
		setFormData({
			label: feed.label,
			feedAddress: feed.feedAddress,
			weight: feed.weight / 10000,
			feedType: feed.feedType,
			feedIndex: feed.feedIndex,
		});
		setIsModalOpen(true);
	};

	const handleSaveFeed = async () => {
		if (!formData.label || !formData.feedAddress) {
			toast.error("Label and Address are required");
			return;
		}

		try {
			if (editingFeed) {
				const removeRes = await stablecoinApi.removeOracleFeed(
					editingFeed.feedIndex,
				);
				if (!removeRes.success)
					throw new Error("Failed to remove old feed entry");
			}

			const res = await stablecoinApi.addOracleFeed({
				feedIndex: formData.feedIndex,
				label: formData.label,
				feedAddress: formData.feedAddress,
				weight: Math.floor(formData.weight * 10000),
				feedType: formData.feedType,
			});

			if (res.success) {
				toast.success(editingFeed ? "Feed updated" : "Feed added");
				setIsModalOpen(false);
				fetchFeeds();
				onRefresh?.();
			}
		} catch (err: any) {
			toast.error(`Operation failed: ${err.message}`);
		}
	};

	const getFeedTypeText = (type: number) => {
		switch (type) {
			case 0:
				return "PYTH";
			case 1:
				return "SWITCHBOARD";
			case 2:
				return "CHAINLINK";
			default:
				return "MANUAL";
		}
	};

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid)">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Configured Price Feeds
				</span>
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0 border-(--border-mid)"
						onClick={() => {
							fetchFeeds();
							onRefresh?.();
							toast.success("Syncing feeds...");
						}}
						disabled={loading}
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
						/>
					</Button>
					<Button variant="secondary" size="sm" onClick={openAddModal}>
						ADD FEED
					</Button>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full font-mono text-[11px]">
					<thead>
						<tr className="border-b border-(--border-mid) bg-(--bg-surface)/30">
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Idx
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Type
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Label
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Address
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Weight
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Status
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Last Pulse
							</th>
							<th className="text-left p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Value
							</th>
							<th className="text-right p-3 text-(--text-dim) uppercase text-[9px] font-normal">
								Operations
							</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td
									colSpan={9}
									className="p-8 text-center text-(--text-dim) animate-pulse"
								>
									ESTABLISHING CONNECTION...
								</td>
							</tr>
						) : feeds.length === 0 ? (
							<tr>
								<td colSpan={9} className="p-8 text-center text-(--text-dim)">
									NO FEEDS INITIALIZED
								</td>
							</tr>
						) : (
							feeds.map((feed) => (
								<tr
									key={feed.feedIndex}
									className="border-b border-(--border-dim) hover:bg-(--accent-primary)/5 transition-colors group"
								>
									<td className="p-3 text-(--text-dim)">{feed.feedIndex}</td>
									<td className="p-3">
										<Badge
											variant="accent"
											className="text-[8px] px-1 py-0 border-none bg-(--accent-primary)/10"
										>
											{getFeedTypeText(feed.feedType)}
										</Badge>
									</td>
									<td className="p-3 font-semibold">{feed.label}</td>
									<td className="p-3 text-(--text-dim) text-[10px]">
										<code>
											{feed.feedAddress.slice(0, 4)}...
											{feed.feedAddress.slice(-4)}
										</code>
									</td>
									<td className="p-3">{(feed.weight / 10000).toFixed(1)}x</td>
									<td className="p-3">
										<Badge
											variant={feed.enabled ? "success" : "default"}
											className="scale-90 origin-left"
										>
											{feed.enabled ? "ACTIVE" : "OFF"}
										</Badge>
									</td>
									<td className="p-3 text-(--text-dark) text-[10px]">
										{feed.lastTimestamp > 0
											? formatDistanceToNow(
													new Date(feed.lastTimestamp * 1000),
													{ addSuffix: true },
												).toUpperCase()
											: "NEVER"}
									</td>
									<td className="p-3 text-(--accent-active) font-bold">
										${(Number(feed.lastPrice) / DISPLAY_DECIMALS).toFixed(4)}
									</td>
									<td className="p-3 text-right">
										<div className="flex gap-2 justify-end opacity-60 group-hover:opacity-100 transition-opacity">
											<Button
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-[9px] font-bold hover:text-(--accent-active) hover:bg-(--accent-primary)/10 border border-transparent hover:border-(--accent-primary)/20"
												onClick={() => handleCrank(feed.feedIndex)}
											>
												CRANK
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 px-2 text-[9px] font-bold hover:bg-(--bg-surface) border border-transparent hover:border-(--border-mid)"
												onClick={() => openEditModal(feed)}
											>
												EDIT
											</Button>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 w-7 p-0 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
												onClick={() => handleRemove(feed.feedIndex)}
												title="Remove Feed"
											>
												<Trash2 className="w-3.5 h-3.5" />
											</Button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title={editingFeed ? "EDIT ORACLE FEED" : "REGISTER NEW FEED"}
			>
				<div className="space-y-6">
					<div className="flex items-center justify-between p-3 bg-(--bg-surface) border border-(--border-mid)">
						<span className="text-[10px] uppercase text-(--text-dim) font-bold">
							Feed Index Slot
						</span>
						<div className="flex items-center gap-3">
							<Input
								type="number"
								className="w-16 h-8 text-center font-mono text-sm"
								value={formData.feedIndex}
								onChange={(e) =>
									setFormData({
										...formData,
										feedIndex: parseInt(e.target.value),
									})
								}
								disabled={!!editingFeed}
							/>
							<span className="text-[9px] text-(--text-dark) uppercase">
								Unique Identifier
							</span>
						</div>
					</div>

					<div>
						<label className="block text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-2">
							Source Protocol
						</label>
						<div className="grid grid-cols-4 gap-2">
							{[0, 1, 2, 3].map((type) => (
								<button
									key={type}
									onClick={() => setFormData({ ...formData, feedType: type })}
									className={`py-2 text-[10px] font-mono border transition-all ${
										formData.feedType === type
											? "border-(--accent-primary) bg-(--accent-primary)/10 text-(--accent-primary)"
											: "border-(--border-mid) text-(--text-dim) hover:border-(--border-bright)"
									}`}
								>
									{getFeedTypeText(type)}
								</button>
							))}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="block text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
								Descriptive Label
							</label>
							<Input
								placeholder="e.g. PYTH-SOL-USD"
								value={formData.label}
								onChange={(e) =>
									setFormData({ ...formData, label: e.target.value })
								}
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
								Aggregation Weight
							</label>
							<Input
								type="number"
								step="0.1"
								value={formData.weight}
								onChange={(e) =>
									setFormData({
										...formData,
										weight: parseFloat(e.target.value),
									})
								}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="block text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
							On-Chain Data Address (Base58)
						</label>
						<Input
							placeholder="Aggregator Account Pubkey"
							value={formData.feedAddress}
							onChange={(e) =>
								setFormData({ ...formData, feedAddress: e.target.value })
							}
							className="font-mono text-[11px]"
						/>
					</div>

					<div className="pt-4 border-t border-(--border-dim) flex gap-3">
						<Button
							variant="ghost"
							className="flex-1"
							onClick={() => setIsModalOpen(false)}
						>
							CANCEL
						</Button>
						<Button
							variant="primary"
							className="flex-1"
							onClick={handleSaveFeed}
						>
							{editingFeed ? "APPLY CHANGES" : "REGISTER FEED"}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
};
