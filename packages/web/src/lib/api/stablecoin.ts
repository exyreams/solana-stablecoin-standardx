import api from "./client";

export interface CreateStablecoinRequest {
	preset: "sss1" | "sss2" | "sss3";
	name: string;
	symbol: string;
	decimals: number;
	uri?: string;
	extensions?: {
		permanentDelegate?: boolean;
		transferHook?: boolean;
		defaultFrozen?: boolean;
	};
	roles?: {
		minter?: string;
		burner?: string;
		pauser?: string;
		blacklister?: string;
	};
}

export interface CreateStablecoinResponse {
	success: boolean;
	mintAddress: string;
	preset: string;
	name: string;
	symbol: string;
	decimals: number;
	signature?: string;
}

export interface StablecoinDetails {
	id: string;
	mintAddress: string;
	preset: string;
	name: string;
	symbol: string;
	decimals: number;
	uri: string | null;
	signature: string | null;
	createdAt: string;
	onChain: {
		supply: string;
		decimals: number;
		name: string;
		symbol: string;
		uri: string;
		paused: boolean;
		roles: {
			masterAuthority: string;
			pendingMaster: string | null;
			pauser: string;
			blacklister: string;
			burner: string;
			seizer: string;
		};
		extensions: {
			transferHook: boolean;
			permanentDelegate: boolean;
			defaultAccountFrozen: boolean;
			confidentialTransfers: boolean;
		};
	} | null;
	warning?: string;
}

export interface ListStablecoinsResponse {
	stablecoins: StablecoinDetails[];
	count: number;
	limit: number;
	offset: number;
}

