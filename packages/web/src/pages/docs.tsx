import type { FC } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
	DashboardFooter,
	DashboardLayout,
	DashboardSidebar,
	DashboardTopBar,
} from "../components/layout";

const docs = [
	{ id: "overview", title: "Overview", category: "Getting Started" },
	{ id: "quickstart", title: "Quick Start", category: "Getting Started" },
	{ id: "sss1", title: "SSS-1 Minimal", category: "Standards" },
	{ id: "sss2", title: "SSS-2 Compliant", category: "Standards" },
	{ id: "sss3", title: "SSS-3 Private", category: "Standards" },
	{ id: "oracle", title: "Oracle Integration", category: "Standards" },
	{ id: "sdk", title: "TypeScript SDK", category: "Development" },
	{ id: "cli", title: "CLI Reference", category: "Development" },
	{ id: "architecture", title: "Architecture", category: "Advanced" },
	{ id: "operations", title: "Operations Guide", category: "Advanced" },
	{ id: "compliance", title: "Compliance", category: "Advanced" },
];

const Docs: FC = () => {
	const [selectedDoc, setSelectedDoc] = useState("overview");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredDocs = docs.filter(
		(doc) =>
			doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			doc.category.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const categories = Array.from(new Set(docs.map((d) => d.category)));

	return (
		<DashboardLayout>
			<DashboardTopBar />
			<DashboardSidebar />

			<main className="col-start-2 row-start-2 overflow-y-auto flex bg-(--bg-body)">
				{/* Sidebar */}
				<aside className="w-64 bg-(--bg-panel) border-r border-(--border-dim) p-4 flex flex-col gap-4">
					<div className="flex items-center gap-2 mb-2">
						<Link
							to="/"
							className="font-mono text-[10px] text-(--text-dim) hover:text-(--accent-primary)"
						>
							HOME
						</Link>
						<span className="text-(--text-dark)">/</span>
						<span className="font-mono text-[10px] text-(--text-main)">
							DOCS
						</span>
					</div>

					<input
						type="text"
						placeholder="Search docs..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="bg-(--bg-input) border border-(--border-mid) text-(--text-main) px-2 py-2 font-mono text-[11px] outline-none focus:border-(--accent-primary)"
					/>

					<nav className="flex flex-col gap-6">
						{categories.map((category) => (
							<div key={category}>
								<div className="font-mono text-[9px] text-(--text-dark) uppercase tracking-wider mb-2">
									{category}
								</div>
								<div className="flex flex-col gap-1">
									{filteredDocs
										.filter((doc) => doc.category === category)
										.map((doc) => (
											<button
												key={doc.id}
												onClick={() => setSelectedDoc(doc.id)}
												className={`text-left px-2 py-1.5 font-mono text-[11px] ${
													selectedDoc === doc.id
														? "bg-(--accent-primary) text-black font-bold"
														: "text-(--text-dim) hover:text-(--text-main)"
												}`}
											>
												{doc.title}
											</button>
										))}
								</div>
							</div>
						))}
					</nav>
				</aside>

				{/* Content */}
				<div className="flex-1 p-8 max-w-4xl">
					<article className="prose prose-invert">
						<h1 className="font-mono text-3xl font-light tracking-[0.2em] text-(--text-main) mb-8">
							{docs.find((d) => d.id === selectedDoc)?.title.toUpperCase()}
						</h1>

						{selectedDoc === "overview" && (
							<div className="space-y-6 text-(--text-dim) leading-relaxed">
								<p className="text-[14px]">
									Solana Stablecoin Standard (SSS) is an open-source SDK and
									on-chain standards for building stablecoins on Solana,
									developed by Superteam Brazil.
								</p>
								<div className="bg-(--bg-surface) border border-(--border-mid) p-6">
									<h2 className="font-mono text-[12px] text-(--text-main) mb-4">
										STANDARDS
									</h2>
									<ul className="space-y-3 text-[13px]">
										<li>
											<span className="font-mono text-(--accent-primary)">
												SSS-1 (Minimal)
											</span>{" "}
											- Basic stablecoin with mint/freeze/metadata
										</li>
										<li>
											<span className="font-mono text-(--accent-primary)">
												SSS-2 (Compliant)
											</span>{" "}
											- SSS-1 + permanent delegate + transfer hook + blacklist
										</li>
										<li>
											<span className="font-mono text-(--accent-primary)">
												SSS-3 (Private)
											</span>{" "}
											- SSS-1 + confidential transfers
										</li>
									</ul>
								</div>
							</div>
						)}

						{selectedDoc !== "overview" && (
							<div className="bg-(--bg-surface) border border-(--border-mid) p-8 text-center">
								<div className="font-mono text-[11px] text-(--text-dark) mb-4">
									DOCUMENTATION CONTENT
								</div>
								<p className="text-[13px] text-(--text-dim)">
									Full documentation content would be loaded here from markdown
									files.
								</p>
							</div>
						)}
					</article>
				</div>
			</main>

			<DashboardFooter />
		</DashboardLayout>
	);
};

export default Docs;
