import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { subDays, subMonths, format, differenceInDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";

interface ProductivityScoreProps {
  period: 'week' | 'month' | 'all';
}

interface PeriodData {
  totalMinutes: number;
  sessionsCount: number;
  averageSessionLength: number;
  daysWithSessions: number;
  totalDays: number;
  consistencyScore: number;
  intensityScore: number;
  focusScore: number;
  productivityScore: number;
}

export const ProductivityScore = ({ period }: ProductivityScoreProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPeriodData, setCurrentPeriodData] = useState<PeriodData | null>(null);
  const [previousPeriodData, setPreviousPeriodData] = useState<PeriodData | null>(null);
  const [comparison, setComparison] = useState<{
    totalMinutes: number;
    sessionsCount: number;
    averageSessionLength: number;
    productivityScore: number;
  }>({ totalMinutes: 0, sessionsCount: 0, averageSessionLength: 0, productivityScore: 0 });

  useEffect(() => {
    if (user) {
      fetchProductivityData();
    }
  }, [user, period]);

  const fetchProductivityData = async () => {
    try {
      setLoading(true);
      
      // Calculate date ranges based on selected period
      const now = new Date();
      let currentStart: Date;
      let previousStart: Date;
      let totalDays: number;
      
      if (period === 'week') {
        currentStart = subDays(now, 7);
        previousStart = subDays(currentStart, 7);
        totalDays = 7;
      } else if (period === 'month') {
        currentStart = subMonths(now, 1);
        previousStart = subMonths(currentStart, 1);
        totalDays = 30; // Approximation
      } else { // 'all' - we'll compare last 3 months vs previous 3 months
        currentStart = subMonths(now, 3);
        previousStart = subMonths(currentStart, 3);
        totalDays = 90; // Approximation
      }
      
      // Fetch current period data
      const currentPeriodData = await fetchPeriodData(currentStart, now, totalDays);
      setCurrentPeriodData(currentPeriodData);
      
      // Fetch previous period data
      const previousPeriodData = await fetchPeriodData(previousStart, currentStart, totalDays);
      setPreviousPeriodData(previousPeriodData);
      
      // Calculate comparison percentages
      if (previousPeriodData.totalMinutes > 0) {
        setComparison({
          totalMinutes: calculatePercentageChange(currentPeriodData.totalMinutes, previousPeriodData.totalMinutes),
          sessionsCount: calculatePercentageChange(currentPeriodData.sessionsCount, previousPeriodData.sessionsCount),
          averageSessionLength: calculatePercentageChange(currentPeriodData.averageSessionLength, previousPeriodData.averageSessionLength),
          productivityScore: calculatePercentageChange(currentPeriodData.productivityScore, previousPeriodData.productivityScore)
        });
      } else {
        // If no previous data, set comparison to 100% (all new)
        setComparison({
          totalMinutes: 100,
          sessionsCount: 100,
          averageSessionLength: 100,
          productivityScore: 100
        });
      }
    } catch (error) {
      console.error('Error fetching productivity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodData = async (startDate: Date, endDate: Date, totalDays: number): Promise<PeriodData> => {
    // Fetch study sessions for the period
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('duration_minutes, completed_at')
      .eq('user_id', user?.id)
      .gte('completed_at', startDate.toISOString())
      .lt('completed_at', endDate.toISOString());
    
    if (error) throw error;
    
    // Calculate basic metrics
    const totalMinutes = sessions?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0;
    const sessionsCount = sessions?.length || 0;
    const averageSessionLength = sessionsCount > 0 ? totalMinutes / sessionsCount : 0;
    
    // Calculate days with sessions
    const daysWithSessionsSet = new Set<string>();
    sessions?.forEach(session => {
      const date = format(new Date(session.completed_at), 'yyyy-MM-dd');
      daysWithSessionsSet.add(date);
    });
    const daysWithSessions = daysWithSessionsSet.size;
    
    // Calculate scores
    // 1. Consistency Score (0-100): Percentage of days with at least one study session
    const consistencyScore = Math.round((daysWithSessions / totalDays) * 100);
    
    // 2. Intensity Score (0-100): Based on average daily study time
    // Assuming 2 hours (120 minutes) per day is excellent
    const dailyAverage = totalMinutes / totalDays;
    const intensityScore = Math.min(100, Math.round((dailyAverage / 120) * 100));
    
    // 3. Focus Score (0-100): Based on average session length
    // Assuming 45 minutes is an excellent session length
    const focusScore = Math.min(100, Math.round((averageSessionLength / 45) * 100));
    
    // Overall Productivity Score: Weighted average of the three scores
    // Consistency is weighted highest as it's most important for learning
    const productivityScore = Math.round(
      (consistencyScore * 0.5) + (intensityScore * 0.3) + (focusScore * 0.2)
    );
    
    return {
      totalMinutes,
      sessionsCount,
      averageSessionLength,
      daysWithSessions,
      totalDays,
      consistencyScore,
      intensityScore,
      focusScore,
      productivityScore
    };
  };

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getComparisonIcon = (value: number) => {
    if (value > 5) return <TrendingUp className="w-4 h-4 text-success" />;
    if (value < -5) return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getComparisonText = (value: number) => {
    if (value === 0) return "Same as last period";
    const absValue = Math.abs(value);
    return `${absValue}% ${value > 0 ? 'increase' : 'decrease'} from last period`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-amber-500';
    return 'text-destructive';
  };

  return (
    <Card className="focus-card">
      <CardHeader className="pb-2">
        <CardTitle>Productivity Score</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <p className="text-muted-foreground">Calculating productivity score...</p>
          </div>
        ) : currentPeriodData ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(currentPeriodData.productivityScore)}`}>
                {currentPeriodData.productivityScore}
              </div>
              <div className="text-sm text-muted-foreground flex items-center justify-center mt-1">
                {getComparisonIcon(comparison.productivityScore)}
                <span className="ml-1">{getComparisonText(comparison.productivityScore)}</span>
              </div>
            </div>
            
            {/* Score Breakdown */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Consistency</span>
                  <span className="text-sm font-medium">{currentPeriodData.consistencyScore}%</span>
                </div>
                <Progress value={currentPeriodData.consistencyScore} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  Studied on {currentPeriodData.daysWithSessions} of {currentPeriodData.totalDays} days
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Intensity</span>
                  <span className="text-sm font-medium">{currentPeriodData.intensityScore}%</span>
                </div>
                <Progress value={currentPeriodData.intensityScore} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTime(Math.round(currentPeriodData.totalMinutes / currentPeriodData.totalDays))} average daily study time
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Focus</span>
                  <span className="text-sm font-medium">{currentPeriodData.focusScore}%</span>
                </div>
                <Progress value={currentPeriodData.focusScore} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTime(Math.round(currentPeriodData.averageSessionLength))} average session length
                </div>
              </div>
            </div>
            
            {/* Period Summary */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <div className="text-sm text-muted-foreground">Total Study Time</div>
                <div className="text-lg font-medium">{formatTime(currentPeriodData.totalMinutes)}</div>
                <div className="text-xs flex items-center">
                  {getComparisonIcon(comparison.totalMinutes)}
                  <span className="ml-1">{comparison.totalMinutes}%</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Total Sessions</div>
                <div className="text-lg font-medium">{currentPeriodData.sessionsCount}</div>
                <div className="text-xs flex items-center">
                  {getComparisonIcon(comparison.sessionsCount)}
                  <span className="ml-1">{comparison.sessionsCount}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <p className="text-muted-foreground">No data available for this period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};