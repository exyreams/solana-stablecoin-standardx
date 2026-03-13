import { Loader2 } from "lucide-react";
import type { FC } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { DashboardFooter } from "./DashboardFooter";
import { DashboardLayout } from "./DashboardLayout";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";

export const DashboardWrapper: FC = () => {
	const { isAuthenticated, isLoading, user } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-body flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// RBAC protection
	const isAdmin = user?.role === "ADMIN";
	const adminOnlyRoutes = [
		"/create",
		"/dashboard", // Hide main dashboard for minters
		"/dashboard/token-info",
		"/dashboard/analytics",
		"/dashboard/audit-logs",
		"/dashboard/accounts",
		"/dashboard/blacklist",
		"/dashboard/compliance",
		"/dashboard/privacy",
		"/dashboard/minters",
		"/dashboard/roles",
		"/dashboard/oracle",
	];

	// Exact matches for admin only routes
	const isUnauthorized =
		!isAdmin &&
		(location.pathname === "/dashboard" ||
			adminOnlyRoutes.some(
				(route) =>
					route !== "/dashboard" && location.pathname.startsWith(route),
			));

	if (isUnauthorized) {
		return <Navigate to="/dashboard/mint-tokens" replace />;
	}

	return (
		<DashboardLayout>
			<DashboardTopBar />
			<DashboardSidebar />
			<main className="col-start-2 row-start-2 overflow-y-auto p-6 flex flex-col gap-6 bg-[#080808]">
				<Outlet />
			</main>
			<DashboardFooter />
		</DashboardLayout>
	);
};
