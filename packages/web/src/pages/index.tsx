import type { FC } from "react";
import {
	FeatureHighlights,
	Footer,
	HeroSection,
	IntegrationsSection,
	StandardsSection,
	StatsTicker,
} from "../components/landing";
import { Navbar } from "../components/layout/Navbar";

export const LandingPage: FC = () => {
	return (
		<div className="min-h-screen">
			<Navbar />
			<main>
				<HeroSection />
				<StatsTicker />
				<StandardsSection />
				<FeatureHighlights />
				<IntegrationsSection />
			</main>
			<Footer />
		</div>
	);
};
