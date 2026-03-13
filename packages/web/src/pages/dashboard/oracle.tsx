import { Settings, ShieldAlert } from "lucide-react";
import { type FC, useState } from "react";
import {
	ManualPriceOverride,
	OracleActivity,
	OracleConfig,
	OracleStatus,
	PriceFeedsTable,
} from "../../components/oracle";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

const Oracle: FC = () => {
	const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	const handleRefresh = () => {
		setRefreshKey((prev) => prev + 1);
	};

	return (
		<>
			<div className="font-mono text-[10px] text-[#777777] mb-2 uppercase tracking-tight">
				DASHBOARD <span className="text-[#444444] mx-1">/</span> ORACLE
				MANAGEMENT
			</div>

			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-light tracking-wider uppercase">
						Oracle Control
					</h1>
					<Badge variant="accent">LIVE FEEDS</Badge>
				</div>
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="sm"
						className="text-[10px] h-9 gap-2 border-(--border-mid) hover:border-orange-500/50 hover:text-orange-500"
						onClick={() => setIsOverrideModalOpen(true)}
					>
						<ShieldAlert className="w-3.5 h-3.5" />
						EMERGENCY ACTIONS
					</Button>
					<Button
						variant="ghost"
						size="sm"
						className="text-[10px] h-9 gap-2 border-(--border-mid)"
						onClick={() => setIsSettingsModalOpen(true)}
					>
						<Settings className="w-3.5 h-3.5" />
						CONFIG
					</Button>
				</div>
			</div>

			<OracleStatus />

			<div className="flex items-center justify-between mb-4 mt-2">
				<div className="text-[10px] text-(--text-dim) font-mono uppercase tracking-widest">
					Price Feed Architecture
				</div>
				<div className="text-[10px] text-(--text-dim) font-mono">
					LAST SYNC: {new Date().toLocaleTimeString()}
				</div>
			</div>

			<div className="w-full">
				<PriceFeedsTable refreshKey={refreshKey} onRefresh={handleRefresh} />
			</div>

			<OracleActivity refreshKey={refreshKey} />

			{/* Emergency Override Modal */}
			<Modal
				isOpen={isOverrideModalOpen}
				onClose={() => setIsOverrideModalOpen(false)}
				title="EMERGENCY PRICE OVERRIDE"
				variant="danger"
			>
				<ManualPriceOverride onUpdate={handleRefresh} />
			</Modal>

			{/* Oracle Settings Modal */}
			<Modal
				isOpen={isSettingsModalOpen}
				onClose={() => setIsSettingsModalOpen(false)}
				title="ORACLE CONFIGURATION"
				size="wide"
			>
				<OracleConfig />
			</Modal>
		</>
	);
};

export default Oracle;
