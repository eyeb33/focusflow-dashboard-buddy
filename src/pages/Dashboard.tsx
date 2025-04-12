
import React from 'react';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import StatCardsGrid from "@/components/Dashboard/StatCardsGrid";
import ChartsGrid from "@/components/Dashboard/ChartsGrid";
import ProductivityInsights from "@/components/Dashboard/ProductivityInsights";
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />
      
      <main className="flex-1 container px-4 py-6 md:py-10 mb-16 md:mb-0">
        <DashboardHeader />
        <StatCardsGrid />
        <ChartsGrid />
        <ProductivityInsights />
      </main>
      
      <MobileNav />
    </div>
  );
};

export default Dashboard;
