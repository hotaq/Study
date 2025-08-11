import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Square, RotateCcw } from "lucide-react";

interface StudyTimerProps {
  onSessionComplete?: (duration: number) => void;
  onTimeUpdate?: (seconds: number) => void; // For continuous time tracking
  mode: "pomodoro" | "unlimited" | "custom";
  displayStyle?: "circle" | "bar";
  customTime?: number; // Custom time in minutes
}

export const StudyTimer = ({ onSessionComplete, onTimeUpdate, mode, displayStyle = "circle", customTime = 30 }: StudyTimerProps) => {
  const POMODORO_TIME = 25 * 60; // 25 minutes for Pomodoro
  const CUSTOM_TIME = customTime * 60; // Convert minutes to seconds
  
  const [time, setTime] = useState(mode === "pomodoro" ? POMODORO_TIME : (mode === "custom" ? CUSTOM_TIME : 0)); // Start at 0 for unlimited
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime] = useState(mode === "pomodoro" ? POMODORO_TIME : (mode === "custom" ? CUSTOM_TIME : 0));
  const [elapsedTime, setElapsedTime] = useState(0); // For unlimited mode tracking

  // Reset timer when mode changes
  useEffect(() => {
    if (mode === "pomodoro") {
      setTime(POMODORO_TIME);
    } else if (mode === "custom") {
      setTime(CUSTOM_TIME);
    } else {
      // For unlimited mode, we count up instead of down
      setTime(0);
      setElapsedTime(0);
    }
    setIsRunning(false);
  }, [mode, POMODORO_TIME, CUSTOM_TIME]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        if (mode === "pomodoro" || mode === "custom") {
          // Count down for Pomodoro and Custom modes
          setTime((prevTime) => {
            if (prevTime > 0) {
              return prevTime - 1;
            } else {
              setIsRunning(false);
              onSessionComplete?.(mode === "pomodoro" ? POMODORO_TIME : CUSTOM_TIME);
              return 0;
            }
          });
        } else {
          // Count up for unlimited mode
          setElapsedTime((prev) => {
            const newElapsed = prev + 1;
            
            // Update total time every second in unlimited mode
            onTimeUpdate?.(1);
            
            // Count a session every 25 minutes in unlimited mode for database tracking
            if (newElapsed > 0 && newElapsed % (25 * 60) === 0) {
              onSessionComplete?.(25 * 60);
            }
            
            return newElapsed;
          });
        }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, mode, POMODORO_TIME, CUSTOM_TIME, onSessionComplete, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format time for unlimited mode (includes hours)
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress differently based on mode
  const progress = mode === "pomodoro" || mode === "custom" 
    ? ((totalTime - time) / totalTime) * 100 
    : (elapsedTime % 300) / 300 * 100; // For unlimited mode, use a 5-minute cycle for the progress indicator

  const handlePause = () => {
    setIsRunning(false);
    
    // For unlimited mode, save session when pausing if there's elapsed time
    if (mode === "unlimited" && elapsedTime > 0) {
      const durationMinutes = Math.floor(elapsedTime / 60);
      if (durationMinutes > 0) {
        onSessionComplete?.(elapsedTime);
      }
    }
  };

  const handleReset = () => {
    // For unlimited mode, save session before resetting if there's elapsed time
    if (mode === "unlimited" && elapsedTime > 0) {
      const durationMinutes = Math.floor(elapsedTime / 60);
      if (durationMinutes > 0) {
        onSessionComplete?.(elapsedTime);
      }
    }
    
    if (mode === "pomodoro") {
      setTime(POMODORO_TIME);
    } else if (mode === "custom") {
      setTime(CUSTOM_TIME);
    } else {
      setElapsedTime(0);
    }
    setIsRunning(false);
  };

  // Render the timer display based on the selected style
  const renderTimerDisplay = () => {
    const timeDisplay = mode === "unlimited" ? formatElapsedTime(elapsedTime) : formatTime(time);
    
    if (displayStyle === "circle") {
      return (
        <div className="relative">
          <div 
            className="w-40 h-40 rounded-full border-8 border-muted flex items-center justify-center"
            style={{
              background: `conic-gradient(from 0deg, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)`
            }}
          >
            <div className="w-32 h-32 bg-background rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-foreground">
                {timeDisplay}
              </span>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full max-w-md">
          <div className="text-4xl font-bold text-foreground text-center mb-4">
            {timeDisplay}
          </div>
          <div className="w-full bg-muted rounded-full h-4 mb-2">
            <div 
              className={`h-4 rounded-full transition-all duration-300 ease-in-out ${mode === "pomodoro" || mode === "custom" ? "bg-primary" : "bg-primary/30"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {(mode === "pomodoro" || mode === "custom") && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          )}
        </div>
      );
    }
  };
  
  return (
    <Card className="focus-card flex flex-col items-center justify-center p-8 min-h-[300px]">
      <div className="absolute top-4 right-4 flex gap-2">
        <Badge variant={mode === "pomodoro" ? "default" : (mode === "custom" ? "outline" : "secondary")}>
          {mode === "pomodoro" ? "Pomodoro" : (mode === "custom" ? `Custom (${customTime}m)` : "Unlimited")}
        </Badge>
        <Badge variant={displayStyle === "circle" ? "outline" : "secondary"}>
          {displayStyle === "circle" ? "Circle" : "Bar"}
        </Badge>
      </div>
      {renderTimerDisplay()}
      
      <div className="flex gap-4 mt-8">
        <Button
          variant={isRunning ? "secondary" : "default"}
          size="lg"
          onClick={() => isRunning ? handlePause() : setIsRunning(true)}
          className="flex items-center gap-2"
        >
          {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {isRunning ? "Pause" : "Start"}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={handleReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </Button>
      </div>
    </Card>
  );
};