import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScoreInputDialogProps {
  onScoreSubmit: (score: number) => void;
  currentScore: number;
}

export function ScoreInputDialog({ 
  onScoreSubmit, 
  currentScore = 0
}: ScoreInputDialogProps) {
  const [open, setOpen] = useState(false);
  const [scoreValue, setScoreValue] = useState<number>(currentScore);

  const handleSave = () => {
    onScoreSubmit(scoreValue);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start"
        >
          <PenLine className="w-4 h-4 mr-2" />
          Enter Exam Score
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Your Exam Score</DialogTitle>
          <DialogDescription>
            Record your exam score to track your progress toward your goal
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="score-value">Score</Label>
              <Input 
                id="score-value"
                type="number" 
                min="0"
                max="1000"
                value={scoreValue}
                onChange={(e) => setScoreValue(parseInt(e.target.value) || 0)}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Score</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}