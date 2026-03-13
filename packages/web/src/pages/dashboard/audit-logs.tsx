import { type FC, useEffect, useState } from "react";
import { AuditFilters, AuditTable } from "../../components/audit-log";
import { Button } from "../../components/ui/Button";
import { stablecoinApi } from "../../lib/api/stablecoin";

const AuditLogs: FC = () => {
	const [events, setEvents] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState({
		limit: 15,
		offset: 0,
		action: "",
		address: "",
		startDate: "",
		endDate: "",
	});
	const [selectedEvent, setSelectedEvent] = useState<any>(null);
	const [totalCount, setTotalCount] = useState(0);

	const fetchLogs = async () => {
		setLoading(true);
		try {
			const data = await stablecoinApi.getAuditLogs(filters);
			setEvents(data.entries);
			setTotalCount(data.count);
		} catch (error) {
			console.error("Failed to fetch audit logs:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs();
	}, [filters]);

	return (
		<>
			<div className="font-mono text-[10px] text-[#777777] mb-1">
				DASHBOARD <span className="text-[#444444]">&gt;</span>{" "}
				<span className="text-[#EAEAEA]">USDC-SOL</span>{" "}
				<span className="text-[#444444]">&gt;</span>{" "}
				<span className="text-[#EAEAEA]">AUDIT</span>
			</div>

			<div className="flex items-center justify-between mb-2">
				<div className="flex items-center gap-3">
					<h1 className="text-xl font-light tracking-wider">AUDIT LOG</h1>
					<div className="flex items-center gap-2 ml-2">
						<div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#00ff88]" />
						<span className="font-mono text-[9px] text-green-400 border border-green-400 px-1.5 py-0.5 tracking-wider">
							LIVE
						</span>
					</div>
				</div>
				<div className="flex gap-2">
					<Button variant="secondary" size="sm">
						CSV EXPORT
					</Button>
					<Button variant="secondary" size="sm">
						JSON EXPORT
					</Button>
					<Button
						variant="secondary"
						size="sm"
						className="ml-2"
						onClick={() =>
							setFilters({
								limit: 15,
								offset: 0,
								action: "",
								address: "",
								startDate: "",
								endDate: "",
							})
						}
					>
						RESET FILTERS
					</Button>
				</div>
			</div>

			<AuditFilters
				onFilterChange={(newFilters) =>
					setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }))
				}
				filters={filters}
			/>
			<AuditTable
				events={events}
				loading={loading}
				onSelectEvent={setSelectedEvent}
				selectedEventId={selectedEvent?.id}
				totalCount={totalCount}
				limit={filters.limit}
				offset={filters.offset}
				onPageChange={(newOffset) =>
					setFilters((prev) => ({ ...prev, offset: newOffset }))
				}
			/>
		</>
	);
};

export default AuditLogs;
