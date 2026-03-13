import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogIn } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";

type MenuCategory = "dashboard" | "operations" | "resources" | null;

type MenuItem = {
	label: string;
	desc: string;
	path?: string;
	href?: string;
};

export const Navbar: FC = () => {
	const [activeMenu, setActiveMenu] = useState<MenuCategory>(null);
	const { isAuthenticated } = useAuth();

	const dashboardMenu: MenuItem[] = [
		{
			path: "/dashboard",
			label: "Overview",
			desc: "Main dashboard with metrics and quick actions",
		},
		{
			path: "/dashboard/token-info",
			label: "Token Info",
			desc: "View token configuration and metadata",
		},
		{
			path: "/dashboard/mint-tokens",
			label: "Mint Tokens",
			desc: "Issue new tokens to accounts",
		},
		{
			path: "/dashboard/burn-tokens",
			label: "Burn Tokens",
			desc: "Destroy tokens from circulation",
		},
		{
			path: "/dashboard/minters",
			label: "Minters",
			desc: "Manage minter authorities and quotas",
		},
		{
			path: "/dashboard/accounts",
			label: "Accounts",
			desc: "Search and manage token accounts",
		},
		{
			path: "/dashboard/roles",
			label: "Roles",
			desc: "Manage role permissions and authorities",
		},
		{
			path: "/dashboard/analytics",
			label: "Analytics",
			desc: "View holders and supply analytics",
		},
		{
			path: "/dashboard/audit-logs",
			label: "Audit Logs",
			desc: "Transaction history and event logs",
		},
	];

	const operationsMenu: MenuItem[] = [
		{
			path: "/create",
			label: "Create Stablecoin",
			desc: "Launch a new stablecoin with wizard",
		},
		{
			path: "/dashboard/blacklist",
			label: "Blacklist",
			desc: "SSS-2: Manage blacklisted addresses",
		},
		{
			path: "/dashboard/compliance",
			label: "Compliance",
			desc: "SSS-2: Seizure and compliance tools",
		},
		{
			path: "/dashboard/privacy",
			label: "Privacy",
			desc: "SSS-3: Confidential transfer controls",
		},
		{
			path: "/dashboard/oracle",
			label: "Oracle",
			desc: "Manage price feeds and oracle config",
		},
	];

	const resourcesMenu: MenuItem[] = [
		{
			path: "/docs",
			label: "Documentation",
			desc: "Complete guides and API reference",
		},
		{
			path: "/profile",
			label: "Profile",
			desc: "View your stablecoins and activity",
		},
		{
			href: "https://github.com/superteam-brazil/solana-stablecoin-standard",
			label: "GitHub",
			desc: "Source code and contributions",
		},
		{
			href: "#standards",
			label: "Standards",
			desc: "SSS-1, SSS-2, SSS-3 specifications",
		},
	];

	const renderMegaMenu = (items: MenuItem[]) => (
		<motion.div
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -8 }}
			transition={{ duration: 0.2, ease: "easeOut" }}
			className="absolute top-full left-0 mt-0 bg-(--bg-panel) border border-(--border-mid) shadow-xl z-50 min-w-[600px]"
		>
			<div className="grid grid-cols-2 gap-px bg-(--border-dim) p-px">
				{items.map((item) =>
					item.path ? (
						<Link
							key={item.path}
							to={item.path}
							onClick={() => setActiveMenu(null)}
							className="bg-(--bg-panel) px-4 py-3 hover:bg-white/5 transition-colors group"
						>
							<div className="font-mono text-[11px] text-(--text-main) group-hover:text-[#CCA352] font-bold mb-1">
								{item.label}
							</div>
							<div className="text-[10px] text-white/60 leading-relaxed">
								{item.desc}
							</div>
						</Link>
					) : (
						<a
							key={item.href}
							href={item.href}
							target={item.href?.startsWith("http") ? "_blank" : undefined}
							rel={
								item.href?.startsWith("http")
									? "noopener noreferrer"
									: undefined
							}
							onClick={() => setActiveMenu(null)}
							className="bg-(--bg-panel) px-4 py-3 hover:bg-white/5 transition-colors group"
						>
							<div className="font-mono text-[11px] text-(--text-main) group-hover:text-[#CCA352] font-bold mb-1">
								{item.label}
							</div>
							<div className="text-[10px] text-white/60 leading-relaxed">
								{item.desc}
							</div>
						</a>
					),
				)}
			</div>
		</motion.div>
	);

	return (
		<nav
			className="h-16 flex items-center justify-between px-20 bg-[rgba(15,15,15,0.95)] backdrop-blur-[10px] sticky top-0 z-40"
			style={{ borderBottom: "1px solid rgba(204, 163, 82, 0.4)" }}
		>
			<div className="flex items-center gap-3 font-bold font-mono">
				<Link
					to="/"
					className="flex items-center gap-3 hover:opacity-80 transition-opacity text-(--accent-primary)"
				>
					<img src="/logo.svg" alt="SSS Logo" className="h-8 w-auto" />
					<span>SSS MANAGER</span>
				</Link>
			</div>

			<div className="flex gap-6 items-center">
				{/* Dashboard Dropdown */}
				<div
					className="relative"
					onMouseEnter={() => setActiveMenu("dashboard")}
					onMouseLeave={() => setActiveMenu(null)}
				>
					<button className="text-white/70 hover:text-[#CCA352] transition-colors text-[13px] flex items-center gap-1 py-2 font-medium">
						Dashboard
						<ChevronDown size={14} />
					</button>
					<AnimatePresence>
						{activeMenu === "dashboard" && (
							<div className="absolute top-full left-0 pt-2 -ml-4">
								{renderMegaMenu(dashboardMenu)}
							</div>
						)}
					</AnimatePresence>
				</div>

				{/* Operations Dropdown */}
				<div
					className="relative"
					onMouseEnter={() => setActiveMenu("operations")}
					onMouseLeave={() => setActiveMenu(null)}
				>
					<button className="text-white/70 hover:text-[#CCA352] transition-colors text-[13px] flex items-center gap-1 py-2 font-medium">
						Operations
						<ChevronDown size={14} />
					</button>
					<AnimatePresence>
						{activeMenu === "operations" && (
							<div className="absolute top-full left-0 pt-2 -ml-4">
								{renderMegaMenu(operationsMenu)}
							</div>
						)}
					</AnimatePresence>
				</div>

				{/* Resources Dropdown */}
				<div
					className="relative"
					onMouseEnter={() => setActiveMenu("resources")}
					onMouseLeave={() => setActiveMenu(null)}
				>
					<button className="text-white/70 hover:text-[#CCA352] transition-colors text-[13px] flex items-center gap-1 py-2 font-medium">
						Resources
						<ChevronDown size={14} />
					</button>
					<AnimatePresence>
						{activeMenu === "resources" && (
							<div className="absolute top-full left-0 pt-2 -ml-4">
								{renderMegaMenu(resourcesMenu)}
							</div>
						)}
					</AnimatePresence>
				</div>
			</div>

			<div className="flex gap-3 items-center">
				{!isAuthenticated ? (
					<>
						<Link to="/register">
							<button className="bg-transparent border border-[#CCA352] text-[#CCA352] px-4 py-1.5 font-mono text-[11px] font-semibold hover:bg-[rgba(204,163,82,0.1)] transition-colors uppercase">
								Register
							</button>
						</Link>
						<Link to="/login">
							<Button
								variant="primary"
								size="sm"
								className="flex items-center gap-2"
							>
								<LogIn size={14} />
								ADMIN LOGIN
							</Button>
						</Link>
					</>
				) : (
					<Link to="/dashboard">
						<Button variant="primary" size="sm">
							Launch Dashboard
						</Button>
					</Link>
				)}
			</div>
		</nav>
	);
};
