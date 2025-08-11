import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isWithinInterval } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { Clock, Calendar, Users, BookOpen } from "lucide-react";

interface StudySession {
  id: string;
  user_id: string;
  room_id: string;
  subject_id: string | null;
  duration_minutes: number;
  completed_at: string;
  room_name?: string;
  subject_name?: string;
}

interface TimeDistribution {
  hour: number;
  minutes: number;
  percentage: number;
}

interface DayDistribution {
  day: string;
  minutes: number;
  percentage: number;
}

interface RoomDistribution {
  room_name: string;
  minutes: number;
  percentage: number;
}

interface SessionStatisticsProps {
  selectedSubject?: string | null;
}

export const SessionStatistics = ({ selectedSubject }: SessionStatisticsProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [timeDistribution, setTimeDistribution] = useState<TimeDistribution[]>([]);
  const [dayDistribution, setDayDistribution] = useState<DayDistribution[]>([]);
  const [roomDistribution, setRoomDistribution] = useState<RoomDistribution[]>([]);
  const [activeTab, setActiveTab] = useState("time");
  
  // Colors for charts
  const COLORS = [
    "#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c", 
    "#d0ed57", "#ffc658", "#ff8042", "#ff6361", "#bc5090"
  ];

  useEffect(() => {
    if (user) {
      fetchStudySessions();
    }
  }, [user, selectedSubject]);

  const fetchStudySessions = async () => {
    try {
      setLoading(true);
      
      // Get date range (last 3 months)
      const endDate = new Date();
      const startDate = subMonths(endDate, 3);
      
      // Build query
      let query = supabase
        .from('study_sessions')
        .select(`
          id,
          user_id,
          room_id,
          subject_id,
          duration_minutes,
          completed_at,
          rooms(name),
          subjects(name)
        `)
        .eq('user_id', user?.id)
        .gte('completed_at', startDate.toISOString())
        .lte('completed_at', endDate.toISOString())
        .order('completed_at', { ascending: false });
      
      // Add subject filter if selected
      if (selectedSubject) {
        query = query.eq('subject_id', selectedSubject);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format the data
      const formattedSessions = data?.map(session => ({
        id: session.id,
        user_id: session.user_id,
        room_id: session.room_id,
        subject_id: session.subject_id,
        duration_minutes: session.duration_minutes,
        completed_at: session.completed_at,
        room_name: session.rooms?.name || 'Unknown Room',
        subject_name: session.subjects?.name || 'No Subject'
      })) || [];
      
      setStudySessions(formattedSessions);
      
      // Generate distributions
      generateTimeDistribution(formattedSessions);
      generateDayDistribution(formattedSessions);
      generateRoomDistribution(formattedSessions);
    } catch (error) {
      console.error('Error fetching study sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeDistribution = (sessions: StudySession[]) => {
    // Initialize hours array (0-23)
    const hourlyData: { [key: number]: number } = {};
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = 0;
    }
    
    // Sum up minutes by hour
    sessions.forEach(session => {
      const date = parseISO(session.completed_at);
      const hour = date.getHours();
      hourlyData[hour] += session.duration_minutes;
    });
    
    // Calculate total minutes
    const totalMinutes = Object.values(hourlyData).reduce((sum, minutes) => sum + minutes, 0);
    
    // Format data for chart
    const distribution = Object.entries(hourlyData).map(([hour, minutes]) => ({
      hour: parseInt(hour),
      minutes,
      percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0
    }));
    
    setTimeDistribution(distribution);
  };

  const generateDayDistribution = (sessions: StudySession[]) => {
    // Initialize days array
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayData: { [key: string]: number } = {};
    days.forEach(day => {
      dayData[day] = 0;
    });
    
    // Sum up minutes by day
    sessions.forEach(session => {
      const date = parseISO(session.completed_at);
      const day = days[date.getDay()];
      dayData[day] += session.duration_minutes;
    });
    
    // Calculate total minutes
    const totalMinutes = Object.values(dayData).reduce((sum, minutes) => sum + minutes, 0);
    
    // Format data for chart
    const distribution = Object.entries(dayData).map(([day, minutes]) => ({
      day,
      minutes,
      percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0
    }));
    
    // Reorder to start with Monday
    const mondayIndex = days.indexOf('Monday');
    const reorderedDistribution = [
      ...distribution.slice(mondayIndex),
      ...distribution.slice(0, mondayIndex)
    ];
    
    setDayDistribution(reorderedDistribution);
  };

  const generateRoomDistribution = (sessions: StudySession[]) => {
    // Group by room
    const roomData: { [key: string]: number } = {};
    
    sessions.forEach(session => {
      const roomName = session.room_name || 'Unknown Room';
      if (!roomData[roomName]) {
        roomData[roomName] = 0;
      }
      roomData[roomName] += session.duration_minutes;
    });
    
    // Calculate total minutes
    const totalMinutes = Object.values(roomData).reduce((sum, minutes) => sum + minutes, 0);
    
    // Format data for chart
    const distribution = Object.entries(roomData)
      .map(([room_name, minutes]) => ({
        room_name,
        minutes,
        percentage: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0
      }))
      .sort((a, b) => b.minutes - a.minutes) // Sort by minutes (descending)
      .slice(0, 10); // Limit to top 10 rooms
    
    setRoomDistribution(distribution);
  };

  const formatHour = (hour: number) => {
    return format(new Date().setHours(hour, 0, 0, 0), 'h a');
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      if (activeTab === "time") {
        return (
          <div className="bg-background border border-border p-2 rounded-md shadow-md">
            <p className="font-medium">{formatHour(data.hour)}</p>
            <p className="text-sm">{formatMinutes(data.minutes)}</p>
            <p className="text-xs text-muted-foreground">{data.percentage}% of total time</p>
          </div>
        );
      } else if (activeTab === "day") {
        return (
          <div className="bg-background border border-border p-2 rounded-md shadow-md">
            <p className="font-medium">{data.day}</p>
            <p className="text-sm">{formatMinutes(data.minutes)}</p>
            <p className="text-xs text-muted-foreground">{data.percentage}% of total time</p>
          </div>
        );
      } else if (activeTab === "room") {
        return (
          <div className="bg-background border border-border p-2 rounded-md shadow-md">
            <p className="font-medium">{data.room_name}</p>
            <p className="text-sm">{formatMinutes(data.minutes)}</p>
            <p className="text-xs text-muted-foreground">{data.percentage}% of total time</p>
          </div>
        );
      }
    }
    return null;
  };

  const renderTimeDistributionChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={timeDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis 
            dataKey="hour" 
            tickFormatter={formatHour}
            interval={2} // Show every 3rd hour
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="minutes" name="Study Time">
            {timeDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderDayDistributionChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dayDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis 
            dataKey="day" 
            tickFormatter={(value) => value.substring(0, 3)} // Show first 3 letters of day
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="minutes" name="Study Time">
            {dayDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderRoomDistributionChart = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <Pie
            data={roomDistribution}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="minutes"
            nameKey="room_name"
            label={({ room_name, percentage }) => `${room_name}: ${percentage}%`}
          >
            {roomDistribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        ) : studySessions.length > 0 ? (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="time" className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Time of Day
                </TabsTrigger>
                <TabsTrigger value="day" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Day of Week
                </TabsTrigger>
                <TabsTrigger value="room" className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Study Rooms
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="time" className="pt-4">
                <h3 className="text-sm font-medium mb-2">When do you study most?</h3>
                {renderTimeDistributionChart()}
                <p className="text-sm text-muted-foreground mt-4">
                  Your most productive hour is {formatHour(timeDistribution.sort((a, b) => b.minutes - a.minutes)[0]?.hour || 0)},
                  with {formatMinutes(timeDistribution.sort((a, b) => b.minutes - a.minutes)[0]?.minutes || 0)} of study time.
                </p>
              </TabsContent>
              
              <TabsContent value="day" className="pt-4">
                <h3 className="text-sm font-medium mb-2">Which days do you study most?</h3>
                {renderDayDistributionChart()}
                <p className="text-sm text-muted-foreground mt-4">
                  Your most productive day is {dayDistribution.sort((a, b) => b.minutes - a.minutes)[0]?.day || 'Monday'},
                  with {formatMinutes(dayDistribution.sort((a, b) => b.minutes - a.minutes)[0]?.minutes || 0)} of study time.
                </p>
              </TabsContent>
              
              <TabsContent value="room" className="pt-4">
                <h3 className="text-sm font-medium mb-2">Which rooms do you use most?</h3>
                {renderRoomDistributionChart()}
                <p className="text-sm text-muted-foreground mt-4">
                  Your most used room is {roomDistribution[0]?.room_name || 'None'},
                  with {formatMinutes(roomDistribution[0]?.minutes || 0)} of study time ({roomDistribution[0]?.percentage || 0}%).
                </p>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No study data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};