import { useState } from "react";
import { StudyRoom } from "@/components/StudyRoom";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { StudyAnalytics } from "@/components/StudyAnalytics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState([
    {
      id: "1",
      name: "Focused Study Session",
      description: "Join us for a productive 2-hour study session with breaks every 25 minutes",
      preset: "study",
      isPrivate: false,
      participants: [{}, {}, {}],
      maxParticipants: 8,
      createdAt: new Date().toISOString()
    },
    {
      id: "2", 
      name: "React Development",
      description: "Building React applications together",
      preset: "coding",
      isPrivate: false,
      participants: [{}],
      maxParticipants: 5,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "3",
      name: "Medical Exam Prep",
      description: "Intensive MCAT preparation session",
      preset: "exam-prep", 
      isPrivate: true,
      participants: [{}, {}],
      maxParticipants: 4,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ]);

  const handleCreateRoom = (newRoom: any) => {
    setRooms([newRoom, ...rooms]);
  };

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publicRooms = filteredRooms.filter(room => !room.isPrivate);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg study-gradient">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">StudyRoom</h1>
                <p className="text-sm text-muted-foreground">Focus together, achieve more</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CreateRoomDialog onCreateRoom={handleCreateRoom} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="rooms" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-muted">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Study Rooms
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-12 study-gradient rounded-2xl text-white">
              <h2 className="text-4xl font-bold mb-4">Study Better Together</h2>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join focused study sessions, track your progress, and achieve your goals with a supportive community
              </p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search study rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {publicRooms.length} rooms available
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicRooms.map((room) => (
                <StudyRoom
                  key={room.id}
                  room={room}
                  onJoinRoom={handleJoinRoom}
                />
              ))}
            </div>

            {publicRooms.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No rooms found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Be the first to create a study room!"}
                </p>
                <CreateRoomDialog onCreateRoom={handleCreateRoom} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <StudyAnalytics />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;