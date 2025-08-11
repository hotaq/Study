import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StudyTimer } from "@/components/StudyTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RoomSettingsDialog } from "@/components/RoomSettingsDialog";
import { GoalSettingsDialog } from "@/components/GoalSettingsDialog";
import { GoalProgressDisplay } from "@/components/GoalProgressDisplay";
import { ScoreInputDialog } from "@/components/ScoreInputDialog";
import { SubjectSelect } from "@/components/SubjectSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  Volume2, 
  VolumeX,
  Coffee,
  Target,
  Clock,
  Trophy,
  BookOpen
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subMonths } from "date-fns";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [totalStudyTime, setTotalStudyTime] = useState(() => {
    // Try to load saved total study time from localStorage
    const savedTotalTime = localStorage.getItem(`room_${roomId}_totalTime`);
    return savedTotalTime ? parseInt(savedTotalTime, 10) : 0;
  });
  const [sessionsCompleted, setSessionsCompleted] = useState(() => {
    // Try to load saved sessions from localStorage
    const savedSessions = localStorage.getItem(`room_${roomId}_sessions`);
    return savedSessions ? parseInt(savedSessions, 10) : 0;
  });
  
  // selectedSubject is declared below with type annotation
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    // Try to load saved sound setting from localStorage
    const savedSoundEnabled = localStorage.getItem(`room_${roomId}_soundEnabled`);
    return savedSoundEnabled ? savedSoundEnabled === 'true' : true;
  });
  const [timerMode, setTimerMode] = useState<"pomodoro" | "unlimited" | "custom">(() => {
    // Try to load saved timer mode from localStorage
    const savedTimerMode = localStorage.getItem(`room_${roomId}_timerMode`);
    return (savedTimerMode as "pomodoro" | "unlimited" | "custom") || "pomodoro";
  });
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    // Try to load saved subject from localStorage
    const savedSubject = localStorage.getItem(`room_${roomId}_subject`);
    return savedSubject || "";
  });
  const [displayStyle, setDisplayStyle] = useState<"circle" | "bar">(() => {
    // Try to load saved display style from localStorage
    const savedDisplayStyle = localStorage.getItem(`room_${roomId}_displayStyle`);
    return (savedDisplayStyle as "circle" | "bar") || "circle";
  });
  const [customTime, setCustomTime] = useState<number>(() => {
    // Try to load saved custom time from localStorage
    const savedCustomTime = localStorage.getItem(`room_${roomId}_customTime`);
    return savedCustomTime ? parseInt(savedCustomTime, 10) : 30;
  });
  
  // Goal tracking state
  const [goalType, setGoalType] = useState<"time" | "sessions" | "score" | "none">(() => {
    // Try to load saved goal type from localStorage
    const savedGoalType = localStorage.getItem(`room_${roomId}_goalType`);
    return (savedGoalType as "time" | "sessions" | "score" | "none") || "none";
  });
  
  const [goalValue, setGoalValue] = useState<number>(() => {
    // Try to load saved goal value from localStorage
    const savedGoalValue = localStorage.getItem(`room_${roomId}_goalValue`);
    return savedGoalValue ? parseInt(savedGoalValue, 10) : 60; // Default: 60 minutes or 3 sessions
  });
  const [currentScore, setCurrentScore] = useState<number>(() => {
    // Try to load saved score from localStorage
    const savedScore = localStorage.getItem(`room_${roomId}_score`);
    return savedScore ? parseInt(savedScore, 10) : 0;
  });
  // Define participant interface
  interface Participant {
    id: string;
    name: string;
    fullName?: string;
    avatarUrl?: string;
    avatar: string;
    isOnline: boolean;
    examScore: number | null;
  }
  
  // Define user stats interface for tooltip
  interface UserStats {
    totalTime: number;
    sessions: number;
    score: number;
    mainSubject: string;
    loading: boolean;
  }
  
  // State to store user statistics for tooltips
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});

  const [room, setRoom] = useState({
    id: roomId,
    name: "Loading...", 
    preset: "study",
    participants: [] as Participant[]
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Add a refresh interval to periodically update room details
  useEffect(() => {
    fetchRoomDetails(false);
    
    // Set up an interval to refresh room details every 30 seconds
    const intervalId = setInterval(() => {
      fetchRoomDetails(false);
    }, 30000); // 30 seconds
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [roomId]);
  
  // Create a separate function for manual refresh
  const handleManualRefresh = () => {
    setRefreshing(true);
    toast({
      title: "Refreshing room data...",
      description: "Getting the latest participant information",
    });
    fetchRoomDetails(true);
  };
  
  // Function to fetch user statistics for tooltip
  const fetchUserStats = async (userId: string) => {
    // If we already have stats loading for this user, don't fetch again
    if (userStats[userId]?.loading) return;
    
    // Set initial loading state
    setUserStats(prev => ({
      ...prev,
      [userId]: {
        totalTime: 0,
        sessions: 0,
        score: 0,
        mainSubject: 'None',
        loading: true
      }
    }));
    
    try {
      // Check if this is the current user or another user
      const isCurrentUser = userId === user?.id;
      
      if (isCurrentUser) {
        // For current user, fetch full stats
        const endDate = new Date();
        const startDate = subMonths(endDate, 3);
        
        const { data: sessions, error } = await supabase
          .from('study_sessions')
          .select(`
            id,
            duration_minutes,
            subject_id,
            subjects(name)
          `)
          .eq('user_id', userId)
          .gte('completed_at', startDate.toISOString());
        
        if (error) throw error;
        
        const totalTime = sessions?.reduce((sum, session) => sum + session.duration_minutes, 0) || 0;
        const sessionsCount = sessions?.length || 0;
        
        // Find most studied subject
        const subjectCounts: Record<string, { minutes: number, name: string }> = {};
        sessions?.forEach(session => {
          const subjectId = session.subject_id || 'unknown';
          const subjectName = (session.subjects as { name: string }[])?.[0]?.name || 'Unknown';
          
          if (!subjectCounts[subjectId]) {
            subjectCounts[subjectId] = { minutes: 0, name: subjectName };
          }
          
          subjectCounts[subjectId].minutes += session.duration_minutes;
        });
        
        let mainSubject = 'None';
        let maxMinutes = 0;
        
        Object.entries(subjectCounts).forEach(([_, data]) => {
          if (data.minutes > maxMinutes) {
            maxMinutes = data.minutes;
            mainSubject = data.name;
          }
        });
        
        // Fetch user's productivity score
        const { data: scoreData } = await supabase
          .from('exam_scores')
          .select('score')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        const score = scoreData && scoreData.length > 0 ? scoreData[0].score : 0;
        
        setUserStats(prev => ({
          ...prev,
          [userId]: {
            totalTime,
            sessions: sessionsCount,
            score,
            mainSubject,
            loading: false
          }
        }));
      } else {
        // For other users, show privacy message due to RLS policies
        setUserStats(prev => ({
          ...prev,
          [userId]: {
            totalTime: 0,
            sessions: 0,
            score: 0,
            mainSubject: 'Private',
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats(prev => ({
        ...prev,
        [userId]: {
          totalTime: 0,
          sessions: 0,
          score: 0,
          mainSubject: 'Error',
          loading: false
        }
      }));
    }
  };
  
  const fetchRoomDetails = async (isManualRefresh = false) => {
    try {
      // Only set loading to true on initial load
      if (!isManualRefresh) {
        setLoading(true);
      }
      // Fetch room details
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (roomError) throw roomError;
      
      // Fetch room participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('room_participants')
        .select('user_id')
        .eq('room_id', roomId);
      
      if (participantsError) throw participantsError;
      
      // Get unique user IDs
      const userIds = participantsData.map(p => p.user_id);
      
      // Fetch user profiles
      let participants = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, full_name')
          .in('id', userIds);
          
        if (!profilesError && profilesData) {
          participants = profilesData.map(profile => ({
            id: profile.id,
            name: profile.username,
            fullName: profile.full_name,
            avatarUrl: profile.avatar_url,
            avatar: profile.username?.[0]?.toUpperCase() || 'U',
            isOnline: true // For simplicity, we'll assume all participants are online
          }));
        }

        // Fetch exam scores for all participants in this room
        const { data: scoresData, error: scoresError } = await supabase
          .from('exam_scores')
          .select('user_id, score')
          .eq('room_id', roomId);

        if (!scoresError && scoresData) {
          // Update participants with their scores
          participants = participants.map(participant => {
            const userScore = scoresData.find(s => s.user_id === participant.id);
            return {
              ...participant,
              examScore: userScore ? userScore.score : null
            };
          });

          // If current user has a score in the database, update the local state
          if (user) {
            const myScore = scoresData.find(s => s.user_id === user.id);
            if (myScore) {
              setCurrentScore(myScore.score);
              localStorage.setItem(`room_${roomId}_score`, myScore.score.toString());
            }
          }
        }
      }
      
      setRoom({
        id: roomId,
        name: roomData.name,
        preset: roomData.preset,
        participants
      });
      
      // Fetch statistics for all participants
      participants.forEach(participant => {
        fetchUserStats(participant.id);
      });
    } catch (error) {
      console.error('Error fetching room details:', error);
      toast({
        title: "Error",
        description: "Failed to load room details",
      });
    } finally {
      // Reset loading states
      setLoading(false);
      
      // Handle manual refresh completion
      if (refreshing) {
        setRefreshing(false);
        toast({
          title: "Room data refreshed",
          description: "Participant information is now up to date",
        });
      }
    }
  };

  const handleTimeUpdate = (seconds: number) => {
    // Update total study time continuously (for unlimited mode)
    setTotalStudyTime(prev => {
      const newValue = prev + seconds;
      // Save updated total study time to localStorage
      localStorage.setItem(`room_${roomId}_totalTime`, newValue.toString());
      return newValue;
    });
  };

  const handleSessionComplete = async (duration: number) => {
    // Update study stats
    setTotalStudyTime(prev => {
      const newValue = prev + duration;
      // Save updated total study time to localStorage
      localStorage.setItem(`room_${roomId}_totalTime`, newValue.toString());
      return newValue;
    });
    setSessionsCompleted(prev => {
      const newValue = prev + 1;
      // Save updated sessions count to localStorage
      localStorage.setItem(`room_${roomId}_sessions`, newValue.toString());
      return newValue;
    });
    
    // Save study session to database for analytics
    if (user) {
      try {
        const durationMinutes = Math.round(duration / 60);
        
        // Get the subject ID from the room's preset or from the selected subject
        let subjectId = selectedSubject;
        
        // If no subject is explicitly selected, try to get it from the room preset
        if (!subjectId && room?.preset) {
          // Try to find a subject that matches the room preset
          const { data: presetSubjects } = await supabase
            .from('subjects')
            .select('id')
            .ilike('name', `%${room.preset}%`)
            .limit(1);
            
          if (presetSubjects && presetSubjects.length > 0) {
            subjectId = presetSubjects[0].id;
          }
        }
        
        console.log('Saving study session:', {
          user_id: user.id,
          room_id: roomId,
          duration_minutes: durationMinutes,
          subject_id: subjectId || null,
        });
        
        const { error } = await supabase
          .from('study_sessions')
          .insert({
            user_id: user.id,
            room_id: roomId,
            duration_minutes: durationMinutes,
            subject_id: subjectId || null,
          });
          
        if (error) {
          console.error('Error saving study session:', error);
          toast({
            title: "Error saving session",
            description: "Failed to save study session to analytics",
            variant: "destructive"
          });
        } else {
          console.log('Study session saved successfully');
          toast({
            title: "Session saved",
            description: "Study session saved to analytics",
          });
        }
      } catch (error) {
        console.error('Error saving study session:', error);
      }
    }
    
    // Show completion toast
    toast({
      title: "Session Complete!",
      description: `Great job! You completed a ${Math.round(duration / 60)} minute study session.`,
    });
  };
  
  const handleTimerModeChange = (mode: "pomodoro" | "unlimited" | "custom", customTimeValue?: number) => {
    // Save timer mode to localStorage
    localStorage.setItem(`room_${roomId}_timerMode`, mode);
    setTimerMode(mode);
    
    if (mode === "custom" && customTimeValue) {
      // Save custom time to localStorage
      localStorage.setItem(`room_${roomId}_customTime`, customTimeValue.toString());
      setCustomTime(customTimeValue);
      toast({
        title: `Timer Mode: Custom (${customTimeValue} min)`,
        description: `Focus for ${customTimeValue} minutes with breaks between sessions`,
      });
    } else {
      toast({
        title: `Timer Mode: ${mode === "pomodoro" ? "Pomodoro (25 min)" : "Unlimited Time"} `,
        description: mode === "pomodoro" 
          ? "Focus for 25 minutes with breaks between sessions" 
          : "Continuous timer with no time limit",
      });
    }
  };

  const handleDisplayStyleChange = (style: "circle" | "bar") => {
    // Save display style to localStorage
    localStorage.setItem(`room_${roomId}_displayStyle`, style);
    setDisplayStyle(style);
    toast({
      title: `Display Style: ${style === "circle" ? "Circle" : "Bar"}`,
      description: `Timer will now be displayed as a ${style === "circle" ? "circular" : "progress bar"} interface`,
    });
  };
  
  const handleGoalChange = (type: "time" | "sessions" | "score" | "none", value?: number) => {
    setGoalType(type);
    
    // Save goal type to localStorage
    localStorage.setItem(`room_${roomId}_goalType`, type);
    
    if (value) {
      setGoalValue(value);
      // Save goal value to localStorage
      localStorage.setItem(`room_${roomId}_goalValue`, value.toString());
    }
    
    if (type === "none") {
      toast({
        title: "Goal Removed",
        description: "You're now studying without a specific goal",
      });
    } else {
      const goalDescription = 
        type === "time" ? `${Math.floor(value! / 60)} minutes` : 
        type === "sessions" ? `${value} sessions` : 
        `${value} points`;
      
      toast({
        title: `Goal Set: ${goalDescription}`,
        description: `Keep going! You can do it! 💪`,
      });
    }
  };
  
  const handleGoalComplete = () => {
    toast({
      title: "🎉 Goal Achieved! 🎉",
      description: "Congratulations! You've reached your study goal!",
      variant: "default",
    });
  };
  
  // Test function to manually save a session for debugging
  const handleTestSaveSession = async () => {
    if (user) {
      await handleSessionComplete(25 * 60); // Save a 25-minute session
    }
  };
  
  const handleScoreSubmit = async (score: number) => {
    try {
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to submit a score",
          variant: "destructive"
        });
        return;
      }

      console.log('Current user:', user);
      console.log('Room ID:', roomId);

      // Save to localStorage and update the UI first for immediate feedback
      setCurrentScore(score);
      localStorage.setItem(`room_${roomId}_score`, score.toString());
      
      toast({
        title: "Score Updated Locally",
        description: `Your exam score has been updated to ${score} points (saved locally)`,
      });

      // First ensure the user is a participant in this room
      const { data: participantData, error: participantError } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      console.log('Participant check:', { participantData, participantError });

      if (participantError || !participantData) {
        console.log('User is not a participant, adding them to the room');
        // User is not a participant, let's add them
        const { data: joinData, error: joinError } = await supabase
          .from('room_participants')
          .insert({
            room_id: roomId,
            user_id: user.id
          })
          .select();

        console.log('Join room result:', { joinData, joinError });

        if (joinError) {
          throw new Error('Failed to join the room. Please try again.');
        }
      }

      // Now that we've ensured the user is a participant, try to save the score
      console.log('Attempting to save score to database:', {
        user_id: user.id,
        room_id: roomId,
        score: score
      });

      // Try to find existing score first
      const { data: existingScore, error: findError } = await supabase
        .from('exam_scores')
        .select('id')
        .eq('user_id', user.id)
        .eq('room_id', roomId)
        .maybeSingle();

      console.log('Existing score check:', { existingScore, findError });
       
      let scoreData, scoreError;

      if (existingScore?.id) {
        // Update existing score
        const updateResult = await supabase
          .from('exam_scores')
          .update({ score: score })
          .eq('id', existingScore.id)
          .select();
         
        scoreData = updateResult.data;
        scoreError = updateResult.error;
        console.log('Update score result:', { scoreData, scoreError });
      } else {
        // Insert new score
        const insertResult = await supabase
          .from('exam_scores')
          .insert({
            user_id: user.id,
            room_id: roomId,
            score: score
          })
          .select();
         
        scoreData = insertResult.data;
        scoreError = insertResult.error;
        console.log('Insert score result:', { scoreData, scoreError });
      }

      console.log('Score save result:', { scoreData, scoreError });

      if (scoreError) {
        console.error('Error saving score to database:', scoreError);
        toast({
          title: "Database Save Failed",
          description: "Score saved locally but not to the database. Error: " + scoreError.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Score Saved to Database",
          description: `Your exam score of ${score} points has been saved to the database`,
        });
        // Refresh room details to update other participants' view
        fetchRoomDetails(true);
      }
    } catch (error) {
      console.error('Error in handleScoreSubmit:', error);
      toast({
        title: "Error Saving Score",
        description: "There was a problem saving your score. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLeaveRoom = async () => {
    try {
      if (!user) {
        console.error('User not authenticated');
        navigate("/");
        return;
      }
      
      // Remove user from room_participants
      const { error: leaveError } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);
      
      if (leaveError) {
        console.error('Error leaving room:', leaveError);
        toast({
          title: "Error",
          description: "Failed to leave the room. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "You have left the room."
        });
      }
      
      // Navigate to the home page
      navigate("/");
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      navigate("/");
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLeaveRoom}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">{room.name}</h1>
                <div className="flex items-center gap-2">
                  {room.preset && (
                    <Badge variant="secondary" className="text-xs">
                      {room.preset}
                    </Badge>
                  )}
                  {goalType !== "none" && (
                  <Badge variant="outline" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    {goalType === "time" ? 
                      `Goal: ${Math.floor(goalValue / 60)} min` : 
                      goalType === "sessions" ? 
                      `Goal: ${goalValue} sessions` :
                      `Goal: ${goalValue} points`}
                  </Badge>
                )}
                  <span className="text-sm text-muted-foreground">
                    {loading ? "Loading..." : `${room.participants.length} participant${room.participants.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleManualRefresh}
                disabled={refreshing}
                title="Refresh room data"
              >
                {refreshing ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M8 16H3v5"/>
                  </svg>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newValue = !isSoundEnabled;
                  // Save sound setting to localStorage
                  localStorage.setItem(`room_${roomId}_soundEnabled`, newValue.toString());
                  setIsSoundEnabled(newValue);
                }}
              >
                {isSoundEnabled ? 
                  <Volume2 className="w-4 h-4" /> : 
                  <VolumeX className="w-4 h-4" />
                }
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer Section */}
          <div className="lg:col-span-2 space-y-6">
            {goalType !== "none" && (
                <GoalProgressDisplay
                  goalType={goalType}
                  goalValue={goalValue}
                  currentValue={
                    goalType === "time" ? totalStudyTime : 
                    goalType === "sessions" ? sessionsCompleted : 
                    currentScore
                  }
                  onGoalComplete={handleGoalComplete}
                />
              )}
            
            <StudyTimer 
                onSessionComplete={handleSessionComplete}
                onTimeUpdate={handleTimeUpdate}
                mode={timerMode}
                displayStyle={displayStyle}
                customTime={customTime}
              />
            
            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="focus-card text-center p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-focus to-secondary opacity-70"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                <div className="flex flex-col items-center">
                  <Clock className="w-8 h-8 text-primary mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {formatTime(totalStudyTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
              </Card>
              
              <Card className="focus-card text-center p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-focus to-secondary opacity-70"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                <div className="flex flex-col items-center">
                  <Target className="w-8 h-8 text-focus mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {sessionsCompleted}
                  </div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>
              </Card>
              
              <Card className="focus-card text-center p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-focus to-secondary opacity-70"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"></div>
                <div className="flex flex-col items-center">
                  <Coffee className="w-8 h-8 text-secondary mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {Math.floor(sessionsCompleted / 4)}
                  </div>
                  <div className="text-sm text-muted-foreground">Breaks</div>
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <Card className="focus-card">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Participants ({room.participants.length})
                </h3>
              </div>
              
              <div className="space-y-3">
                {loading ? (
                  <div className="py-4 text-center text-muted-foreground">
                    Loading participants...
                  </div>
                ) : room.participants.length > 0 ? (
                  room.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg">
                      <div className="relative">
                        <Avatar className="w-8 h-8">
                          {participant.avatarUrl ? (
                            <img 
                              src={participant.avatarUrl} 
                              alt={participant.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                              {participant.avatar}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div 
                          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                            participant.isOnline ? 'bg-success' : 'bg-muted-foreground'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                         <div className="text-sm font-medium text-foreground">
                           {participant.fullName || participant.name}
                         </div>
                         <div className="text-xs text-muted-foreground">
                           {participant.isOnline ? 'Online' : 'Away'}
                         </div>
                         {goalType === "score" && (
                           <Badge variant="secondary" className="mt-1 text-xs">
                             {participant.id === user?.id 
                               ? `${currentScore} pts` 
                               : participant.examScore !== null 
                                 ? `${participant.examScore} pts` 
                           : 'No score'}
                           </Badge>
                         )}
                       </div>
                       <div className="flex gap-1 text-xs">
                         <span 
                           className="px-1 py-0.5 rounded cursor-help" 
                           title={`Total Time: ${userStats[participant.id]?.loading ? 'Loading...' : userStats[participant.id] ? (participant.id === user?.id ? formatTime(userStats[participant.id].totalTime * 60) : 'Private') : 'No data'}`}
                         >
                           ⏰
                         </span>
                         <span 
                           className="px-1 py-0.5 rounded cursor-help" 
                           title={`Sessions: ${userStats[participant.id]?.loading ? 'Loading...' : userStats[participant.id] ? (participant.id === user?.id ? userStats[participant.id].sessions : 'Private') : 'No data'}`}
                         >
                           🎯
                         </span>
                         <span 
                           className="px-1 py-0.5 rounded cursor-help" 
                           title={`Study Subject: ${userStats[participant.id]?.loading ? 'Loading...' : userStats[participant.id] ? userStats[participant.id].mainSubject : 'No data'}`}
                         >
                           📚
                         </span>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    No participants yet
                  </div>
                )}
              </div>
            </Card>

            {/* Room Controls */}
            <Card className="focus-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Room Controls</h3>
              
              <div className="space-y-3">
                <SubjectSelect
                  value={selectedSubject}
                  onValueChange={(value) => {
                    setSelectedSubject(value);
                    localStorage.setItem(`room_${roomId}_subject`, value);
                  }}
                  label="Study Subject"
                  placeholder="Select a subject for analytics"
                />
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => toast({ title: "Chat coming soon!" })}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open Chat
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleTestSaveSession}
                >
                  🧪 Test Save Session
                </Button>
                
                <RoomSettingsDialog 
                  onTimerModeChange={handleTimerModeChange}
                  currentMode={timerMode}
                  onDisplayStyleChange={handleDisplayStyleChange}
                  currentDisplayStyle={displayStyle}
                  customTime={customTime}
                />
                
                <GoalSettingsDialog
                  onGoalChange={handleGoalChange}
                  currentGoalType={goalType}
                  currentGoalValue={goalValue}
                />
                
                {goalType === "score" && (
                  <ScoreInputDialog
                    onScoreSubmit={handleScoreSubmit}
                    currentScore={currentScore}
                  />
                )}
              </div>
            </Card>

            {/* Study Tips */}
            <Card className="focus-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Study Tips</h3>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Take breaks every 25 minutes</p>
                <p>• Stay hydrated and snack healthy</p>
                <p>• Eliminate distractions</p>
                <p>• Set specific goals for each session</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Room;