import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { format, subMonths, getDay, getHours } from "date-fns";

interface HeatmapData {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  value: number; // Study minutes
  count: number; // Number of sessions
}

interface StudyHeatmapProps {
  period: 'week' | 'month' | 'all';
}

export const StudyHeatmap = ({ period }: StudyHeatmapProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [maxValue, setMaxValue] = useState(0);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hourLabels = Array.from({ length: 24 }, (_, i) => 
    i === 0 ? '12am' : 
    i === 12 ? '12pm' : 
    i < 12 ? `${i}am` : 
    `${i-12}pm`
  );

  useEffect(() => {
    if (user) {
      fetchHeatmapData();
    }
  }, [user, period]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        // For 'all', we'll go back 3 months as a reasonable limit for the heatmap
        startDate.setMonth(startDate.getMonth() - 3);
      }
      
      // Fetch study sessions
      const { data: sessions, error } = await supabase
        .from('study_sessions')
        .select('duration_minutes, completed_at')
        .eq('user_id', user?.id)
        .gte('completed_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Initialize data structure (7 days x 24 hours)
      const heatmap: HeatmapData[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          heatmap.push({ day, hour, value: 0, count: 0 });
        }
      }
      
      // Process sessions
      let max = 0;
      sessions?.forEach(session => {
        const date = new Date(session.completed_at);
        const day = getDay(date); // 0-6 (Sunday-Saturday)
        const hour = getHours(date); // 0-23
        const minutes = session.duration_minutes;
        
        // Find the corresponding cell in our heatmap
        const index = day * 24 + hour;
        heatmap[index].value += minutes;
        heatmap[index].count += 1;
        
        // Track maximum value for color scaling
        if (heatmap[index].value > max) {
          max = heatmap[index].value;
        }
      });
      
      setHeatmapData(heatmap);
      setMaxValue(max);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate color intensity based on value
  const getColorIntensity = (value: number) => {
    if (value === 0) return 'bg-card border border-border';
    
    // Calculate intensity (0-100%)
    const intensity = Math.min(100, Math.round((value / maxValue) * 100));
    
    // Return tailwind classes with opacity based on intensity
    return `bg-primary hover:bg-primary/90 border border-primary/20`;
  };

  // Calculate opacity based on value (0-100%)
  const getOpacity = (value: number) => {
    if (value === 0) return 0;
    return Math.max(0.15, Math.min(1, value / maxValue));
  };

  const formatTooltip = (data: HeatmapData) => {
    const hours = Math.floor(data.value / 60);
    const minutes = data.value % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    return `${dayNames[data.day]} ${hourLabels[data.hour]}: ${timeStr} (${data.count} session${data.count !== 1 ? 's' : ''})`;
  };

  // Group data by day for rendering
  const dataByDay = dayNames.map((day, dayIndex) => {
    return {
      day,
      dayIndex,
      hours: heatmapData.filter(d => d.day === dayIndex)
    };
  });

  return (
    <Card className="focus-card">
      <CardHeader className="pb-2">
        <CardTitle>Study Time Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Loading heatmap data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Hour labels (top) */}
              <div className="flex mb-1">
                <div className="w-12"></div> {/* Empty space for day labels */}
                {[0, 6, 12, 18, 23].map(hour => (
                  <div key={hour} className="flex-1 text-center text-xs text-muted-foreground">
                    {hourLabels[hour]}
                  </div>
                ))}
              </div>
              
              {/* Heatmap grid */}
              <div className="space-y-1">
                {dataByDay.map(({ day, dayIndex, hours }) => (
                  <div key={dayIndex} className="flex items-center">
                    <div className="w-12 text-xs text-muted-foreground">{day}</div>
                    <div className="flex-1 flex space-x-0.5">
                      {hours.map((cell) => (
                        <div 
                          key={`${cell.day}-${cell.hour}`}
                          className={`h-6 flex-1 rounded-sm cursor-pointer transition-all duration-200`}
                          style={{ 
                            backgroundColor: cell.value > 0 ? 'hsl(var(--primary))' : '',
                            opacity: getOpacity(cell.value),
                            border: cell.value > 0 ? '1px solid rgba(var(--primary), 0.2)' : '1px solid hsl(var(--border))'
                          }}
                          title={formatTooltip(cell)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex items-center justify-end">
                <div className="text-xs text-muted-foreground mr-2">Less</div>
                {[0.2, 0.4, 0.6, 0.8, 1].map((opacity, i) => (
                  <div 
                    key={i}
                    className="h-3 w-5 rounded-sm mr-0.5"
                    style={{ 
                      backgroundColor: 'hsl(var(--primary))',
                      opacity
                    }}
                  />
                ))}
                <div className="text-xs text-muted-foreground ml-1">More</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};