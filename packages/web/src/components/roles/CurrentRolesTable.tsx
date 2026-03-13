import { Copy } from "lucide-react";
import { type FC, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { UpdateRoleModal } from "./UpdateRoleModal";

interface RolesConfig {
	masterAuthority: string;
	pendingMaster: string | null;
	pauser: string;
	blacklister: string;
	burner: string;
	seizer: string;
}

interface CurrentRolesTableProps {
	roles?: RolesConfig;
	mint: string;
	onUpdate?: () => void;
}

export const CurrentRolesTable: FC<CurrentRolesTableProps> = ({
	roles,
	mint,
	onUpdate,
}) => {
	const [selectedRole, setSelectedRole] = useState<{
		id: string;
		name: string;
		address: string;
	} | null>(null);

	const roleList = [
		{
			id: "master",
			name: "Master Authority",
			address: roles?.masterAuthority || "8x2...f93",
			assignedAt: "2023.10.20",
			canUpdate: false,
		},
		{
			id: "burner",
			name: "Burner",
			address: roles?.burner || "3M1...a21",
			assignedAt: "2023.10.21",
			canUpdate: true,
		},
		{
			id: "pauser",
			name: "Pauser",
			address: roles?.pauser || "9v9...e11",
			assignedAt: "2023.10.21",
			canUpdate: true,
		},
		{
			id: "blacklister",
			name: "Blacklister",
			address: roles?.blacklister || "4f2...99K",
			assignedAt: "2023.10.22",
			canUpdate: true,
		},
		{
			id: "seizer",
			name: "Seizer",
			address: roles?.seizer || "6h1...bb8",
			assignedAt: "2023.10.22",
			canUpdate: true,
		},
	];

	const truncate = (address: string) => {
		if (address.includes("...")) return address;
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Address copied to clipboard");
	};

	return (
		<div className="bg-(--bg-panel) border border-(--border-mid)">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Current Roles
				</span>
			</div>

			<table className="w-full font-mono text-[11px]">
				<thead>
					<tr className="border-b border-(--border-mid)">
						<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal">
							Role Name
						</th>
						<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal">
							Current Address
						</th>
						<th className="text-left p-4 text-(--text-dim) uppercase text-[9px] font-normal">
							Assigned At
						</th>
						<th className="text-right p-4 text-(--text-dim) uppercase text-[9px] font-normal">
							Actions
						</th>
					</tr>
				</thead>
				<tbody>
					{roleList.map((role) => (
						<tr key={role.id} className="border-b border-(--border-dim)">
							<td className="p-4 font-semibold">{role.name}</td>
							<td className="p-4">
								<div className="flex items-center gap-2">
									<span
										className={
											roles ? "text-(--text-main)" : "text-(--text-dim)"
										}
									>
										{truncate(role.address)}
									</span>
									<Copy
										className="w-3 h-3 text-(--text-dark) hover:text-(--accent-primary) cursor-pointer"
										onClick={() => copyToClipboard(role.address)}
									/>
								</div>
							</td>
							<td className="p-4 text-(--text-dim)">{role.assignedAt}</td>
							<td className="p-4 text-right">
								{role.id === "master" && (
									<div
										className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#888888]/20 bg-[#888888]/5 rounded-sm text-[#888888] text-[9px] font-mono uppercase cursor-help hover:border-(--accent-primary)/30 hover:text-(--accent-primary) transition-all"
										title="High-security operation. Use the Admin CLI to transfer master authority."
										onClick={() =>
											document
												.getElementById("transfer-section")
												?.scrollIntoView({ behavior: "smooth" })
										}
									>
										Use CLI
									</div>
								)}
								{role.canUpdate && (
									<Button
										variant="secondary"
										size="sm"
										onClick={() =>
											setSelectedRole({
												id: role.id,
												name: role.name,
												address: role.address,
											})
										}
									>
										UPDATE
									</Button>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{selectedRole && (
				<UpdateRoleModal
					isOpen={!!selectedRole}
					onClose={() => setSelectedRole(null)}
					onSuccess={() => onUpdate?.()}
					mint={mint}
					roleId={selectedRole.id}
					roleName={selectedRole.name}
					currentAddress={selectedRole.address}
				/>
			)}
		</div>
	);
};
