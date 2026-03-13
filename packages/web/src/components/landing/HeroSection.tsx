import { ArrowRight, BookOpen, Github, LogIn } from "lucide-react";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/Button";

export const HeroSection: FC = () => {
	const { isAuthenticated } = useAuth();

	return (
		<section className="py-[120px] pb-20 text-center max-w-[900px] mx-auto px-8">
			<div className="mono label-amber mb-4">
				SOLANA STABLECOIN STANDARD // SSS PROTOCOL v2.5
			</div>
			<h1 className="font-mono text-[72px] font-extralight leading-[1.1] m-0 uppercase">
				DEPLOY COMPLIANT
				<br />
				<span className="glow-text">STABLECOINS</span> ON SOLANA.
			</h1>
			<p className="text-(--text-dim) text-lg max-w-[600px] mx-auto mt-6 leading-relaxed">
				The open-source operator suite for issuing, managing, and auditing
				regulation-ready stablecoins using the Token-2022 program. SSS-1 through
				SSS-3 preset compliance tiers for every use case.
			</p>
			<div className="flex justify-center gap-4 mt-12">
				{!isAuthenticated ? (
					<Link to="/login">
						<Button variant="primary" size="md">
							<span className="flex items-center gap-2">
								<LogIn size={16} />
								ADMIN LOGIN
							</span>
						</Button>
					</Link>
				) : (
					<Link to="/dashboard">
						<Button variant="primary" size="md">
							<span className="flex items-center gap-2">
								LAUNCH DASHBOARD
								<ArrowRight size={16} />
							</span>
						</Button>
					</Link>
				)}
				<Link to="/docs">
					<Button variant="secondary" size="md">
						<span className="flex items-center gap-2">
							VIEW DOCS
							<BookOpen size={16} />
						</span>
					</Button>
				</Link>
				<a
					href="https://github.com/superteam-brazil/solana-stablecoin-standard"
					target="_blank"
					rel="noopener noreferrer"
				>
					<Button variant="ghost" size="md">
						<span className="flex items-center gap-2">
							GITHUB
							<Github size={16} />
						</span>
					</Button>
				</a>
			</div>
		</section>
	);
};
