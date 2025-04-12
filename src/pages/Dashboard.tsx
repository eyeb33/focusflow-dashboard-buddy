
import React from 'react';
import Header from "@/components/Layout/Header";
import MobileNav from "@/components/Layout/MobileNav";
import StatCard from "@/components/Dashboard/StatCard";
import StreakCalendar from "@/components/Dashboard/StreakCalendar";
import ProductivityChart from "@/components/Dashboard/ProductivityChart";
import { Clock, Flame, Target, Zap } from "lucide-react";
import { useNavigate } from 'react-router-dom';

// Mock data for demonstration purposes
const mockStreakData = Array.from({ length: 28 }, (_, i) => ({
  date: new Date(Date.now() - (27 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  completed: Math.floor(Math.random() * 10) // Random completion between 0-10
}));

const mockDailyData = [
  { name: '8AM', minutes: 25 },
  { name: '10AM', minutes: 50 },
  { name: '12PM', minutes: 25 },
  { name: '2PM', minutes: 75 },
  { name: '4PM', minutes: 50 },
  { name: '6PM', minutes: 25 },
];

const mockWeeklyData = [
  { name: 'Mon', sessions: 5, minutes: 125 },
  { name: 'Tue', sessions: 7, minutes: 175 },
  { name: 'Wed', sessions: 4, minutes: 100 },
  { name: 'Thu', sessions: 8, minutes: 200 },
  { name: 'Fri', sessions: 6, minutes: 150 },
  { name: 'Sat', sessions: 3, minutes: 75 },
  { name: 'Sun', sessions: 2, minutes: 50 },
];

const mockMonthlyData = [
  { name: 'Week 1', sessions: 20 },
  { name: 'Week 2', sessions: 35 },
  { name: 'Week 3', sessions: 25 },
  { name: 'Week 4', sessions: 30 },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} />
      
      <main className="flex-1 container px-4 py-6 md:py-10 mb-16 md:mb-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your focus sessions and productivity insights
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            title="Today's Focus"
            value="125 min"
            icon={<Clock className="h-4 w-4" />}
            trend={{ value: 15, isPositive: true }}
          />
          <StatCard
            title="Current Streak"
            value="7 days"
            icon={<Flame className="h-4 w-4" />}
            trend={{ value: 40, isPositive: true }}
          />
          <StatCard
            title="Completion Rate"
            value="85%"
            icon={<Target className="h-4 w-4" />}
            trend={{ value: 5, isPositive: false }}
          />
          <StatCard
            title="Weekly Sessions"
            value="32"
            icon={<Zap className="h-4 w-4" />}
            description="Total focus sessions this week"
          />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <ProductivityChart 
              dailyData={mockDailyData}
              weeklyData={mockWeeklyData}
              monthlyData={mockMonthlyData}
              bestHour="2:00 PM - 4:00 PM"
            />
          </div>
          <div>
            <StreakCalendar 
              data={mockStreakData}
              currentStreak={7}
              bestStreak={12}
            />
          </div>
        </div>
        
        <div className="bg-muted/40 rounded-lg p-6 border">
          <h2 className="text-lg font-medium mb-4">Productivity Insights</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-md p-4 border">
              <h3 className="font-medium mb-2">Best Focus Time</h3>
              <p className="text-muted-foreground text-sm">
                Your most productive hours are between <span className="text-pomodoro-work font-medium">2:00 PM - 4:00 PM</span>. 
                Consider scheduling your most important tasks during this time frame.
              </p>
            </div>
            <div className="bg-white rounded-md p-4 border">
              <h3 className="font-medium mb-2">Session Length Analysis</h3>
              <p className="text-muted-foreground text-sm">
                You complete the most tasks when working in <span className="text-pomodoro-work font-medium">25-minute</span> focused sessions 
                followed by <span className="text-pomodoro-work font-medium">5-minute</span> breaks.
              </p>
            </div>
            <div className="bg-white rounded-md p-4 border">
              <h3 className="font-medium mb-2">Productivity Trend</h3>
              <p className="text-muted-foreground text-sm">
                Your focus time has <span className="text-green-500 font-medium">increased by 15%</span> compared to last week. 
                Keep up the great work!
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
};

export default Dashboard;
