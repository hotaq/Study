import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface SubjectData {
  id: string;
  name: string;
  color: string;
  value: number;
  percentage: number;
}

interface SubjectDistributionChartProps {
  period: 'week' | 'month' | 'all';
}

export const SubjectDistributionChart = ({ period }: SubjectDistributionChartProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjectData, setSubjectData] = useState<SubjectData[]>([]);

  useEffect(() => {
    if (user) {
      fetchSubjectDistribution();
    }
  }, [user, period]);

  const fetchSubjectDistribution = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        // For 'all', we'll go back 1 year as a reasonable limit
        startDate.setFullYear(startDate.getFullYear() - 1);
      }
      
      // Fetch study sessions with subject information
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select(`
          duration_minutes,
          subject_id,
          subjects(id, name, color)
        `)
        .eq('user_id', user?.id)
        .gte('completed_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Process data to aggregate by subject
      const subjectMap = new Map<string, SubjectData>();
      let totalMinutes = 0;
      
      sessions?.forEach(session => {
        if (!session.subject_id || !session.subjects) return;
        
        const subject = session.subjects;
        const subjectId = subject.id;
        const minutes = session.duration_minutes;
        totalMinutes += minutes;
        
        if (subjectMap.has(subjectId)) {
          const existing = subjectMap.get(subjectId)!;
          existing.value += minutes;
        } else {
          subjectMap.set(subjectId, {
            id: subjectId,
            name: subject.name,
            color: subject.color,
            value: minutes,
            percentage: 0 // Will calculate after
          });
        }
      });
      
      // Calculate percentages
      const result = Array.from(subjectMap.values()).map(subject => ({
        ...subject,
        percentage: totalMinutes > 0 ? Math.round((subject.value / totalMinutes) * 100) : 0
      }));
      
      // Sort by value (highest first)
      result.sort((a, b) => b.value - a.value);
      
      setSubjectData(result);
    } catch (error) {
      console.error('Error fetching subject distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{formatTime(data.value)}</p>
          <p className="text-sm">{data.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="focus-card">
      <CardHeader className="pb-2">
        <CardTitle>Subject Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : subjectData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subjectData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  labelLine={false}
                >
                  {subjectData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">No data available for this period</p>
          </div>
        )}
        
        {subjectData.length > 0 && (
          <div className="mt-4 space-y-2">
            {subjectData.map((subject) => (
              <div key={subject.id} className="flex justify-between items-center">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-sm">{subject.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatTime(subject.value)} ({subject.percentage}%)
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};