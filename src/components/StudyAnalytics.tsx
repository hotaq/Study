import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Clock, Target, Award } from "lucide-react";

interface AnalyticsData {
  week: { name: string; hours: number }[];
  month: { name: string; hours: number }[];
  year: { name: string; hours: number }[];
}

const mockData: AnalyticsData = {
  week: [
    { name: "Mon", hours: 2.5 },
    { name: "Tue", hours: 3.2 },
    { name: "Wed", hours: 1.8 },
    { name: "Thu", hours: 4.1 },
    { name: "Fri", hours: 2.9 },
    { name: "Sat", hours: 3.7 },
    { name: "Sun", hours: 2.1 }
  ],
  month: [
    { name: "Week 1", hours: 18.5 },
    { name: "Week 2", hours: 22.3 },
    { name: "Week 3", hours: 19.8 },
    { name: "Week 4", hours: 25.1 }
  ],
  year: [
    { name: "Jan", hours: 78 },
    { name: "Feb", hours: 85 },
    { name: "Mar", hours: 92 },
    { name: "Apr", hours: 88 },
    { name: "May", hours: 95 },
    { name: "Jun", hours: 102 }
  ]
};

export const StudyAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<keyof AnalyticsData>("week");
  
  const currentData = mockData[selectedPeriod];
  const totalHours = currentData.reduce((sum, item) => sum + item.hours, 0);
  const avgHours = totalHours / currentData.length;
  const bestDay = currentData.reduce((best, current) => 
    current.hours > best.hours ? current : best
  );

  const stats = [
    {
      icon: Clock,
      label: "Total Hours",
      value: `${totalHours.toFixed(1)}h`,
      color: "text-primary"
    },
    {
      icon: TrendingUp,
      label: "Average/Day",
      value: `${avgHours.toFixed(1)}h`,
      color: "text-focus"
    },
    {
      icon: Target,
      label: "Best Day",
      value: `${bestDay.hours.toFixed(1)}h`,
      color: "text-secondary"
    },
    {
      icon: Award,
      label: "Streak",
      value: "5 days",
      color: "text-success"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="focus-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Study Analytics</h2>
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as keyof AnalyticsData)}>
            <TabsList className="bg-muted">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-muted/30 rounded-lg">
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {selectedPeriod === "year" ? (
              <LineChart data={currentData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            ) : (
              <BarChart data={currentData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="url(#gradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--focus))" />
                  </linearGradient>
                </defs>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};