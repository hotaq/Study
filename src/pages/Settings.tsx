import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Upload } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

export function Settings() {
  const { user, updateProfile, updatePassword } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form states
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Fetch profile data with React Query
  const fetchProfile = async () => {
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error) throw error
    return data as Profile
  }
  
  const { 
    data: profile, 
    isLoading, 
    error: profileError 
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: fetchProfile,
    enabled: !!user
  })
  
  // Set form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setFullName(profile.full_name || '')
    }
  }, [profile])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: { username: string; full_name: string }) => {
      return updateProfile(profileData)
    },
    onSuccess: () => {
      setSuccess('Profile updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
    onError: (error: unknown) => {
      setError(error instanceof Error ? error.message : 'Error updating profile')
    }
  })
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setError('')
    setSuccess('')
    
    updateProfileMutation.mutate({
      username,
      full_name: fullName,
    })
  }

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (password: string) => {
      return updatePassword(password)
    },
    onSuccess: () => {
      setPasswordSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    },
    onError: (error: unknown) => {
      setPasswordError(error instanceof Error ? error.message : 'Error updating password')
    }
  })
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setPasswordError('')
    setPasswordSuccess('')
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }
    
    updatePasswordMutation.mutate(newPassword)
  }

  // Avatar upload mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated')
      
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}-${Math.random()}.${fileExt}`
      
      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      // Update the user's profile with the new avatar URL
      await updateProfile({ avatar_url: data.publicUrl })
      
      return data.publicUrl
    },
    onMutate: () => {
      setUploadingAvatar(true)
      setError('')
      setSuccess('')
    },
    onSuccess: () => {
      setSuccess('Avatar updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
    },
    onError: (error: unknown) => {
      setError(error instanceof Error ? error.message : 'Error uploading avatar')
    },
    onSettled: () => {
      setUploadingAvatar(false)
    }
  })
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return
    }
    
    const file = e.target.files[0]
    uploadAvatarMutation.mutate(file)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <p className="text-center text-sm sm:text-base">Loading profile...</p>
      </div>
    )
  }
  
  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <p className="text-red-500 mb-4 text-center text-sm sm:text-base">Error loading profile</p>
        <Button onClick={() => navigate('/')} size="sm" className="sm:text-base sm:px-6 sm:py-2">Return to Home</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6 sm:py-10 px-4 sm:px-6">
      <div className="flex items-center mb-4 sm:mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold">Account Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-4 sm:gap-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
              <AvatarImage src={profile ? profile.avatar_url || '' : ''} alt={profile ? profile.username || 'User' : 'User'} />
              <AvatarFallback>{profile && profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="text-center">
              <h2 className="text-lg sm:text-xl font-semibold">{profile ? (profile.full_name || profile.username) : ''}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">{user?.email}</p>
            </div>
            
            <div className="w-full">
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center justify-center w-full p-2 border-2 border-dashed rounded-md hover:bg-muted transition-colors">
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-sm">{uploadingAvatar ? 'Uploading...' : 'Change Avatar'}</span>
                </div>
                <Input 
                  id="avatar" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </Label>
            </div>
          </div>
          
          <Separator className="my-2 sm:my-4" />
          
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Account</h3>
            <p className="text-xs text-muted-foreground">Manage your account settings</p>
          </div>
        </div>
        
        <div>
          <Tabs defaultValue="profile">
            <TabsList className="mb-3 sm:mb-4 w-full">
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="password" className="flex-1">Password</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                  <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Update your profile information and how others see you on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
                  <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {success && (
                      <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
                    </div>
                    
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="password">
              <Card>
                <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
                  <CardTitle className="text-lg sm:text-xl">Change Password</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
                  <form onSubmit={handleUpdatePassword} className="space-y-3 sm:space-y-4">
                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}
                    
                    {passwordSuccess && (
                      <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                        <AlertDescription>{passwordSuccess}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                      <Input
                        id="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button type="submit" disabled={updatePasswordMutation.isPending}>
                      {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default Settings