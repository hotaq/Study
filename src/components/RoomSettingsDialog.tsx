import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
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

interface RoomSettingsDialogProps {
  onTimerModeChange: (mode: "pomodoro" | "unlimited" | "custom", customTime?: number) => void;
  currentMode: "pomodoro" | "unlimited" | "custom";
  onDisplayStyleChange: (style: "circle" | "bar") => void;
  currentDisplayStyle: "circle" | "bar";
  customTime?: number;
}

export function RoomSettingsDialog({ onTimerModeChange, currentMode, onDisplayStyleChange, currentDisplayStyle, customTime = 30 }: RoomSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"pomodoro" | "unlimited" | "custom">(currentMode);
  const [selectedDisplayStyle, setSelectedDisplayStyle] = useState<"circle" | "bar">(currentDisplayStyle);
  const [customTimerValue, setCustomTimerValue] = useState<number>(customTime);

  const handleSave = () => {
    if (selectedMode === "custom") {
      onTimerModeChange(selectedMode, customTimerValue);
    } else {
      onTimerModeChange(selectedMode);
    }
    onDisplayStyleChange(selectedDisplayStyle);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start"
        >
          <Settings className="w-4 h-4 mr-2" />
          Room Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Room Settings</DialogTitle>
          <DialogDescription>
            Configure your study room settings
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Timer Mode</h3>
              <RadioGroup 
                value={selectedMode} 
                onValueChange={(value) => setSelectedMode(value as "pomodoro" | "unlimited" | "custom")}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="pomodoro" id="pomodoro" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="pomodoro" className="font-medium">Pomodoro (25 minutes)</Label>
                    <p className="text-sm text-muted-foreground">
                      Classic 25-minute focused work sessions with breaks
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="unlimited" id="unlimited" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="unlimited" className="font-medium">Unlimited Time</Label>
                    <p className="text-sm text-muted-foreground">
                      Continuous timer with no time limit
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="custom" id="custom" />
                  <div className="grid gap-1.5 w-full">
                    <Label htmlFor="custom" className="font-medium">Custom Timer</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        min="1"
                        max="120"
                        value={customTimerValue}
                        onChange={(e) => setCustomTimerValue(parseInt(e.target.value) || 30)}
                        className="w-20"
                        disabled={selectedMode !== "custom"}
                      />
                      <span className="text-sm">minutes</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Set your own custom timer duration
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Display Style</h3>
              <RadioGroup 
                value={selectedDisplayStyle} 
                onValueChange={(value) => setSelectedDisplayStyle(value as "circle" | "bar")}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="circle" id="circle" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="circle" className="font-medium">Circle</Label>
                    <p className="text-sm text-muted-foreground">
                      Circular progress indicator with timer in the center
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="bar" id="bar" />
                  <div className="grid gap-1.5">
                    <Label htmlFor="bar" className="font-medium">Progress Bar</Label>
                    <p className="text-sm text-muted-foreground">
                      Linear progress bar with timer display above
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}