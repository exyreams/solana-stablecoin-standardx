import type { FC } from "react";
import { Link } from "react-router-dom";

const footerLinks = {
	standards: [
		{ label: "SSS-1 Minimal", href: "/docs", external: false },
		{ label: "SSS-2 Compliant", href: "/docs", external: false },
		{ label: "SSS-3 Private", href: "/docs", external: false },
	],
	operations: [
		{ label: "Mint Tokens", href: "/dashboard/mint-tokens", external: false },
		{ label: "Burn Tokens", href: "/dashboard/burn-tokens", external: false },
		{ label: "Manage Minters", href: "/dashboard/minters", external: false },
		{ label: "Manage Accounts", href: "/dashboard/accounts", external: false },
	],
	compliance: [
		{ label: "Blacklist", href: "/dashboard/blacklist", external: false },
		{ label: "Compliance", href: "/dashboard/compliance", external: false },
		{ label: "Privacy", href: "/dashboard/privacy", external: false },
		{ label: "Audit Logs", href: "/dashboard/audit-logs", external: false },
	],
	resources: [
		{ label: "Documentation", href: "/docs", external: false },
		{ label: "Create Stablecoin", href: "/create", external: false },
		{
			label: "GitHub",
			href: "https://github.com/superteam-brazil/solana-stablecoin-standard",
			external: true,
		},
	],
	community: [
		{ label: "Discord", href: "https://discord.gg/solana", external: true },
		{ label: "Twitter", href: "https://twitter.com/solana", external: true },
	],
};

export const Footer: FC = () => {
	return (
		<footer
			className="relative bg-(bg-panel) py-20 px-20 overflow-hidden"
			style={{ borderTop: "1px solid rgba(204, 163, 82, 0.4)" }}
		>
			{/* Large Background Text */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
				<div className="font-mono font-black text-[180px] text-white/[0.02] select-none whitespace-nowrap">
					SOLANA STABLECOIN STANDARD
				</div>
			</div>

			<div className="relative z-10 grid grid-cols-[2fr_auto_repeat(5,1fr)] gap-8 mb-16 max-w-[1400px] mx-auto">
				{/* Brand Column */}
				<div>
					<div className="flex items-center gap-3 font-bold font-mono mb-5 text-[var(--accent-primary)]">
						<img src="/logo.svg" alt="SSS Logo" className="h-8 w-auto" />
						<span>SSS MANAGER</span>
					</div>
					<div className="mono label-amber text-[10px] mb-2">
						Solana Stablecoin Standard
					</div>
					<div className="mono text-(text-dark) text-[10px]">
						Open Source // MIT License
					</div>
				</div>

				{/* Separator */}
				<div className="w-px bg-gradient-to-b from-transparent via-(border-mid) to-transparent self-stretch mx-4" />

				{/* Standards */}
				<div>
					<h5 className="font-mono text-(text-main) m-0 mb-5 text-xs">
						STANDARDS
					</h5>
					<ul className="list-none p-0 m-0">
						{footerLinks.standards.map((link) => (
							<li key={link.label} className="mb-3">
								{link.external ? (
									<a
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</a>
								) : (
									<Link
										to={link.href}
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</Link>
								)}
							</li>
						))}
					</ul>
				</div>

				{/* Operations */}
				<div>
					<h5 className="font-mono text-(text-main) m-0 mb-5 text-xs">
						OPERATIONS
					</h5>
					<ul className="list-none p-0 m-0">
						{footerLinks.operations.map((link) => (
							<li key={link.label} className="mb-3">
								{link.external ? (
									<a
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</a>
								) : (
									<Link
										to={link.href}
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</Link>
								)}
							</li>
						))}
					</ul>
				</div>

				{/* Compliance */}
				<div>
					<h5 className="font-mono text-(text-main) m-0 mb-5 text-xs">
						COMPLIANCE
					</h5>
					<ul className="list-none p-0 m-0">
						{footerLinks.compliance.map((link) => (
							<li key={link.label} className="mb-3">
								{link.external ? (
									<a
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</a>
								) : (
									<Link
										to={link.href}
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</Link>
								)}
							</li>
						))}
					</ul>
				</div>

				{/* Resources */}
				<div>
					<h5 className="font-mono text-(text-main) m-0 mb-5 text-xs">
						RESOURCES
					</h5>
					<ul className="list-none p-0 m-0">
						{footerLinks.resources.map((link) => (
							<li key={link.label} className="mb-3">
								{link.external ? (
									<a
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</a>
								) : (
									<Link
										to={link.href}
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</Link>
								)}
							</li>
						))}
					</ul>
				</div>

				{/* Community */}
				<div>
					<h5 className="font-mono text-(text-main) m-0 mb-5 text-xs">
						COMMUNITY
					</h5>
					<ul className="list-none p-0 m-0">
						{footerLinks.community.map((link) => (
							<li key={link.label} className="mb-3">
								{link.external ? (
									<a
										href={link.href}
										target="_blank"
										rel="noopener noreferrer"
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</a>
								) : (
									<Link
										to={link.href}
										className="text-(text-dim) no-underline text-xs transition-colors duration-200 inline-block hover:text-[var(--accent-primary)]"
									>
										{link.label}
									</Link>
								)}
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* Bottom */}
			<div className="relative z-10 border-t border-(border-dim) pt-10 text-center text-[10px] text-(text-dark) mono">
				SSS MANAGER v1.0.0 // SOLANA STABLECOIN STANDARD //{" "}
				{new Date().getFullYear()}
			</div>
		</footer>
	);
};
