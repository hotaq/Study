import { Link } from 'react-router-dom'
import { LoginForm } from '@/components/Auth/LoginForm'

export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome to GrindGlow</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to start studying with others
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link to="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}