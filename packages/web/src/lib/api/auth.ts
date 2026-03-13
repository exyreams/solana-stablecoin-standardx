import client from "./client";

export interface LoginResponse {
	success: boolean;
	token: string;
	role: string;
}

export interface RegisterResponse {
	success: boolean;
	message: string;
}

export interface AuthCredentials {
	username: string;
	password?: string;
	secretToken?: string;
}

export const authApi = {
	login: async (credentials: AuthCredentials): Promise<LoginResponse> => {
		const { data } = await client.post<LoginResponse>(
			"/admin/login",
			credentials,
		);
		return data;
	},

	register: async (credentials: AuthCredentials): Promise<RegisterResponse> => {
		const { data } = await client.post<RegisterResponse>(
			"/admin/register",
			credentials,
		);
		return data;
	},
};
