import { Link } from 'react-router-dom'
import { SignupForm } from '@/components/Auth/SignupForm'

export function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Join GrindGlow</h1>
          <p className="text-muted-foreground mt-2">
            Create your account and start studying with thousands of students
          </p>
        </div>
        
        <SignupForm />
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}