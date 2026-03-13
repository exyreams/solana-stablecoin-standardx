import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { DashboardWrapper } from "./components/layout/DashboardWrapper";
import { WalletProvider } from "./components/wallet/WalletProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { TokenProvider } from "./contexts/TokenContext";
import { LandingPage } from "./pages";
import Create from "./pages/create";
import Dashboard from "./pages/dashboard";
import Accounts from "./pages/dashboard/accounts";
import Analytics from "./pages/dashboard/analytics";
import AuditLogs from "./pages/dashboard/audit-logs";
import Blacklist from "./pages/dashboard/blacklist";
import BurnTokens from "./pages/dashboard/burn-tokens";
import Compliance from "./pages/dashboard/compliance";
import MintTokens from "./pages/dashboard/mint-tokens";
import Minters from "./pages/dashboard/minters";
import Oracle from "./pages/dashboard/oracle";
import Privacy from "./pages/dashboard/privacy";
import Roles from "./pages/dashboard/roles";
import TokenInfo from "./pages/dashboard/token-info";
import Docs from "./pages/docs";
import ErrorPage from "./pages/error";
import LoginPage from "./pages/login";
import NotFound from "./pages/not-found";
import Profile from "./pages/profile";
import RegisterPage from "./pages/register";

function App() {
	return (
		<WalletProvider>
			<AuthProvider>
				<TokenProvider>
					<BrowserRouter>
						<Routes>
							<Route path="/" element={<LandingPage />} />
							<Route path="/login" element={<LoginPage />} />
							<Route path="/register" element={<RegisterPage />} />

							<Route path="/dashboard" element={<DashboardWrapper />}>
								<Route index element={<Dashboard />} />
								<Route path="token-info" element={<TokenInfo />} />
								<Route path="mint-tokens" element={<MintTokens />} />
								<Route path="analytics" element={<Analytics />} />
								<Route path="burn-tokens" element={<BurnTokens />} />
								<Route path="blacklist" element={<Blacklist />} />
								<Route path="minters" element={<Minters />} />
								<Route path="accounts" element={<Accounts />} />
								<Route path="compliance" element={<Compliance />} />
								<Route path="privacy" element={<Privacy />} />
								<Route path="oracle" element={<Oracle />} />
								<Route path="roles" element={<Roles />} />
								<Route path="audit-logs" element={<AuditLogs />} />
							</Route>

							<Route path="/create" element={<DashboardWrapper />}>
								<Route index element={<Create />} />
							</Route>

							<Route path="/docs" element={<Docs />} />
							<Route path="/profile" element={<Profile />} />
							<Route path="/error" element={<ErrorPage />} />
							<Route path="*" element={<NotFound />} />
						</Routes>
					</BrowserRouter>
					<Toaster position="top-right" theme="dark" closeButton />
				</TokenProvider>
			</AuthProvider>
		</WalletProvider>
	);
}

export default App;
