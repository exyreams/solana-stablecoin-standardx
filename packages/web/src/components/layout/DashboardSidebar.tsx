import { AnimatePresence, motion } from "framer-motion";
import {
	BarChart3,
	ChevronDown,
	ChevronUp,
	Coins,
	Database,
	Eye,
	FileText,
	Flame,
	Layers,
	LayoutDashboard,
	Lock,
	Settings2,
	Shield,
	ShieldAlert,
	Sliders,
	UserCog,
	Users,
	Zap,
} from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface NavItemProps {
	label: string;
	href: string;
	icon?: React.ReactNode;
}

const NavItem: FC<NavItemProps> = ({ label, href, icon }) => {
	const location = useLocation();
	const active = location.pathname === href;

	return (
		<Link
			to={href}
			className={`flex items-center gap-2 px-3 py-2 text-[11px] font-mono border mb-0.5 transition-colors ${
				active
					? "bg-[rgba(204,163,82,0.1)] text-[#FFD700] border-[#CCA352] border-l-2"
					: "text-[#EAEAEA] border-transparent hover:border-[#222222] hover:bg-[#161616]"
			}`}
		>
			{icon && (
				<span className={active ? "text-[#CCA352]" : "text-[#777777]"}>
					{icon}
				</span>
			)}
			{label}
		</Link>
	);
};

interface NavGroupProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
	icon?: React.ReactNode;
}

const NavGroup: FC<NavGroupProps> = ({
	title,
	children,
	defaultOpen = true,
	icon,
}) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className="nav-group">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center gap-2 text-[10px] text-[#EAEAEA] uppercase mb-2 pl-0 hover:text-[#CCA352] transition-colors font-bold tracking-wider"
			>
				<span className="text-[#777777]">{icon}</span>
				<span>{title}</span>
				{isOpen ? (
					<ChevronUp className="w-3 h-3 ml-auto" />
				) : (
					<ChevronDown className="w-3 h-3 ml-auto" />
				)}
			</button>
			<AnimatePresence mode="wait">
				{isOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2, ease: "easeOut" }}
						className="flex flex-col overflow-hidden"
					>
						{children}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export const DashboardSidebar: FC = () => {
	const { user } = useAuth();
	const isAdmin = user?.role === "ADMIN";

	return (
		<nav className="col-start-1 row-start-2 bg-[#0f0f0f] border-r border-[#222222] p-4 flex flex-col gap-6 overflow-y-auto">
			{/* Quick Action - Create Stablecoin */}
			{isAdmin && (
				<div className="pb-4 border-b border-[#222222]">
					<Link
						to="/create"
						className="flex items-center justify-center px-4 py-3 text-[11px] font-mono font-bold bg-[#CCA352] text-black border border-[#CCA352] hover:bg-[#FFD700] hover:shadow-[0_0_15px_rgba(204,163,82,0.15)] transition-all"
					>
						+ CREATE STABLECOIN
					</Link>
				</div>
			)}

			{isAdmin && (
				<NavGroup title="Overview" icon={<Layers size={14} />}>
					<NavItem
						label="DASHBOARD"
						href="/dashboard"
						icon={<LayoutDashboard size={14} />}
					/>
					<NavItem
						label="TOKEN INFO"
						href="/dashboard/token-info"
						icon={<Coins size={14} />}
					/>
					<NavItem
						label="ANALYTICS"
						href="/dashboard/analytics"
						icon={<BarChart3 size={14} />}
					/>
					<NavItem
						label="AUDIT LOGS"
						href="/dashboard/audit-logs"
						icon={<FileText size={14} />}
					/>
				</NavGroup>
			)}

			{isAdmin ? (
				<NavGroup title="Operations" icon={<Sliders size={14} />}>
					<NavItem
						label="MINT TOKENS"
						href="/dashboard/mint-tokens"
						icon={<Coins size={14} />}
					/>
					<NavItem
						label="BURN TOKENS"
						href="/dashboard/burn-tokens"
						icon={<Flame size={14} />}
					/>
					<NavItem
						label="ACCOUNTS"
						href="/dashboard/accounts"
						icon={<Database size={14} />}
					/>
				</NavGroup>
			) : (
				<div className="flex flex-col gap-1">
					<div className="text-[10px] text-[#777777] uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
						<Sliders size={14} />
						Operations
					</div>
					<NavItem
						label="MINT TOKENS"
						href="/dashboard/mint-tokens"
						icon={<Flame size={14} />}
					/>
					<NavItem
						label="BURN TOKENS"
						href="/dashboard/burn-tokens"
						icon={<Zap size={14} />}
					/>
				</div>
			)}

			{isAdmin && (
				<>
					<NavGroup
						title="Compliance"
						defaultOpen={false}
						icon={<ShieldAlert size={14} />}
					>
						<NavItem
							label="BLACKLIST"
							href="/dashboard/blacklist"
							icon={<Lock size={14} />}
						/>
						<NavItem
							label="COMPLIANCE"
							href="/dashboard/compliance"
							icon={<Shield size={14} />}
						/>
						<NavItem
							label="PRIVACY"
							href="/dashboard/privacy"
							icon={<Eye size={14} />}
						/>
					</NavGroup>
					<NavGroup
						title="Admin"
						defaultOpen={false}
						icon={<Settings2 size={14} />}
					>
						<NavItem
							label="MINTERS"
							href="/dashboard/minters"
							icon={<Users size={14} />}
						/>
						<NavItem
							label="ROLES & PERMS"
							href="/dashboard/roles"
							icon={<UserCog size={14} />}
						/>
						<NavItem
							label="ORACLE"
							href="/dashboard/oracle"
							icon={<Database size={14} />}
						/>
					</NavGroup>
				</>
			)}
		</nav>
	);
};
