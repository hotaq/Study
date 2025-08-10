import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

interface CreateRoomDialogProps {
  onCreateRoom: (room: any) => void;
}

export const CreateRoomDialog = ({ onCreateRoom }: CreateRoomDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    preset: "",
    isPrivate: false,
    maxParticipants: 10
  });

  const presets = [
    { value: "study", label: "Study Session", description: "General study with focus timer" },
    { value: "exam-prep", label: "Exam Preparation", description: "Intensive exam preparation" },
    { value: "reading", label: "Reading Club", description: "Quiet reading sessions" },
    { value: "coding", label: "Coding Session", description: "Programming and development" },
    { value: "homework", label: "Homework Help", description: "Collaborative homework sessions" },
    { value: "language", label: "Language Learning", description: "Language practice and learning" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const room = {
      id: Date.now().toString(),
      ...formData,
      participants: [],
      createdAt: new Date().toISOString()
    };
    onCreateRoom(room);
    setOpen(false);
    setFormData({
      name: "",
      description: "",
      preset: "",
      isPrivate: false,
      maxParticipants: 10
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 study-gradient text-white">
          <Plus className="w-5 h-5" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Study Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Study Room"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preset">Study Preset</Label>
            <Select
              value={formData.preset}
              onValueChange={(value) => setFormData({ ...formData, preset: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    <div>
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-sm text-muted-foreground">{preset.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your study room..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              min="1"
              max="50"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label htmlFor="private" className="font-medium">Private Room</Label>
              <p className="text-sm text-muted-foreground">Only you can invite people to this room</p>
            </div>
            <Switch
              id="private"
              checked={formData.isPrivate}
              onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 study-gradient text-white">
              Create Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};