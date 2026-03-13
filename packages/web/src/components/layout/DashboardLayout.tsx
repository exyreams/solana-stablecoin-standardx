import type { FC, ReactNode } from "react";

interface DashboardLayoutProps {
	children: ReactNode;
}

export const DashboardLayout: FC<DashboardLayoutProps> = ({ children }) => {
	return (
		<div className="grid grid-cols-[240px_1fr] grid-rows-[48px_1fr_32px] h-screen w-screen">
			{children}
		</div>
	);
};
