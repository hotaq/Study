import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, Clock, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

interface GoalProgressDisplayProps {
  goalType: "time" | "sessions" | "score" | "none";
  goalValue: number;
  currentValue: number;
  onGoalComplete?: () => void;
}

export function GoalProgressDisplay({ 
  goalType, 
  goalValue, 
  currentValue,
  onGoalComplete 
}: GoalProgressDisplayProps) {
  const [isGoalComplete, setIsGoalComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Calculate progress percentage
  const progressPercentage = goalType === "none" ? 0 : Math.min(Math.round((currentValue / goalValue) * 100), 100);
  
  // Check if goal is complete
  useEffect(() => {
    if (goalType !== "none" && currentValue >= goalValue && !isGoalComplete) {
      setIsGoalComplete(true);
      setShowCelebration(true);
      onGoalComplete?.();
      
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Hide celebration after 5 seconds
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [currentValue, goalValue, goalType, isGoalComplete, onGoalComplete]);
  
  // Reset completion state if goal changes
  useEffect(() => {
    setIsGoalComplete(false);
    setShowCelebration(false);
  }, [goalType, goalValue]);
  
  if (goalType === "none") {
    return null;
  }
  
  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-medium">
            {goalType === "time" ? "Time Goal" : 
             goalType === "sessions" ? "Sessions Goal" : 
             "Score Goal"}
          </h3>
        </div>
        <Badge variant={isGoalComplete ? "default" : "outline"}>
          {isGoalComplete ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Completed
            </>
          ) : (
            `${progressPercentage}%`
          )}
        </Badge>
      </div>
      
      <Progress value={progressPercentage} className="h-2 mb-2" />
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          {goalType === "time" ? (
            <>
              <Clock className="w-3 h-3" />
              <span>{Math.floor(currentValue / 60)} / {Math.floor(goalValue / 60)} minutes</span>
            </>
          ) : goalType === "sessions" ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>{currentValue} / {goalValue} sessions</span>
            </>
          ) : (
            <>
              <Target className="w-3 h-3" />
              <span>{currentValue} / {goalValue} points</span>
            </>
          )}
        </div>
        
        {showCelebration && (
          <span className="text-primary font-medium animate-pulse">
            Goal achieved! 🎉
          </span>
        )}
      </div>
    </Card>
  );
}