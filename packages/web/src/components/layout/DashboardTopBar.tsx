import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTokens } from "../../contexts/TokenContext";
import { Badge, TokenIcon } from "../ui";

export const DashboardTopBar: FC = () => {
	const { user, logout } = useAuth();
	const { tokens, selectedToken, setSelectedToken } = useTokens();
	const [showDropdown, setShowDropdown] = useState(false);
	const [showTokenDropdown, setShowTokenDropdown] = useState(false);
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<header className="col-span-2 border-b border-[#222222] flex items-center justify-between px-4 bg-[#080808] z-10">
			<div className="flex items-center gap-2 font-bold font-mono">
				<Link
					to="/"
					className="flex items-center gap-2 hover:opacity-80 transition-opacity"
				>
					<img src="/logo.svg" alt="SSS Logo" className="h-6 w-auto" />
					<span className="text-[#CCA352]">SSS MANAGER</span>
				</Link>
			</div>
			<div className="flex gap-6 items-center">
				<div className="relative">
					<div
						onClick={() => setShowTokenDropdown(!showTokenDropdown)}
						className="bg-[#0f0f0f] border border-[#333333] px-3 py-1 flex items-center gap-3 cursor-pointer hover:border-[#CCA352] transition-colors"
					>
						<div className="flex items-center gap-2">
							{selectedToken && (
								<TokenIcon
									symbol={selectedToken.symbol}
									logoUri={selectedToken.onChain?.uri || selectedToken.uri}
									size="sm"
								/>
							)}
							<span className="font-mono text-xs">
								{selectedToken ? `${selectedToken.symbol}-SOL` : "SELECT TOKEN"}
							</span>
							{selectedToken && (
								<Badge variant="accent" className="text-[8px] uppercase">
									{selectedToken.preset}
								</Badge>
							)}
						</div>
						<span className="text-[#444444] text-[10px]">▼</span>
					</div>

					{showTokenDropdown && (
						<>
							<div
								className="fixed inset-0 z-10"
								onClick={() => setShowTokenDropdown(false)}
							/>
							<div className="absolute left-0 top-full mt-2 bg-[#0f0f0f] border border-[#333333] min-w-[220px] z-20 shadow-xl rounded-sm py-1 overflow-hidden">
								{tokens.length === 0 ? (
									<div className="px-4 py-2 font-mono text-[10px] text-[#777777]">
										NO TOKENS FOUND
									</div>
								) : (
									tokens.map((token) => (
										<button
											key={token.id}
											onClick={() => {
												setSelectedToken(token);
												setShowTokenDropdown(false);
											}}
											className={`w-full px-4 py-2.5 text-left font-mono text-[11px] hover:bg-primary/10 transition-colors flex items-center justify-between group ${
												selectedToken?.id === token.id
													? "text-primary bg-primary/5 border-l-2 border-primary"
													: "text-[#EAEAEA] border-l-2 border-transparent"
											}`}
										>
											<div className="flex items-center gap-2.5">
												<TokenIcon
													symbol={token.symbol}
													logoUri={token.onChain?.uri || token.uri}
													size="sm"
												/>
												<div className="flex flex-col">
													<span className="font-bold">{token.symbol}-SOL</span>
													<span className="text-[9px] text-(--text-dim)">
														{token.name}
													</span>
												</div>
											</div>
											<Badge
												variant="accent"
												className="text-[7px] uppercase opacity-70 group-hover:opacity-100"
											>
												{token.preset}
											</Badge>
										</button>
									))
								)}

								<div className="h-[1px] bg-border mx-2 my-1" />
								<button
									onClick={() => {
										navigate("/create");
										setShowTokenDropdown(false);
									}}
									className="w-full px-4 py-2 text-left font-mono text-[10px] text-primary hover:bg-primary/5 transition-colors"
								>
									+ CREATE NEW TOKEN
								</button>
							</div>
						</>
					)}
				</div>
				<div className="font-mono text-[10px] text-[#777777]">
					NET <span className="text-[#FFD700]">DEVNET</span>
				</div>

				<div className="wallet-adapter-wrapper">
					<WalletMultiButton className="!bg-[#111111] !border !border-[#333333] !font-mono !text-[11px] !h-8 hover:!border-primary !transition-colors" />
				</div>

				<div className="relative">
					<button
						onClick={() => setShowDropdown(!showDropdown)}
						className="bg-[#CCA352] text-[#0a0a0a] px-4 py-1.5 font-mono text-[11px] font-semibold hover:bg-[#d4b366] transition-colors flex items-center gap-2"
					>
						<UserIcon className="w-3.5 h-3.5" />
						{user?.username || "USER"}
						<ChevronDown className="w-3 h-3" />
					</button>

					{showDropdown && (
						<>
							<div
								className="fixed inset-0 z-10"
								onClick={() => setShowDropdown(false)}
							/>
							<div className="absolute right-0 top-full mt-2 bg-[#0f0f0f] border border-[#333333] min-w-[200px] z-20 shadow-xl rounded-sm py-1 overflow-hidden">
								<div className="px-4 py-2.5 font-mono text-[11px] text-[#777777] uppercase border-b border-[#222222] mb-1">
									Account
								</div>
								<div className="h-[1px] bg-border mx-2 my-1" />
								<button
									onClick={handleLogout}
									className="w-full px-4 py-2.5 text-left font-mono text-[11px] text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
								>
									<LogOut className="w-3 h-3" />
									Sign Out
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</header>
	);
};
