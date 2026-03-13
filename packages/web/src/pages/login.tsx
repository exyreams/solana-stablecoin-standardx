import { motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			await login({ username, password });
			toast.success("Login successful");
			navigate("/dashboard");
		} catch (error: any) {
			toast.error(error.response?.data?.error || "Invalid credentials");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
			{/* Background decoration */}
			<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
			<div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="w-full max-w-md"
			>
				<div className="bg-panel border border-border shadow-2xl rounded-2xl p-8 backdrop-blur-sm relative z-10">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold glow-text mb-2">Welcome Back</h1>
						<p className="text-text-dim">Admin authentication required</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
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
									placeholder="Enter your username"
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

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-primary hover:bg-accent-active text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								<>
									Login
									<ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
								</>
							)}
						</button>
					</form>

					<p className="mt-8 text-center text-sm text-text-dim">
						Need to register?{" "}
						<Link
							to="/register"
							className="text-primary hover:underline font-bold"
						>
							Create account
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
}
