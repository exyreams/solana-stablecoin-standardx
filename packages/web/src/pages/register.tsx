import { motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [secretToken, setSecretToken] = useState("");
	const [role, setRole] = useState("ADMIN");
	const [loading, setLoading] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await register({ username, password, secretToken, role });
			toast.success("Account created successfully. You can now login.");
			navigate("/login");
		} catch (error: any) {
			toast.error(error.response?.data?.error || "Registration failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
			{/* Background decoration */}
			<div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="w-full max-w-md"
			>
				<div className="bg-panel border border-border shadow-2xl rounded-2xl p-8 backdrop-blur-sm relative z-10">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold glow-text mb-2">Admin Signup</h1>
						<p className="text-text-dim">Initialize your back-office session</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-wider text-text-dark">
								Username
							</label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dark" />
								<input
									type="text"
									required
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="admin_name"
									className="w-full bg-body border border-border rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-wider text-text-dark">
								Password
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dark" />
								<input
									type="password"
									required
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									className="w-full bg-body border border-border rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-wider text-text-dark">
								Account Role
							</label>
							<div className="flex gap-4">
								<button
									type="button"
									onClick={() => setRole("ADMIN")}
									className={`flex-1 py-2 rounded-lg border font-mono text-[10px] transition-all ${
										role === "ADMIN"
											? "bg-primary/20 border-primary text-primary"
											: "border-border text-text-dim hover:border-text-dark"
									}`}
								>
									ADMIN
								</button>
								<button
									type="button"
									onClick={() => setRole("MINTER")}
									className={`flex-1 py-2 rounded-lg border font-mono text-[10px] transition-all ${
										role === "MINTER"
											? "bg-primary/20 border-primary text-primary"
											: "border-border text-text-dim hover:border-text-dark"
									}`}
								>
									MINTER
								</button>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-wider text-text-dark">
								Registration Secret
							</label>
							<div className="relative">
								<ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dark" />
								<input
									type="password"
									required
									value={secretToken}
									onChange={(e) => setSecretToken(e.target.value)}
									placeholder="Master Secret Key"
									className="w-full bg-body border border-border rounded-lg py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
								/>
							</div>
							<p className="text-[10px] text-text-dark italic">
								Found in your backend .env file
							</p>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-primary hover:bg-accent-active text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center transition-all group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
						>
							{loading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								<>
									Register
									<ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
								</>
							)}
						</button>
					</form>

					<p className="mt-8 text-center text-sm text-text-dim">
						Have an account?{" "}
						<Link
							to="/login"
							className="text-primary hover:underline font-bold"
						>
							Sign in
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
}
