import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Calendar, Clock, Users, BookOpen, GraduationCap, Chrome } from 'lucide-react';
import heroImage from '@/assets/hero-timetable.jpg';

const Auth = () => {
  const { user, loading, signUp, signIn, signInWithOAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    email: '', 
    password: '', 
    full_name: '', 
    role: 'student' 
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <LoadingSpinner size="lg" className="text-primary-foreground" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(signInData.email, signInData.password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signUp(signUpData.email, signUpData.password, {
      full_name: signUpData.full_name,
      role: signUpData.role
    });
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signInWithOAuth('google');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col lg:flex-row">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-8 text-primary-foreground">
        <div className="max-w-lg text-center lg:text-left animate-slide-up">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
            <div className="p-3 bg-primary-foreground/20 rounded-2xl backdrop-blur-sm">
              <Calendar className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold">TimetableWise</h1>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            AI-Powered
            <span className="block bg-gradient-to-r from-accent-light to-secondary-light bg-clip-text text-transparent">
              Timetable Generator
            </span>
          </h2>
          
          <p className="text-xl mb-8 opacity-90 leading-relaxed">
            Revolutionize academic scheduling with intelligent automation, 
            real-time updates, and seamless collaboration.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
              <Clock className="h-6 w-6 text-accent-light" />
              <span>Smart Optimization</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
              <Users className="h-6 w-6 text-secondary-light" />
              <span>Real-time Sync</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
              <BookOpen className="h-6 w-6 text-accent-light" />
              <span>Conflict-free</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
              <GraduationCap className="h-6 w-6 text-secondary-light" />
              <span>Multi-role Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Form Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-xl border-0 bg-gradient-card backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Chrome className="h-5 w-5" />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      placeholder="John Doe"
                      value={signUpData.full_name}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, full_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={signUpData.role} onValueChange={(value) => setSignUpData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    size="lg" 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;