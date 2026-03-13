import { type FC, useState } from "react";
import {
	AccountActions,
	AccountActivity,
	AccountDetails,
	AccountSearch,
} from "../../components/account-management";
import { useTokens } from "../../contexts/TokenContext";
import { useAccount } from "../../hooks/useAccount";

const Accounts: FC = () => {
	const [searchAddress, setSearchAddress] = useState<string | null>(null);
	const { selectedToken } = useTokens();
	const { accountData, isLoading, error, refresh } = useAccount(searchAddress);

	return (
		<>
			<div className="font-mono text-[10px] text-[#444444] uppercase mb-2">
				DASHBOARD /{" "}
				<span className="text-[#777777]">
					{selectedToken?.symbol || "TOKEN"}
				</span>{" "}
				/ <span className="text-[#CCA352]">ACCOUNTS</span>
			</div>

			<AccountSearch onSearch={setSearchAddress} isLoading={isLoading} />

			{accountData ? (
				<div className="grid grid-cols-[420px_1fr] gap-6 items-start">
					<div className="space-y-6">
						<AccountDetails account={accountData} />
						<AccountActions account={accountData} onActionComplete={refresh} />
					</div>

					<AccountActivity account={accountData} />
				</div>
			) : searchAddress && !isLoading ? (
				<div className="border border-dashed border-[#333333] bg-[rgba(255,68,68,0.02)] p-8 text-center mt-6">
					<div className="font-mono text-[#ff4444] text-sm font-bold mb-2">
						{error || "NO ACCOUNT FOUND"}
					</div>
					<div className="text-[#777777] text-[11px]">
						The address {searchAddress} does not exist on the current mint (
						{selectedToken?.symbol}). Ensure you are on the correct network.
					</div>
				</div>
			) : (
				<div className="border border-dashed border-[#222222] p-20 text-center">
					<p className="text-[#555555] font-mono text-sm animasi-pulse">
						ENTER AN ACCOUNT ADDRESS TO BEGIN LOOKUP
					</p>
				</div>
			)}
		</>
	);
};

export default Accounts;
