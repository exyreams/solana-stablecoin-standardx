import { Gavel } from "lucide-react";
import { type FC, useState } from "react";
import {
	ComplianceStats,
	SeizureHistory,
	TransferHookStatus,
} from "../../components/compliance";
import { ExecuteSeizureModal } from "../../components/compliance/ExecuteSeizureModal";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useTokens } from "../../contexts/TokenContext";
import { useCompliance } from "../../hooks/useCompliance";

const Compliance: FC = () => {
	const { selectedToken } = useTokens();
	const { stats, history, isLoading, refresh } = useCompliance();
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			{/* Header and Breadcrumb */}
			<div className="flex flex-col gap-2">
				<div className="font-mono text-[9px] text-(--text-dim) tracking-widest flex items-center gap-2">
					<span className="opacity-50 uppercase">
						{selectedToken?.symbol || "TOKEN"}
					</span>
					<span className="text-(--text-dark)">/</span>
					<span className="text-(--accent-primary)">COMPLIANCE</span>
				</div>

				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<h1 className="text-xl font-light tracking-[0.1em] text-(--text-main)">
							COMPLIANCE & SEIZURE
						</h1>
						<Badge
							variant="accent"
							className="text-[8px] font-bold tracking-tighter bg-(--accent-primary)/10 border-(--accent-primary)/30"
						>
							SSS-2 ONLY
						</Badge>
					</div>

					<Button
						variant="danger"
						size="sm"
						className="font-bold tracking-widest px-8 h-10 text-[10px] flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white border-none rounded-none shadow-xl shadow-red-900/20"
						onClick={() => setIsModalOpen(true)}
					>
						<Gavel className="w-4 h-4" />
						EXECUTE SEIZURE
					</Button>
				</div>
			</div>

			<ComplianceStats stats={stats} isLoading={isLoading} />

			<div className="flex flex-col gap-6">
				<TransferHookStatus />
				<div className="min-h-[500px] flex-grow">
					<SeizureHistory history={history} isLoading={isLoading} />
				</div>
			</div>

			<ExecuteSeizureModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={refresh}
			/>
		</div>
	);
};

export default Compliance;
