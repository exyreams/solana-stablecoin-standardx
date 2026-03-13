import { type FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export const OracleConfig: FC = () => {
	const [status, setStatus] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [editMode, setEditMode] = useState(false);

	const [formData, setFormData] = useState({
		maxStalenessSeconds: 0,
		minFeedsRequired: 0,
		mintPremiumBps: 0,
		redeemDiscountBps: 0,
		maxPriceChangeBps: 0,
	});

	const fetchStatus = async () => {
		try {
			const data = await stablecoinApi.getOracleStatus();
			setStatus(data.status);
			setFormData({
				maxStalenessSeconds: data.status?.maxStalenessSeconds || 0,
				minFeedsRequired: data.status?.minFeedsRequired || 0,
				mintPremiumBps: data.status?.mintPremiumBps || 0,
				redeemDiscountBps: data.status?.redeemDiscountBps || 0,
				maxPriceChangeBps: data.status?.maxPriceChangeBps || 0,
			});
		} catch (err) {
			console.error("Failed to fetch oracle config", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStatus();
	}, []);

	const handleTogglePause = async () => {
		const action = status?.paused ? "unpause" : "pause";
		if (!confirm(`Are you sure you want to ${action} the oracle?`)) return;

		setActionLoading(true);
		try {
			const res = await stablecoinApi.updateOracleConfig({
				paused: !status?.paused,
			});
			if (res.success) {
				toast.success(`Oracle ${!status?.paused ? "paused" : "unpaused"}`);
				fetchStatus();
			}
		} catch (err: any) {
			toast.error(`Operation failed: ${err.message}`);
		} finally {
			setActionLoading(false);
		}
	};

	const handleUpdateConfig = async () => {
		setActionLoading(true);
		try {
			const res = await stablecoinApi.updateOracleConfig(formData);
			if (res.success) {
				toast.success("Oracle configuration updated");
				setEditMode(false);
				fetchStatus();
			}
		} catch (err: any) {
			toast.error(`Update failed: ${err.message}`);
		} finally {
			setActionLoading(false);
		}
	};

	if (loading)
		return (
			<div className="p-8 text-center animate-pulse font-mono text-xs opacity-50">
				LOADING CONFIGURATION...
			</div>
		);

	return (
		<div className="space-y-6">
			{editMode ? (
				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<label className="text-[10px] uppercase text-(--text-dim) font-bold">
								Max Staleness (s)
							</label>
							<Input
								type="number"
								value={formData.maxStalenessSeconds}
								onChange={(e) =>
									setFormData({
										...formData,
										maxStalenessSeconds: parseInt(e.target.value),
									})
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-[10px] uppercase text-(--text-dim) font-bold">
								Min Feeds
							</label>
							<Input
								type="number"
								value={formData.minFeedsRequired}
								onChange={(e) =>
									setFormData({
										...formData,
										minFeedsRequired: parseInt(e.target.value),
									})
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-[10px] uppercase text-(--text-dim) font-bold">
								Mint Premium (bps)
							</label>
							<Input
								type="number"
								value={formData.mintPremiumBps}
								onChange={(e) =>
									setFormData({
										...formData,
										mintPremiumBps: parseInt(e.target.value),
									})
								}
							/>
						</div>
						<div className="space-y-1">
							<label className="text-[10px] uppercase text-(--text-dim) font-bold">
								Redeem Discount (bps)
							</label>
							<Input
								type="number"
								value={formData.redeemDiscountBps}
								onChange={(e) =>
									setFormData({
										...formData,
										redeemDiscountBps: parseInt(e.target.value),
									})
								}
							/>
						</div>
					</div>
					<div className="space-y-1">
						<label className="text-[10px] uppercase text-(--text-dim) font-bold">
							Circuit Breaker Deviation (bps)
						</label>
						<Input
							type="number"
							value={formData.maxPriceChangeBps}
							onChange={(e) =>
								setFormData({
									...formData,
									maxPriceChangeBps: parseInt(e.target.value),
								})
							}
						/>
					</div>
					<div className="flex gap-3 pt-2">
						<Button
							variant="ghost"
							className="flex-1"
							onClick={() => setEditMode(false)}
						>
							CANCEL
						</Button>
						<Button
							variant="primary"
							className="flex-1"
							onClick={handleUpdateConfig}
							isLoading={actionLoading}
						>
							SAVE CHANGES
						</Button>
					</div>
				</div>
			) : (
				<>
					<div className="grid grid-cols-2 gap-px bg-(--border-mid) border border-(--border-mid)">
						<div className="bg-(--bg-panel) p-4 flex justify-between items-center">
							<span className="text-[10px] uppercase text-(--text-dim) font-semibold">
								Staleness Limit
							</span>
							<span className="font-mono text-sm">
								{status?.maxStalenessSeconds || 0}s
							</span>
						</div>
						<div className="bg-(--bg-panel) p-4 flex justify-between items-center">
							<span className="text-[10px] uppercase text-(--text-dim) font-semibold">
								Min Feeds
							</span>
							<span className="font-mono text-sm">
								{status?.minFeedsRequired || 0}
							</span>
						</div>
						<div className="bg-(--bg-panel) p-4 flex justify-between items-center">
							<span className="text-[10px] uppercase text-(--text-dim) font-semibold">
								Mint Premium
							</span>
							<span className="font-mono text-sm text-green-500">
								{status?.mintPremiumBps || 0} BPS
							</span>
						</div>
						<div className="bg-(--bg-panel) p-4 flex justify-between items-center">
							<span className="text-[10px] uppercase text-(--text-dim) font-semibold">
								Redeem Discount
							</span>
							<span className="font-mono text-sm text-red-400">
								{status?.redeemDiscountBps || 0} BPS
							</span>
						</div>
					</div>

					<div className="p-4 bg-(--bg-panel) border border-(--border-mid) flex justify-between items-center">
						<div className="flex flex-col gap-1">
							<span className="text-[10px] uppercase text-(--text-dim) font-semibold">
								Circuit Breaker
							</span>
							<span className="text-[9px] text-(--text-dark) uppercase">
								Max Price Deviation
							</span>
						</div>
						<span className="font-mono text-sm">
							{status?.maxPriceChangeBps || 0} BPS
						</span>
					</div>

					<div className="pt-4 border-t border-(--border-dim) space-y-3">
						<div className="flex justify-between items-center mb-2">
							<span className="text-[10px] uppercase text-(--text-dim) font-semibold">
								Operational Status
							</span>
							<Badge variant={status?.paused ? "danger" : "success"}>
								{status?.paused ? "PAUSED" : "OPERATIONAL"}
							</Badge>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<Button
								variant="secondary"
								className="w-full"
								onClick={() => setEditMode(true)}
							>
								EDIT CONFIG
							</Button>
							<Button
								variant={status?.paused ? "primary" : "danger"}
								className="w-full"
								onClick={handleTogglePause}
								isLoading={actionLoading}
							>
								{status?.paused ? "RESUME ORACLE" : "PAUSE ORACLE"}
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};
