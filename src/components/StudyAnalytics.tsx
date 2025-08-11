import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import { TrendingUp, Clock, Target, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, subDays, subMonths, subYears, startOfMonth, endOfMonth, eachWeekOfInterval, getMonth, getYear } from "date-fns";

interface StudySession {
  id: string;
  user_id: string;
  room_id: string;
  duration_minutes: number;
  completed_at: string;
}

interface ChartData {
  name: string;
  hours: number;
}

interface AnalyticsData {
  week: ChartData[];
  month: ChartData[];
  year: ChartData[];
}

interface StudyAnalyticsProps {
  subject_id?: string;
}

export const StudyAnalytics = ({ subject_id }: StudyAnalyticsProps) => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<keyof AnalyticsData>("week");
  const [loading, setLoading] = useState(true);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    week: [],
    month: [],
    year: []
  });
  const [streak, setStreak] = useState(0);
  
  useEffect(() => {
    if (user) {
      fetchStudySessions();
    }
  }, [user, subject_id]);
  
  useEffect(() => {
    if (studySessions.length > 0) {
      generateChartData();
      calculateStreak();
    }
  }, [studySessions]);
  
  const fetchStudySessions = async () => {
    try {
      setLoading(true);
      
      // Get sessions from the past year
      const oneYearAgo = subYears(new Date(), 1);
      
      let query = supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('completed_at', oneYearAgo.toISOString());
      
      // Filter by subject if provided
      if (subject_id) {
        query = query.eq('subject_id', subject_id);
      }
      
      query = query.order('completed_at', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setStudySessions(data || []);
    } catch (error) {
      console.error('Error fetching study sessions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const generateChartData = () => {
    // Generate weekly data (last 7 days)
    const today = new Date();
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dayName = format(date, 'EEE');
      
      // Find sessions for this day
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayHours = studySessions
        .filter(session => {
          const sessionDate = new Date(session.completed_at);
          return sessionDate >= dayStart && sessionDate <= dayEnd;
        })
        .reduce((sum, session) => sum + (session.duration_minutes / 60), 0);
      
      return { name: dayName, hours: parseFloat(dayHours.toFixed(1)) };
    });
    
    // Generate monthly data (last 4 weeks)
    const monthData = Array.from({ length: 4 }, (_, i) => {
      const weekEnd = subDays(today, i * 7);
      const weekStart = subDays(weekEnd, 6);
      const weekName = `Week ${4 - i}`;
      
      const weekHours = studySessions
        .filter(session => {
          const sessionDate = new Date(session.completed_at);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        })
        .reduce((sum, session) => sum + (session.duration_minutes / 60), 0);
      
      return { name: weekName, hours: parseFloat(weekHours.toFixed(1)) };
    }).reverse();
    
    // Generate yearly data (last 12 months)
    const yearData = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(today, 11 - i);
      const monthName = format(date, 'MMM');
      
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const monthHours = studySessions
        .filter(session => {
          const sessionDate = new Date(session.completed_at);
          return sessionDate >= monthStart && sessionDate <= monthEnd;
        })
        .reduce((sum, session) => sum + (session.duration_minutes / 60), 0);
      
      return { name: monthName, hours: parseFloat(monthHours.toFixed(1)) };
    });
    
    setAnalyticsData({
      week: weekData,
      month: monthData,
      year: yearData
    });
  };
  
  const calculateStreak = () => {
    if (studySessions.length === 0) {
      setStreak(0);
      return;
    }
    
    // Sort sessions by date (newest first)
    const sortedSessions = [...studySessions].sort((a, b) => 
      new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
    );
    
    // Check if there's a session today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const mostRecentDate = new Date(sortedSessions[0].completed_at);
    mostRecentDate.setHours(0, 0, 0, 0);
    
    // If most recent session is not today or yesterday, streak is 0
    if ((today.getTime() - mostRecentDate.getTime()) > 86400000 * 2) {
      setStreak(0);
      return;
    }
    
    // Count consecutive days with sessions
    let currentStreak = 1;
    let currentDate = mostRecentDate;
    
    for (let i = 1; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].completed_at);
      sessionDate.setHours(0, 0, 0, 0);
      
      // Check if this session is from the previous day
      const expectedPrevDay = new Date(currentDate);
      expectedPrevDay.setDate(expectedPrevDay.getDate() - 1);
      
      if (sessionDate.getTime() === expectedPrevDay.getTime()) {
        currentStreak++;
        currentDate = sessionDate;
      } else if (sessionDate.getTime() < expectedPrevDay.getTime()) {
        // We found a gap, stop counting
        break;
      }
    }
    
    setStreak(currentStreak);
  };
  
  const currentData = analyticsData[selectedPeriod];
  const totalHours = currentData.reduce((sum, item) => sum + item.hours, 0);
  const avgHours = currentData.length > 0 ? totalHours / currentData.length : 0;
  const bestDay = currentData.length > 0 ? 
    currentData.reduce((best, current) => current.hours > best.hours ? current : best, { name: '', hours: 0 }) : 
    { name: '', hours: 0 };

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
      value: `${streak} days`,
      color: "text-success"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="focus-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Study Analytics</h2>
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as keyof AnalyticsData)}>
            <TabsList className="enhanced-tabs">
              <TabsTrigger value="week" className="enhanced-tab">Week</TabsTrigger>
              <TabsTrigger value="month" className="enhanced-tab">Month</TabsTrigger>
              <TabsTrigger value="year" className="enhanced-tab">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-focus to-secondary opacity-70"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
              <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="h-64">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          ) : currentData.length > 0 ? (
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
                  <Tooltip 
                    formatter={(value) => [`${value} hours`, 'Study Time']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))' 
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
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
                  <Tooltip 
                    formatter={(value) => [`${value} hours`, 'Study Time']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))' 
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
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
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">No data available for this period</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};