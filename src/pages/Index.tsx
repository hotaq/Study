import { useState, useEffect } from "react";
import { StudyRoom } from "@/components/StudyRoom";
import { CreateRoomDialog } from "@/components/CreateRoomDialog";
import { StudyAnalytics } from "@/components/StudyAnalytics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, BookOpen, Users, LogOut, Settings as SettingsIcon, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Room {
  id: string;
  name: string;
  description?: string;
  preset: string;
  isPrivate: boolean;
  participants: { id: string; name: string }[];
  maxParticipants: number;
  createdAt: string;
  createdBy?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      // First, fetch rooms with their participants
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_participants(user_id)
        `)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Extract all unique user IDs from participants
      const userIds = new Set<string>();
      data.forEach(room => {
        room.room_participants?.forEach((p: { user_id: string }) => {
          if (p.user_id) userIds.add(p.user_id);
        });
      });
      
      // Fetch profiles for all participants in a single query
      const userProfiles: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', Array.from(userIds));
          
        if (!profilesError && profilesData) {
          // Create a map of user_id to username
          profilesData.forEach((profile: { id: string, username: string }) => {
            userProfiles[profile.id] = profile.username;
          });
        }
      }

      // Format rooms with participant information
      const formattedRooms: Room[] = data.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description,
        preset: room.preset,
        isPrivate: room.is_private,
        maxParticipants: room.max_participants,
        createdAt: room.created_at,
        createdBy: room.created_by,
        participants: room.room_participants?.filter((p: { user_id: string }) => {
          // Only include participants that have a valid user_id and a corresponding profile
          return p.user_id && userProfiles[p.user_id];
        }).map((p: { user_id: string }) => ({
          id: p.user_id,
          name: userProfiles[p.user_id]
        })) || []
      }));

      setRooms(formattedRooms);
    } catch (error: unknown) {
      console.error('Error fetching rooms:', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (newRoom: Room) => {
    try {
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Ensure user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profile) {
        // Create profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0]
          });

        if (createProfileError) throw createProfileError;
      }

      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: newRoom.name,
          description: newRoom.description,
          preset: newRoom.preset,
          is_private: newRoom.isPrivate,
          max_participants: newRoom.maxParticipants,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh rooms list
      await fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    try {
      if (!user) {
        console.error('User not authenticated');
        return;
      }
      
      // Add user to room_participants if not already a participant
      const { data: existingParticipant, error: checkError } = await supabase
        .from('room_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking participant:', checkError);
      }
      
      // Only add the user if they're not already a participant
      if (!existingParticipant) {
        const { error: joinError } = await supabase
          .from('room_participants')
          .insert({
            room_id: roomId,
            user_id: user.id
          });
        
        if (joinError) {
          console.error('Error joining room:', joinError);
        }
      }
      
      // Navigate to the room
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Delete the room - RLS policies will ensure only the owner can delete it
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .eq('created_by', user.id);

      if (error) {
        console.error('Error deleting room:', error);
        return;
      }

      // Refresh rooms list after deletion
      await fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
    }
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
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <CreateRoomDialog onCreateRoom={handleCreateRoom} />
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/analytics')}
              >
                <Users className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate('/login');
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[250px] sm:w-[300px]">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <CreateRoomDialog onCreateRoom={handleCreateRoom} />
                    <ThemeToggle />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/analytics')}
                      className="justify-start"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Analytics
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/settings')}
                      className="justify-start"
                    >
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await signOut();
                        navigate('/login');
                      }}
                      className="justify-start"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Tabs defaultValue="rooms" className="space-y-6 sm:space-y-8">
          <TabsList className="grid w-full max-w-xs sm:max-w-md mx-auto grid-cols-2 bg-muted">
            <TabsTrigger value="rooms" className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              Study Rooms
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-8 sm:py-12 study-gradient rounded-xl sm:rounded-2xl text-white px-4">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Study Better Together</h2>
              <p className="text-base sm:text-xl text-white/90 max-w-2xl mx-auto">
                Join focused study sessions, track your progress, and achieve your goals with a supportive community
              </p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search study rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {publicRooms.length} rooms available
              </div>
            </div>

            {/* Rooms Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {publicRooms.map((room) => (
                  <StudyRoom
                    key={room.id}
                    room={room}
                    onJoinRoom={handleJoinRoom}
                    onDeleteRoom={handleDeleteRoom}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            )}

            {!loading && publicRooms.length === 0 && (
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