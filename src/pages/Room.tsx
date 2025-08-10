import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { StudyTimer } from "@/components/StudyTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Users, 
  MessageCircle, 
  Settings, 
  Volume2, 
  VolumeX,
  Coffee,
  Target,
  Clock
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  // Mock room data - in real app this would come from API
  const room = {
    id: roomId,
    name: "Focused Study Session", 
    preset: "study",
    participants: [
      { id: "1", name: "Alex", avatar: "A", isOnline: true },
      { id: "2", name: "Sam", avatar: "S", isOnline: true },
      { id: "3", name: "Jordan", avatar: "J", isOnline: false }
    ]
  };

  const handleSessionComplete = (duration: number) => {
    setTotalStudyTime(prev => prev + duration);
    setSessionsCompleted(prev => prev + 1);
    toast({
      title: "Session Complete!",
      description: `Great job! You completed a ${Math.round(duration / 60)} minute study session.`,
    });
  };

  const handleLeaveRoom = () => {
    navigate("/");
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
                  <Badge variant="secondary" className="text-xs">
                    {room.preset}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {room.participants.filter(p => p.isOnline).length} online
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
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
            <StudyTimer onSessionComplete={handleSessionComplete} />
            
            {/* Session Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="focus-card text-center">
                <div className="flex flex-col items-center">
                  <Clock className="w-8 h-8 text-primary mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {formatTime(totalStudyTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
              </Card>
              
              <Card className="focus-card text-center">
                <div className="flex flex-col items-center">
                  <Target className="w-8 h-8 text-focus mb-2" />
                  <div className="text-2xl font-bold text-foreground">
                    {sessionsCompleted}
                  </div>
                  <div className="text-sm text-muted-foreground">Sessions</div>
                </div>
              </Card>
              
              <Card className="focus-card text-center">
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
                {room.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                          {participant.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${
                          participant.isOnline ? 'bg-success' : 'bg-muted-foreground'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {participant.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {participant.isOnline ? 'Online' : 'Away'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Room Controls */}
            <Card className="focus-card">
              <h3 className="text-lg font-semibold text-foreground mb-4">Room Controls</h3>
              
              <div className="space-y-3">
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
                  onClick={() => toast({ title: "Settings coming soon!" })}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Room Settings
                </Button>
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