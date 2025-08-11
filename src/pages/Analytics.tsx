import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Target, Award, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StudyAnalytics } from '@/components/StudyAnalytics';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface StudySession {
  id: string;
  user_id: string;
  room_id: string;
  room_name?: string;
  duration_minutes: number;
  completed_at: string;
}

export function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [averageSessionTime, setAverageSessionTime] = useState(0);
  const [longestSession, setLongestSession] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (user) {
      fetchStudySessions();
    }
  }, [user, selectedPeriod]);

  const fetchStudySessions = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on selected period
      const startDate = new Date();
      if (selectedPeriod === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (selectedPeriod === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      }
      
      // Only filter by date if not showing all-time data
      let query = supabase
        .from('study_sessions')
        .select(`
          id,
          user_id,
          room_id,
          duration_minutes,
          completed_at,
          rooms(name)
        `)
        .eq('user_id', user?.id);
      
      if (selectedPeriod !== 'all') {
        query = query.gte('completed_at', startDate.toISOString());
      }
      
      query = query.order('completed_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Format the data
        const formattedSessions = data.map((session: {
          id: string;
          user_id: string;
          room_id: string;
          duration_minutes: number;
          completed_at: string;
          rooms: { name: string }[];
        }) => ({
          id: session.id,
          user_id: session.user_id,
          room_id: session.room_id,
          room_name: session.rooms && session.rooms.length > 0 ? session.rooms[0].name : 'Unknown Room',
          duration_minutes: session.duration_minutes,
          completed_at: session.completed_at
        }));
        
        setStudySessions(formattedSessions);
        setRecentSessions(formattedSessions.slice(0, 5));
        
        // Calculate statistics
        const total = formattedSessions.reduce((sum, session) => sum + session.duration_minutes, 0);
        setTotalStudyTime(total);
        setTotalSessions(formattedSessions.length);
        setAverageSessionTime(formattedSessions.length > 0 ? total / formattedSessions.length : 0);
        
        const longest = formattedSessions.reduce(
          (max, session) => Math.max(max, session.duration_minutes),
          0
        );
        setLongestSession(longest);
      }
    } catch (error) {
      console.error('Error fetching study sessions:', error);
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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  return (
    <div className="container max-w-4xl py-6 sm:py-10 px-4 sm:px-6">
      <div className="flex items-center mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">Study Analytics</h1>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4 enhanced-tabs">
            <TabsTrigger value="overview" className="flex-1 enhanced-tab">Overview</TabsTrigger>
            <TabsTrigger value="sessions" className="flex-1 enhanced-tab">Sessions</TabsTrigger>
            <TabsTrigger value="charts" className="flex-1 enhanced-tab">Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="flex justify-end">
                <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'week' | 'month' | 'all')}>
                  <TabsList className="enhanced-tabs">
                    <TabsTrigger value="week" className="enhanced-tab">Week</TabsTrigger>
                    <TabsTrigger value="month" className="enhanced-tab">Month</TabsTrigger>
                    <TabsTrigger value="all" className="enhanced-tab">All Time</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="focus-card relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-focus to-secondary opacity-70"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-foreground">{formatTime(totalStudyTime)}</div>
                    <div className="text-sm text-muted-foreground">Total Study Time</div>
                  </CardContent>
                </Card>

                <Card className="focus-card relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-focus to-secondary opacity-70"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-focus" />
                    <div className="text-2xl font-bold text-foreground">{totalSessions}</div>
                    <div className="text-sm text-muted-foreground">Total Sessions</div>
                  </CardContent>
                </Card>

                <Card className="focus-card relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-focus to-secondary opacity-70"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-secondary" />
                    <div className="text-2xl font-bold text-foreground">{formatTime(averageSessionTime)}</div>
                    <div className="text-sm text-muted-foreground">Average Session</div>
                  </CardContent>
                </Card>

                <Card className="focus-card relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-focus to-secondary opacity-70"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                  <CardContent className="p-4 text-center">
                    <Award className="w-8 h-8 mx-auto mb-2 text-success" />
                    <div className="text-2xl font-bold text-foreground">{formatTime(longestSession)}</div>
                    <div className="text-sm text-muted-foreground">Longest Session</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="focus-card">
                <CardHeader className="pb-2">
                  <CardTitle>Recent Study Sessions</CardTitle>
                  <CardDescription>Your 5 most recent study sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading sessions...</div>
                  ) : recentSessions.length > 0 ? (
                    <div className="space-y-4">
                      {recentSessions.map((session) => (
                        <div key={session.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                          <div>
                            <div className="font-medium">{session.room_name}</div>
                            <div className="text-sm text-muted-foreground">{formatDate(session.completed_at)}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatTime(session.duration_minutes)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No study sessions found for this period.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="focus-card">
              <CardHeader>
                <CardTitle>All Study Sessions</CardTitle>
                <CardDescription>Complete history of your study sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4 text-muted-foreground">Loading sessions...</div>
                ) : studySessions.length > 0 ? (
                  <div className="space-y-4">
                    {studySessions.map((session) => (
                      <div key={session.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                        <div>
                          <div className="font-medium">{session.room_name}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(session.completed_at)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatTime(session.duration_minutes)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No study sessions found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts">
            <StudyAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Analytics;