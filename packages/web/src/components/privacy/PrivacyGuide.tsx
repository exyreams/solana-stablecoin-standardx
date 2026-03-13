import { ChevronUp } from "lucide-react";
import type { FC } from "react";

export const PrivacyGuide: FC = () => {
	return (
		<div className="bg-(--bg-panel) border border-(--border-mid)">
			<div className="border-b border-(--border-dim) p-4 flex justify-between items-center bg-gradient-to-r from-(--bg-surface) to-transparent">
				<span className="text-[10px] uppercase text-(--text-dim) font-semibold tracking-wider">
					Confidential Transfer Guide
				</span>
				<ChevronUp className="w-4 h-4 text-(--text-dark) cursor-pointer" />
			</div>

			<div className="p-4">
				<div className="bg-[rgba(59,130,246,0.1)] border-l-2 border-[#3b82f6] p-3 text-[#3b82f6] font-mono text-[10px] tracking-wider mb-4">
					CONFIDENTIAL TRANSFERS USE ZK-PROOF CRYPTOGRAPHY — NO BALANCE DATA IS
					REVEALED ON-CHAIN
				</div>

				<div className="grid grid-cols-3 gap-4">
					<div className="bg-(--bg-input) border border-(--border-dim) p-4">
						<h4 className="text-[11px] text-(--text-main) mb-3 flex items-center gap-2">
							HOW IT WORKS
						</h4>
						<ul className="pl-4 space-y-2">
							<li className="text-[11px] text-(--text-dim)">
								Zero-knowledge proof validation ensures tx validity without data
								exposure
							</li>
							<li className="text-[11px] text-(--text-dim)">
								Balances encrypted on-chain using ElGamal encryption
							</li>
							<li className="text-[11px] text-(--text-dim)">
								Only account owner can decrypt their balance
							</li>
						</ul>
					</div>

					<div className="bg-(--bg-input) border border-(--border-dim) p-4">
						<h4 className="text-[11px] text-(--text-main) mb-3">
							SETUP INSTRUCTIONS
						</h4>
						<ul className="pl-4 space-y-2">
							<li className="text-[11px] text-(--text-dim)">
								1. Approve account for confidential transfers
							</li>
							<li className="text-[11px] text-(--text-dim)">
								2. Enable confidential credits (owner only)
							</li>
							<li className="text-[11px] text-(--text-dim)">
								3. Account can now receive encrypted transfers
							</li>
						</ul>
					</div>

					<div className="bg-(--bg-input) border border-(--border-dim) p-4">
						<h4 className="text-[11px] text-(--text-main) mb-3">
							SECURITY CONSIDERATIONS
						</h4>
						<ul className="pl-4 space-y-2">
							<li className="text-[11px] text-(--text-dim)">
								Experimental feature — use with caution
							</li>
							<li className="text-[11px] text-(--text-dim)">
								Requires client-side ZK proof generation
							</li>
							<li className="text-[11px] text-(--text-dim)">
								Not compatible with all wallet implementations
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};
