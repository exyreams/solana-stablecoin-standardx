import client from "./client";

export interface AuthorityResponse {
	publicKey: string;
}

export interface MinterResponse {
	mint: string;
	minter: string;
	quota: string;
	minted: string;
	active: boolean;
}

export const adminApi = {
	getAuthority: async (): Promise<AuthorityResponse> => {
		const { data } = await client.get<AuthorityResponse>("/admin/authority");
		return data;
	},
	getMinters: async (mintAddress?: string): Promise<MinterResponse[]> => {
		const { data } = await client.get<MinterResponse[]>("/admin/minters", {
			params: { mint: mintAddress },
		});
		return data;
	},
	addMinter: async (
		address: string,
		quota: string,
		mintAddress?: string,
	): Promise<{ success: boolean; signature: string }> => {
		const { data } = await client.post<{ success: boolean; signature: string }>(
			"/admin/minters",
			{ address, quota, mintAddress },
		);
		return data;
	},
	updateMinter: async (
		address: string,
		params: {
			quota: string;
			active: boolean;
			resetMinted?: boolean;
			mintAddress?: string;
		},
	): Promise<{ success: boolean; signature: string }> => {
		const { data } = await client.put<{ success: boolean; signature: string }>(
			`/admin/minters/${address}`,
			params,
		);
		return data;
	},
	removeMinter: async (
		address: string,
		mintAddress?: string,
	): Promise<{ success: boolean; signature: string }> => {
		const { data } = await client.delete<{
			success: boolean;
			signature: string;
		}>(`/admin/minters/${address}`, {
			params: { mint: mintAddress },
		});
		return data;
	},
	getMinterStatus: async (walletAddress: string): Promise<string[]> => {
		const { data } = await client.get<{ authorizedMints: string[] }>(
			`/admin/minter-status/${walletAddress}`,
		);
		return data.authorizedMints;
	},
};
