/**
 * HomePage Component
 * 
 * This is the main homepage component for PlainFigures SME Finance Management.
 * It provides:
 * - User login and registration functionality
 * - Hero section with app introduction
 * - Feature highlights and benefits
 * - Demo account access for testing
 * - Integration with the permissions system
 * 
 * The component handles authentication flow and redirects users to the dashboard
 * or onboarding process based on their account status.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FinanceApiClient } from '@/api/client';
import { 
  Building2, 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Sparkles
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  company_name: string;
  owner_name: string;
  industry: string;
  country: string;
  hasCompletedOnboarding: boolean;
}

interface HomePageProps {
  onLogin: (user: User) => void;
}

export function HomePage({ onLogin }: HomePageProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    ownerName: ''
  });

  // Demo users for testing
  const demoUsers: User[] = [
    {
      id: '1',
      email: 'owner@sunrisetrading.sg',
      company_name: 'Sunrise Trading Co',
      owner_name: 'Tan Wei Ming',
      industry: 'Import/Export',
      country: 'Singapore',
      hasCompletedOnboarding: true
    },
    {
      id: '2',
      email: 'demo@company.com',
      company_name: 'Demo Company',
      owner_name: 'John Doe',
      industry: 'Technology',
      country: 'Malaysia',
      hasCompletedOnboarding: false
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Try real API first
      const response = await FinanceApiClient.loginUser(loginForm.email, loginForm.password);
      
      if (response.success && response.data) {
        const user: User = {
          id: response.data.user_id.toString(),
          email: response.data.profile.contact_email,
          company_name: response.data.profile.company_name,
          owner_name: response.data.profile.owner_name,
          industry: response.data.profile.industry,
          country: response.data.profile.country,
          hasCompletedOnboarding: !!(response.data.profile.industry && response.data.profile.country)
        };
        onLogin(user);
      } else {
        // Fallback to demo users
        const user = demoUsers.find(u => u.email === loginForm.email);
        
        if (user && loginForm.password === 'demo123') {
          onLogin(user);
        } else {
          setError(response.error || 'Invalid email or password. Use "demo123" as password for demo accounts.');
        }
      }
    } catch (err) {
      // Fallback to demo users on network error
      const user = demoUsers.find(u => u.email === loginForm.email);
      
      if (user && loginForm.password === 'demo123') {
        onLogin(user);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (signupForm.password !== signupForm.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Try real API
      const response = await FinanceApiClient.registerUser(
        signupForm.email,
        signupForm.password,
        signupForm.companyName,
        signupForm.ownerName
      );
      
      if (response.success && response.data) {
        const newUser: User = {
          id: response.data.user_id.toString(),
          email: response.data.profile.contact_email,
          company_name: response.data.profile.company_name,
          owner_name: response.data.profile.owner_name,
          industry: response.data.profile.industry || '',
          country: response.data.profile.country || '',
          hasCompletedOnboarding: false
        };
        
        onLogin(newUser);
      } else {
        setError(response.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (user: User) => {
    onLogin(user);
  };

  const updateLoginForm = (field: string, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }));
  };

  const updateSignupForm = (field: string, value: string) => {
    setSignupForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">plainfigures</h1>
                <p className="text-sm text-gray-500">SME Finance Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Southeast Asia
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-700">AI-Powered</Badge>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Smart Finance Management for 
                <span className="text-blue-600"> Southeast Asian SMEs</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Track cash flow, generate insights, and make data-driven decisions with our AI-powered financial management platform designed specifically for regional businesses.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg border border-gray-200">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">AI Forecasting</h3>
                  <p className="text-sm text-gray-600">Predict cash flow trends</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg border border-gray-200">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Multi-Currency</h3>
                  <p className="text-sm text-gray-600">SGD, MYR, THB, IDR, PHP</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg border border-gray-200">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Regional Focus</h3>
                  <p className="text-sm text-gray-600">Built for SEA businesses</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg border border-gray-200">
                <Target className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Insights</h3>
                  <p className="text-sm text-gray-600">Actionable recommendations</p>
                </div>
              </div>
            </div>

            {/* Demo accounts */}
            <div className="bg-white/80 rounded-lg p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Try Demo Accounts</h3>
              <div className="space-y-2">
                {demoUsers.map((user) => (
                  <Button
                    key={user.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleDemoLogin(user)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{user.company_name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Password: <code className="bg-gray-100 px-1 rounded">demo123</code>
              </p>
            </div>
          </div>

          {/* Right side - Login/Signup form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {isLoginMode ? 'Welcome Back' : 'Get Started'}
                </CardTitle>
                <p className="text-gray-600">
                  {isLoginMode 
                    ? 'Sign in to your account' 
                    : 'Create your business account'
                  }
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Toggle between login and signup */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={isLoginMode ? "default" : "ghost"}
                    className="flex-1"
                    onClick={() => setIsLoginMode(true)}
                  >
                    Login
                  </Button>
                  <Button
                    variant={!isLoginMode ? "default" : "ghost"}
                    className="flex-1"
                    onClick={() => setIsLoginMode(false)}
                  >
                    Sign Up
                  </Button>
                </div>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Login Form */}
                {isLoginMode ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => updateLoginForm('email', e.target.value)}
                          placeholder="owner@company.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={loginForm.password}
                          onChange={(e) => updateLoginForm('password', e.target.value)}
                          placeholder="Enter your password"
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  /* Signup Form */
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="email"
                          value={signupForm.email}
                          onChange={(e) => updateSignupForm('email', e.target.value)}
                          placeholder="owner@company.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Company Name</label>
                      <Input
                        value={signupForm.companyName}
                        onChange={(e) => updateSignupForm('companyName', e.target.value)}
                        placeholder="Your Company Name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Owner/Manager Name</label>
                      <Input
                        value={signupForm.ownerName}
                        onChange={(e) => updateSignupForm('ownerName', e.target.value)}
                        placeholder="Your Name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={signupForm.password}
                          onChange={(e) => updateSignupForm('password', e.target.value)}
                          placeholder="Create a password"
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={signupForm.confirmPassword}
                          onChange={(e) => updateSignupForm('confirmPassword', e.target.value)}
                          placeholder="Confirm your password"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <CheckCircle className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Additional info */}
                <div className="text-center text-sm text-gray-500">
                  {isLoginMode ? (
                    <p>
                      Don't have an account?{' '}
                      <button
                        onClick={() => setIsLoginMode(false)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p>
                      Already have an account?{' '}
                      <button
                        onClick={() => setIsLoginMode(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
