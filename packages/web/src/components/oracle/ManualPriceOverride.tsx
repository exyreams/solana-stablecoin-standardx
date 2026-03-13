import { type FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { stablecoinApi } from "../../lib/api/stablecoin";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface ManualPriceOverrideProps {
	onUpdate?: () => void;
}

export const ManualPriceOverride: FC<ManualPriceOverrideProps> = ({
	onUpdate,
}) => {
	const [price, setPrice] = useState("");
	const [active, setActive] = useState(false);
	const [currentStatus, setCurrentStatus] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	// Contract stores price in 6 decimals internally
	const DISPLAY_DECIMALS = 1_000_000;

	const fetchStatus = async () => {
		try {
			const data = await stablecoinApi.getOracleStatus();
			setCurrentStatus(data.status);
			setActive(data.status?.manualPriceActive || false);
			if (data.status?.manualPriceActive) {
				setPrice(
					(Number(data.status.manualPrice) / DISPLAY_DECIMALS).toString(),
				);
			}
		} catch (err) {
			console.error("Failed to fetch manual price status", err);
		}
	};

	useEffect(() => {
		fetchStatus();
	}, []);

	const handleSetOverride = async () => {
		if (!price || isNaN(Number(price))) {
			toast.error("Please enter a valid price");
			return;
		}

		setLoading(true);
		try {
			const res = await stablecoinApi.setManualPrice({
				price: Number(price),
				active: true,
			});
			if (res.success) {
				toast.success("Manual price override set");
				fetchStatus();
				onUpdate?.();
			}
		} catch (err: any) {
			toast.error(`Failed to set override: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleToggleActive = async () => {
		setLoading(true);
		try {
			const res = await stablecoinApi.setManualPrice({
				price: Number(price) || 0,
				active: !active,
			});
			if (res.success) {
				toast.success(`Override ${!active ? "activated" : "deactivated"}`);
				fetchStatus();
				onUpdate?.();
			}
		} catch (err: any) {
			toast.error(`Toggle failed: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleClear = async () => {
		setLoading(true);
		try {
			const res = await stablecoinApi.setManualPrice({
				price: 0,
				active: false,
			});
			if (res.success) {
				toast.success("Override cleared");
				setPrice("");
				fetchStatus();
				onUpdate?.();
			}
		} catch (err: any) {
			toast.error(`Clear failed: ${err.message}`);
		} finally {
			setLoading(false);
		}
	};

	const currentManualPrice = currentStatus?.manualPriceActive
		? (Number(currentStatus.manualPrice) / DISPLAY_DECIMALS).toFixed(4)
		: null;

	return (
		<div className="space-y-6">
			<div>
				<label className="block text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider mb-2">
					Emergency Override Price ({currentStatus?.baseCurrency}/
					{currentStatus?.quoteCurrency})
				</label>
				<Input
					type="number"
					placeholder="1.0000"
					value={price}
					onChange={(e) => setPrice(e.target.value)}
					className="font-mono text-lg py-6"
				/>
				<p className="mt-2 text-[10px] text-(--text-dark)">
					This price will bypass all aggregated oracle feeds when activated.
				</p>
			</div>

			<div className="flex items-center justify-between p-4 bg-(--bg-panel) border border-(--border-mid)">
				<div className="flex items-center gap-3">
					<div
						className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${active ? "bg-orange-500" : "bg-(--border-mid)"}`}
						onClick={handleToggleActive}
					>
						<div
							className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${active ? "left-5.5" : "left-0.5"}`}
						/>
					</div>
					<div className="flex flex-col">
						<span
							className={`text-[11px] font-bold ${active ? "text-orange-500" : "text-(--text-dim)"}`}
						>
							{active ? "OVERRIDE ACTIVE" : "OVERRIDE INACTIVE"}
						</span>
						<span className="text-[9px] text-(--text-dark) uppercase">
							Activation Toggle
						</span>
					</div>
				</div>

				<div className="text-right">
					<div className="text-[9px] text-(--text-dim) uppercase mb-1">
						Current Manual Value
					</div>
					{currentManualPrice ? (
						<span className="font-mono text-sm text-orange-500 font-bold">
							{currentStatus?.quoteCurrency === "USD" ? "$" : ""}
							{currentManualPrice}{" "}
							{currentStatus?.quoteCurrency !== "USD"
								? currentStatus?.quoteCurrency
								: ""}
						</span>
					) : (
						<Badge variant="default">DISABLED</Badge>
					)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3">
				<Button
					variant="secondary"
					className="w-full"
					onClick={handleSetOverride}
					disabled={loading}
				>
					{loading ? "SETTING..." : "UPDATE PRICE"}
				</Button>
				<Button
					variant="ghost"
					className="w-full border-red-900/50 text-red-400 hover:bg-red-500/10 hover:text-red-500"
					onClick={handleClear}
					disabled={loading}
				>
					CLEAR OVERRIDE
				</Button>
			</div>
		</div>
	);
};