export const stablecoinApi = {
	create: async (
		data: CreateStablecoinRequest,
	): Promise<CreateStablecoinResponse> => {
		const response = await api.post<CreateStablecoinResponse>(
			"/create-stablecoin",
			data,
		);
		return response.data;
	},
	get: async (mintAddress: string): Promise<StablecoinDetails> => {
		const response = await api.get<StablecoinDetails>(
			`/get-stablecoin/${mintAddress}`,
		);
		return response.data;
	},
	list: async (params?: {
		limit?: number;
		offset?: number;
	}): Promise<ListStablecoinsResponse> => {
		const response = await api.get<ListStablecoinsResponse>(
			"/list-stablecoins",
			{ params },
		);
		return response.data;
	},
	mint: async (
		mintAddress: string,
		recipient: string,
		amount: number,
		minter?: string,
	): Promise<{ success: boolean; id: string }> => {
		const response = await api.post("/mint-burn/mint", {
			mintAddress,
			recipient,
			amount,
			minter,
		});
		return response.data;
	},
	burn: async (
		mintAddress: string,
		fromTokenAccount: string,
		amount: number,
		minter?: string,
	): Promise<{ success: boolean; id: string }> => {
		const response = await api.post("/mint-burn/burn", {
			mintAddress,
			fromTokenAccount,
			amount,
			minter,
		});
		return response.data;
	},

	getHistory: async (
		mintAddress: string,
	): Promise<{ mints: any[]; burns: any[] }> => {
		const response = await api.get<{ mints: any[]; burns: any[] }>(
			`/get-stablecoin/${mintAddress}/history`,
		);
		return response.data;
	},

	prepareMint: async (
		mintAddress: string,
		recipient: string,
		amount: number,
		minter: string,
	): Promise<{ transaction: string }> => {
		const response = await api.post<{ transaction: string }>(
			"/mint-burn/prepare-mint",
			{
				mintAddress,
				recipient,
				amount,
				minter,
			},
		);
		return response.data;
	},

	prepareBurn: async (
		mintAddress: string,
		fromTokenAccount: string,
		amount: number,
		minter: string,
	): Promise<{ transaction: string }> => {
		const response = await api.post<{ transaction: string }>(
			"/mint-burn/prepare-burn",
			{
				mintAddress,
				fromTokenAccount,
				amount,
				minter,
			},
		);
		return response.data;
	},

	freeze: async (
		mintAddress: string,
		address: string,
		reason?: string,
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/compliance/freeze",
			{
				mintAddress,
				address,
				reason,
			},
		);
		return response.data;
	},

	thaw: async (
		mintAddress: string,
		address: string,
		reason?: string,
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/compliance/thaw",
			{
				mintAddress,
				address,
				reason,
			},
		);
		return response.data;
	},

	blacklist: async (
		mintAddress: string,
		address: string,
		reason?: string,
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/compliance/blacklist",
			{
				mintAddress,
				address,
				reason,
			},
		);
		return response.data;
	},

	seize: async (
		mintAddress: string,
		fromTokenAccount: string,
		toTokenAccount: string,
		amount: string | number,
		reason?: string,
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/compliance/seize",
			{
				mintAddress,
				fromTokenAccount,
				toTokenAccount,
				amount,
				reason,
			},
		);
		return response.data;
	},

	getAccountHistory: async (
		address: string,
		limit = 20,
	): Promise<{ entries: any[] }> => {
		const response = await api.get<{ entries: any[] }>(
			`/compliance/history/${address}`,
			{
				params: { limit },
			},
		);
		return response.data;
	},
	listBlacklist: async (
		mintAddress: string,
		sync = false,
	): Promise<{
		entries: { address: string; reason: string; timestamp: number }[];
	}> => {
		const response = await api.get<{
			entries: { address: string; reason: string; timestamp: number }[];
		}>("/compliance/blacklist", {
			params: { mintAddress, sync },
		});
		return response.data;
	},
	removeFromBlacklist: async (
		mintAddress: string,
		address: string,
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.delete<{ success: boolean; signature: string }>(
			`/compliance/blacklist/${address}`,
			{
				params: { mintAddress },
			},
		);
		return response.data;
	},
	getAuditLogs: async (params?: {
		limit?: number;
		offset?: number;
		action?: string;
		address?: string;
		startDate?: string;
		endDate?: string;
		status?: string;
	}): Promise<{ count: number; entries: any[] }> => {
		const response = await api.get<{ count: number; entries: any[] }>(
			"/compliance/audit",
			{
				params,
			},
		);
		return response.data;
	},
	getAccountBalance: async (
		address: string,
	): Promise<{ amount: string; decimals: number; uiAmountString: string }> => {
		const response = await api.get<{
			amount: string;
			decimals: number;
			uiAmountString: string;
		}>(`/accounts/${address}/balance`);
		return response.data;
	},

	updateRoles: async (
		mintAddress: string,
		updates: {
			burner?: string;
			pauser?: string;
			blacklister?: string;
			seizer?: string;
		},
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.put<{ success: boolean; signature: string }>(
			"/admin/roles",
			{ ...updates, mintAddress },
		);
		return response.data;
	},

	initiateTransfer: async (
		mintAddress: string,
		newMaster: string,
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/admin/authority/transfer",
			{ mintAddress, newMaster },
		);
		return response.data;
	},

	acceptTransfer: async (
		mintAddress: string,
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/admin/authority/accept",
			{ mintAddress },
		);
		return response.data;
	},
	setDevAuthority: async (
		secretKey: string,
	): Promise<{ success: boolean; message: string }> => {
		const response = await api.post<{ success: boolean; message: string }>(
			"/admin/dev/set-authority",
			{ secretKey },
		);
		return response.data;
	},
	getOracleStatus: async (): Promise<{ status: any; feeds: any[] }> => {
		const response = await api.get<{ status: any; feeds: any[] }>(
			"/admin/oracle/status",
		);
		return response.data;
	},
	addOracleFeed: async (data: {
		label: string;
		feedAddress: string;
		weight: number;
		feedType: number;
		feedIndex: number;
	}): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/admin/oracle/feeds",
			data,
		);
		return response.data;
	},
	removeOracleFeed: async (
		index: number,
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.delete<{ success: boolean; signature: string }>(
			`/admin/oracle/feeds/${index}`,
		);
		return response.data;
	},
	crankOracleFeed: async (data: {
		feedIndex: number;
		price: number;
	}): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/admin/oracle/crank",
			data,
		);
		return response.data;
	},
	setManualPrice: async (data: {
		price: number;
		active: boolean;
	}): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/admin/oracle/manual-price",
			data,
		);
		return response.data;
	},
	updateOracleConfig: async (
		data: any,
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.put<{ success: boolean; signature: string }>(
			"/admin/oracle/config",
			data,
		);
		return response.data;
	},
	aggregatePrices: async (
		feedAccounts: string[],
	): Promise<{ success: boolean; signature: string }> => {
		const response = await api.post<{ success: boolean; signature: string }>(
			"/admin/oracle/aggregate",
			{ feedAccounts },
		);
		return response.data;
	},
	getOracleActivity: async (limit = 10): Promise<{ entries: any[] }> => {
		const response = await api.get<{ entries: any[] }>(
			"/admin/oracle/activity",
			{
				params: { limit },
			},
		);
		return response.data;
	},
	getAnalytics: async (
		mintAddress?: string,
	): Promise<{
		overview: {
			totalSupply: string;
			minted24h: string;
			burned24h: string;
			netChange24h: string;
		};
		topHolders: {
			rank: number;
			address: string;
			owner: string;
			balance: string;
			percentage: string;
		}[];
		history: {
			date: string;
			supply: number;
		}[];
		breakdown: {
			name: string;
			value: number;
		}[];
		rpcError?: boolean;
	}> => {
		const response = await api.get("/analytics", {
			params: { mint: mintAddress },
		});
		return response.data;
	},
	getDashboardSummary: async (
		mintAddress?: string,
	): Promise<{
		metrics: {
			totalSupply: string;
			totalSupplyRaw: number;
			change24h: string;
			changePercent24h: string;
			isPaused: boolean;
			activeMinters: string;
			minterCapacity: string;
			price: string;
		};
		stats: {
			totalMinted: string;
			mintCount: string;
			totalBurned: string;
			burnCount: string;
			frozenCount: string;
			blacklistCount: string;
		};
		roles: {
			masterAuthority: string;
			pauser: string;
			blacklister: string;
			burner: string;
			seizer: string;
		};
		activities: {
			timestamp: string;
			action: string;
			amount: string;
			target: string;
			status: string;
			actionColor?: string;
		}[];
		trajectory: {
			date: string;
			supply: number;
		}[];
	}> => {
		const response = await api.get("/dashboard/summary", {
			params: { mint: mintAddress },
		});
		return response.data;
	},
};
