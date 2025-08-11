import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface GoalSettingsDialogProps {
  onGoalChange: (goalType: "time" | "sessions" | "score" | "none", goalValue?: number) => void;
  currentGoalType: "time" | "sessions" | "score" | "none";
  currentGoalValue?: number;
}

export function GoalSettingsDialog({ 
  onGoalChange, 
  currentGoalType = "none", 
  currentGoalValue = 60 
}: GoalSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedGoalType, setSelectedGoalType] = useState<"time" | "sessions" | "score" | "none">(currentGoalType);
  const [goalTimeValue, setGoalTimeValue] = useState<number>(currentGoalType === "time" ? currentGoalValue : 60);
  const [goalSessionsValue, setGoalSessionsValue] = useState<number>(currentGoalType === "sessions" ? currentGoalValue : 3);
  const [goalScoreValue, setGoalScoreValue] = useState<number>(currentGoalType === "score" ? currentGoalValue : 100);

  const handleSave = () => {
    if (selectedGoalType === "time") {
      onGoalChange(selectedGoalType, goalTimeValue);
    } else if (selectedGoalType === "sessions") {
      onGoalChange(selectedGoalType, goalSessionsValue);
    } else if (selectedGoalType === "score") {
      onGoalChange(selectedGoalType, goalScoreValue);
    } else {
      onGoalChange("none");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start"
        >
          <Target className="w-4 h-4 mr-2" />
          Set Study Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Study Goal</DialogTitle>
          <DialogDescription>
            Set a goal to stay motivated and track your progress
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Goal Type</h3>
              <RadioGroup 
                value={selectedGoalType} 
                onValueChange={(value) => setSelectedGoalType(value as "time" | "sessions" | "score" | "none")}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="time" id="time-goal" />
                  <div className="grid gap-1.5 w-full">
                    <Label htmlFor="time-goal" className="font-medium">Study Time Goal</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="5"
                        max="480"
                        value={goalTimeValue}
                        onChange={(e) => setGoalTimeValue(parseInt(e.target.value) || 60)}
                        className="w-20"
                        disabled={selectedGoalType !== "time"}
                      />
                      <span className="text-sm">minutes</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Set a target for total study time
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="sessions" id="sessions-goal" />
                  <div className="grid gap-1.5 w-full">
                    <Label htmlFor="sessions-goal" className="font-medium">Completed Sessions Goal</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="1"
                        max="20"
                        value={goalSessionsValue}
                        onChange={(e) => setGoalSessionsValue(parseInt(e.target.value) || 3)}
                        className="w-20"
                        disabled={selectedGoalType !== "sessions"}
                      />
                      <span className="text-sm">sessions</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Set a target number of completed study sessions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="score" id="score-goal" />
                  <div className="grid gap-1.5 w-full">
                    <Label htmlFor="score-goal" className="font-medium">Exam Score Goal</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="1"
                        max="1000"
                        value={goalScoreValue}
                        onChange={(e) => setGoalScoreValue(parseInt(e.target.value) || 100)}
                        className="w-20"
                        disabled={selectedGoalType !== "score"}
                      />
                      <span className="text-sm">points</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Set a target exam score to achieve
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="none" id="no-goal" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="no-goal" className="font-medium">No Goal</Label>
                    <p className="text-sm text-muted-foreground">
                      Study without a specific target
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}