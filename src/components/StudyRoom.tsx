import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Lock, Globe, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface StudyRoomProps {
  room: {
    id: string;
    name: string;
    description?: string;
    preset: string;
    isPrivate: boolean;
    participants: { id: string; name: string }[];
    maxParticipants: number;
    createdAt: string;
    createdBy?: string;
  };
  onJoinRoom: (roomId: string) => void;
  onDeleteRoom?: (roomId: string) => void;
  currentUserId?: string;
}

const presetLabels: Record<string, string> = {
  "study": "Study Session",
  "exam-prep": "Exam Prep",
  "reading": "Reading Club",
  "coding": "Coding",
  "homework": "Homework",
  "language": "Language Learning"
};

const presetColors: Record<string, string> = {
  "study": "bg-primary/10 text-primary",
  "exam-prep": "bg-destructive/10 text-destructive",
  "reading": "bg-focus/10 text-focus",
  "coding": "bg-secondary/10 text-secondary",
  "homework": "bg-success/10 text-success",
  "language": "bg-purple-500/10 text-purple-500"
};

export const StudyRoom = ({ room, onJoinRoom, onDeleteRoom, currentUserId }: StudyRoomProps) => {
  const participantCount = room.participants.length;
  const timeAgo = new Date(room.createdAt).toLocaleDateString();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Check if current user is the room owner
  const isOwner = currentUserId && room.createdBy === currentUserId;

  return (
    <Card className="focus-card group cursor-pointer">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {room.name}
              </h3>
              {room.isPrivate ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Globe className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            
            {room.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {room.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={presetColors[room.preset] || "bg-muted text-muted-foreground"}>
            {presetLabels[room.preset] || room.preset}
          </Badge>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{participantCount}/{room.maxParticipants}</span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{timeAgo}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <div className="flex -space-x-2">
            {room.participants.slice(0, 3).map((_, index) => (
              <div
                key={index}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-focus border-2 border-background"
              />
            ))}
            {participantCount > 3 && (
              <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                +{participantCount - 3}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {isOwner && onDeleteRoom && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Study Room</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this room? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onDeleteRoom(room.id);
                        setIsDeleteDialogOpen(false);
                      }}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            <Button
              onClick={() => onJoinRoom(room.id)}
              size="sm"
              className="study-gradient text-white"
              disabled={participantCount >= room.maxParticipants}
            >
              {participantCount >= room.maxParticipants ? "Full" : "Join"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};