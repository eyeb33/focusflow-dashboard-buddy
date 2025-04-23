
import React from "react";
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <div className="flex-1 container max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <DashboardHeader />
      </div>
      {children}
    </div>
    <MobileNav />
  </div>
);

export default DashboardLayout;
