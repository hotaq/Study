import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, Square, RotateCcw } from "lucide-react";

interface StudyTimerProps {
  onSessionComplete?: (duration: number) => void;
}

export const StudyTimer = ({ onSessionComplete }: StudyTimerProps) => {
  const [time, setTime] = useState(25 * 60); // 25 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime] = useState(25 * 60);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((time) => time - 1);
      }, 1000);
    } else if (time === 0) {
      setIsRunning(false);
      onSessionComplete?.(totalTime);
    }
    return () => clearInterval(interval);
  }, [isRunning, time, totalTime, onSessionComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalTime - time) / totalTime) * 100;

  const handleReset = () => {
    setTime(totalTime);
    setIsRunning(false);
  };

  return (
    <Card className="focus-card flex flex-col items-center justify-center p-8 min-h-[300px]">
      <div className="relative">
        <div 
          className="w-40 h-40 rounded-full border-8 border-muted flex items-center justify-center"
          style={{
            background: `conic-gradient(from 0deg, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)`
          }}
        >
          <div className="w-32 h-32 bg-background rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-foreground">
              {formatTime(time)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 mt-8">
        <Button
          variant={isRunning ? "secondary" : "default"}
          size="lg"
          onClick={() => setIsRunning(!isRunning)}
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