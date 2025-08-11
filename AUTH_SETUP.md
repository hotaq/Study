# Authentication Setup Guide

This guide will help you set up the authentication system with Supabase for the GrindGlow study room application.

## Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Project**: Create a new project in Supabase
3. **Database**: Set up your database using the provided schema

## Step 1: Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project details:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL to create your database schema

## Step 3: Authentication Settings

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider if not already enabled
3. Configure **Email Templates** for:
   - Confirm signup
   - Reset password
   - Magic link

## Step 4: Row Level Security (RLS)

The provided SQL includes RLS policies that:
- Allow users to create and manage their own profiles
- Allow public viewing of rooms (unless private)
- Allow users to join/leave rooms
- Protect user study session data

## Features Implemented

### Authentication
- ✅ User registration with email/password
- ✅ User login
- ✅ Protected routes
- ✅ User profile management
- ✅ Session persistence

### Database Schema
- ✅ User profiles table
- ✅ Rooms table with proper constraints
- ✅ Room participants tracking
- ✅ Study sessions analytics
- ✅ RLS policies for security

### Components
- ✅ LoginForm component
- ✅ SignupForm component
- ✅ AuthContext for state management
- ✅ Protected route wrapper
- ✅ Error handling and loading states

## Usage

### Accessing User Data
```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, signIn, signUp, signOut } = useAuth()
  
  if (!user) {
    return <div>Please sign in</div>
  }
  
  return <div>Welcome, {user.email}</div>
}
```

### Creating a New Room
```typescript
import { supabase } from '@/lib/supabase'

const createRoom = async (roomData: any) => {
  const { data, error } = await supabase
    .from('rooms')
    .insert([{
      name: roomData.name,
      description: roomData.description,
      preset: roomData.preset,
      is_private: roomData.isPrivate,
      max_participants: roomData.maxParticipants,
      created_by: user.id
    }])
    
  if (error) throw error
  return data
}
```

## Security Notes

- All database operations are protected by RLS policies
- User authentication is handled by Supabase Auth
- Environment variables are prefixed with `VITE_` for Vite compatibility
- No sensitive data is exposed in client-side code

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `.env` file exists and contains valid Supabase credentials
   - Restart the development server after adding environment variables

2. **"User not created in profiles table"**
   - Check that the `handle_new_user` trigger is properly created
   - Verify the trigger is firing on new user registration

3. **RLS Policy Errors**
   - Ensure all RLS policies are created as shown in the schema
   - Check that the user is properly authenticated

### Development Tips

- Use Supabase's **Table Editor** to verify data is being stored correctly
- Check **Authentication** > **Users** to see registered users
- Use **Logs** in Supabase dashboard to debug issues

## Next Steps

1. Add password reset functionality
2. Implement social login providers (Google, GitHub)
3. Add email verification
4. Create user profile management page
5. Add room creation with user association