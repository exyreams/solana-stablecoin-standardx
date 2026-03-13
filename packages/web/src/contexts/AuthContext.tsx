import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import type { AuthCredentials } from "../lib/api/auth";
import { authApi } from "../lib/api/auth";

interface User {
	id: string;
	username: string;
	role: string;
}

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (credentials: AuthCredentials) => Promise<void>;
	register: (credentials: AuthCredentials & { role?: string }) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const login = async (credentials: AuthCredentials) => {
		const data = await authApi.login(credentials);
		if (data.token) {
			localStorage.setItem("admin_token", data.token);
			localStorage.setItem("user_role", data.role || "ADMIN");
			localStorage.setItem("username", credentials.username);
			setIsAuthenticated(true);
			setUser({
				id: "",
				username: credentials.username,
				role: data.role || "ADMIN",
			});
		}
	};

	const register = async (credentials: AuthCredentials & { role?: string }) => {
		await authApi.register(credentials);
	};

	const logout = () => {
		localStorage.removeItem("admin_token");
		localStorage.removeItem("user_role");
		localStorage.removeItem("username");
		setUser(null);
		setIsAuthenticated(false);
	};

	useEffect(() => {
		const token = localStorage.getItem("admin_token");
		const role = localStorage.getItem("user_role");
		const username = localStorage.getItem("username") || "User";
		if (token) {
			setIsAuthenticated(true);
			setUser({ id: "", username, role: role || "" });
		}
		setIsLoading(false);
	}, []);

	return (
		<AuthContext.Provider
			value={{ user, isAuthenticated, isLoading, login, logout, register }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
