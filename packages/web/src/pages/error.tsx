import type { FC } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

const ErrorPage: FC = () => {
	const errorDetails = {
		code: "TRANSACTION_FAILED",
		message: "Failed to execute transaction on Solana network",
		timestamp: new Date().toISOString(),
		txSignature: "4fGx...99Km",
	};

	const suggestedActions = [
		"Check your wallet connection and network status",
		"Verify you have sufficient SOL for transaction fees",
		"Try refreshing the page and attempting the action again",
		"Contact support if the issue persists",
	];

	return (
		<div className="min-h-screen bg-(--bg-body) flex flex-col items-center justify-center p-8">
			<div className="max-w-3xl w-full">
				{/* Error Icon */}
				<div className="flex justify-center mb-6">
					<div className="w-20 h-20 border-2 border-red-500 rounded-full flex items-center justify-center text-red-500 text-4xl">
						✕
					</div>
				</div>

				{/* Error Title */}
				<h1 className="font-mono text-3xl font-light tracking-[0.2em] text-(--text-main) text-center mb-4">
					SOMETHING WENT WRONG
				</h1>
				<p className="text-[14px] text-(--text-dim) text-center mb-12 leading-relaxed">
					An unexpected error occurred while processing your request.
					<br />
					Please review the details below and try again.
				</p>

				{/* Error Details */}
				<div className="bg-(--bg-surface) border border-(--border-mid) mb-8">
					<div className="px-6 py-4 border-b border-(--border-mid) flex justify-between items-center">
						<div className="font-mono text-[11px] text-(--text-dark) uppercase">
							ERROR DETAILS
						</div>
						<Badge variant="danger">FAILED</Badge>
					</div>
					<div className="p-6 space-y-4">
						<div className="grid grid-cols-[140px_1fr] gap-4">
							<div className="font-mono text-[10px] text-(--text-dark) uppercase">
								Error Code
							</div>
							<div className="font-mono text-[12px] text-(--text-main)">
								{errorDetails.code}
							</div>
						</div>
						<div className="grid grid-cols-[140px_1fr] gap-4">
							<div className="font-mono text-[10px] text-(--text-dark) uppercase">
								Message
							</div>
							<div className="text-[12px] text-(--text-dim)">
								{errorDetails.message}
							</div>
						</div>
						<div className="grid grid-cols-[140px_1fr] gap-4">
							<div className="font-mono text-[10px] text-(--text-dark) uppercase">
								Timestamp
							</div>
							<div className="font-mono text-[11px] text-(--text-dim)">
								{errorDetails.timestamp}
							</div>
						</div>
						<div className="grid grid-cols-[140px_1fr] gap-4">
							<div className="font-mono text-[10px] text-(--text-dark) uppercase">
								TX Signature
							</div>
							<div className="font-mono text-[11px] text-(--text-dim)">
								{errorDetails.txSignature}
							</div>
						</div>
					</div>
				</div>

				{/* Suggested Actions */}
				<div className="bg-(--bg-surface) border border-(--border-mid) mb-8">
					<div className="px-6 py-4 border-b border-(--border-mid)">
						<div className="font-mono text-[11px] text-(--text-dark) uppercase">
							SUGGESTED ACTIONS
						</div>
					</div>
					<div className="p-6">
						<ul className="space-y-3">
							{suggestedActions.map((action, index) => (
								<li
									key={index}
									className="flex gap-3 text-[13px] text-(--text-dim)"
								>
									<span className="font-mono text-(--accent-primary)">
										{index + 1}.
									</span>
									<span>{action}</span>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Actions */}
				<div className="flex gap-4 justify-center">
					<Button
						variant="secondary"
						size="md"
						onClick={() => window.location.reload()}
					>
						↻ RETRY
					</Button>
					<Link to="/dashboard">
						<Button variant="primary" size="md">
							GO TO DASHBOARD
						</Button>
					</Link>
				</div>

				{/* Support Link */}
				<div className="text-center mt-8">
					<a
						href="https://github.com/superteam-brazil/solana-stablecoin-standard"
						target="_blank"
						rel="noopener noreferrer"
						className="font-mono text-[11px] text-(--text-dark) hover:text-(--accent-primary)"
					>
						REPORT ISSUE ON GITHUB →
					</a>
				</div>
			</div>
		</div>
	);
};

export default ErrorPage;
