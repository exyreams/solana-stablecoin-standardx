import { Loader2 } from "lucide-react";
import { type FC, useEffect, useState } from "react";
import {
	ConfigurationGrid,
	ExtensionsPanel,
	MetadataPanel,
	QuickStats,
	TokenHeader,
} from "../../components/token-info";
import { useTokens } from "../../contexts/TokenContext";
import {
	type StablecoinDetails,
	stablecoinApi,
} from "../../lib/api/stablecoin";

const TokenInfo: FC = () => {
	const { selectedToken } = useTokens();
	const [details, setDetails] = useState<StablecoinDetails | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const fetchDetails = async () => {
			if (!selectedToken) return;

			try {
				setIsLoading(true);
				const data = await stablecoinApi.get(selectedToken.mintAddress);
				setDetails(data);
			} catch (error) {
				console.error("Failed to fetch token details:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchDetails();
	}, [selectedToken]);

	if (!selectedToken) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-(--text-dim) font-mono text-sm border border-dashed border-(--border-mid)">
				<p>NO TOKEN SELECTED</p>
				<p className="text-xs mt-2">PLEASE SELECT A TOKEN FROM THE TOP BAR</p>
			</div>
		);
	}

	if (isLoading && !details) {
		return (
			<div className="flex items-center justify-center p-24">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	const tokenData = details || selectedToken;

	return (
		<>
			<TokenHeader details={tokenData} />
			<ConfigurationGrid details={tokenData} />
			<ExtensionsPanel details={tokenData} />
			<MetadataPanel details={tokenData} />
			<QuickStats details={tokenData} />
		</>
	);
};

export default TokenInfo;
