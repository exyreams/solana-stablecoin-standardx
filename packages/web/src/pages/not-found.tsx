import type { FC } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

const NotFound: FC = () => {
	const quickLinks = [
		{ label: "Dashboard", path: "/dashboard" },
		{ label: "Create Stablecoin", path: "/create" },
		{ label: "Documentation", path: "/docs" },
		{ label: "Profile", path: "/profile" },
	];

	return (
		<div className="min-h-screen bg-(--bg-body) flex flex-col items-center justify-center p-8">
			<div className="max-w-2xl w-full text-center">
				{/* Error Code */}
				<div className="font-mono text-[120px] font-light tracking-[0.3em] text-(--accent-primary) mb-4 leading-none">
					404
				</div>

				{/* Error Message */}
				<h1 className="font-mono text-2xl font-light tracking-[0.2em] text-(--text-main) mb-4">
					PAGE NOT FOUND
				</h1>
				<p className="text-[14px] text-(--text-dim) mb-12 leading-relaxed">
					The page you're looking for doesn't exist or has been moved.
					<br />
					Check the URL or navigate back to a known location.
				</p>

				{/* Search Bar */}
				<div className="mb-12">
					<div className="font-mono text-[10px] text-(--text-dark) uppercase mb-3">
						SEARCH FOR A PAGE
					</div>
					<div className="flex gap-2 max-w-md mx-auto">
						<input
							type="text"
							placeholder="Enter page name or path..."
							className="flex-1 bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-4 py-3 font-mono text-[12px] outline-none focus:border-(--accent-primary)"
						/>
						<Button variant="primary" size="md">
							SEARCH
						</Button>
					</div>
				</div>

				{/* Quick Links */}
				<div className="mb-12">
					<div className="font-mono text-[10px] text-(--text-dark) uppercase mb-4">
						QUICK LINKS
					</div>
					<div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
						{quickLinks.map((link) => (
							<Link
								key={link.path}
								to={link.path}
								className="bg-(--bg-surface) border border-(--border-mid) px-4 py-3 font-mono text-[11px] text-(--text-dim) hover:text-(--accent-primary) hover:border-(--accent-primary) transition-colors"
							>
								{link.label}
							</Link>
						))}
					</div>
				</div>

				{/* Back to Home */}
				<Link to="/">
					<Button variant="secondary" size="md">
						← BACK TO HOME
					</Button>
				</Link>
			</div>

			{/* Footer */}
			<div className="absolute bottom-8 text-center">
				<div className="font-mono text-[9px] text-(--text-dark)">
					SOLANA STABLECOIN STANDARD © 2024
				</div>
			</div>
		</div>
	);
};

export default NotFound;
