import type { FC } from "react";
import {
	CurrentRolesTable,
	PermissionsMatrix,
	RecentActivityTable,
	TransferAuthority,
} from "../../components/roles";
import { useTokens } from "../../contexts/TokenContext";

const Roles: FC = () => {
	const { selectedToken, refreshTokens } = useTokens();
	const roles = selectedToken?.onChain?.roles;

	return (
		<>
			<div className="font-mono text-[10px] text-[#777777] mb-2">
				DASHBOARD <span className="text-[#444444]">&gt;</span>{" "}
				{selectedToken?.symbol || "USDC-SOL"}{" "}
				<span className="text-[#444444]">&gt;</span> ROLES
			</div>

			<h1 className="text-2xl font-light tracking-wider">
				ROLES & PERMISSIONS
			</h1>

			<div className="grid grid-cols-[1fr_400px] gap-6">
				<div className="space-y-6">
					<CurrentRolesTable
						roles={roles}
						mint={selectedToken?.mintAddress || ""}
						onUpdate={refreshTokens}
					/>
					<PermissionsMatrix />
					<RecentActivityTable mint={selectedToken?.mintAddress || ""} />
				</div>

				<TransferAuthority
					roles={roles}
					mint={selectedToken?.mintAddress || ""}
				/>
			</div>
		</>
	);
};

export default Roles;
