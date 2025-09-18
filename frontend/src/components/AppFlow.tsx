/**
 * AppFlow Component
 * 
 * This is the main application flow controller for PlainFigures SME Finance Management.
 * It manages the overall application state and routing between different components.
 * 
 * Features:
 * - Application state management (home, onboarding, dashboard)
 * - User authentication flow handling
 * - Onboarding completion and skip functionality
 * - User logout and session management
 * - Component routing based on user state
 * 
 * The component orchestrates the user journey from login through onboarding
 * to the main dashboard application, providing a seamless user experience.
 */

import { useState } from 'react';
import { HomePage } from './HomePage';
import { OnboardingFlow } from './OnboardingFlow';
import { DashboardApp } from './DashboardApp';

interface User {
  id: string;
  email: string;
  company_name: string;
  owner_name: string;
  industry: string;
  country: string;
  hasCompletedOnboarding: boolean;
}

type AppState = 'home' | 'onboarding' | 'dashboard';

export function AppFlow() {
  const [appState, setAppState] = useState<AppState>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    
    // Check if user has completed onboarding
    if (user.hasCompletedOnboarding) {
      setAppState('dashboard');
    } else {
      setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = (onboardingData: any) => {
    // Here you would typically save the onboarding data to your backend
    console.log('Onboarding completed:', onboardingData);
    
    // Update user to mark onboarding as completed
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        hasCompletedOnboarding: true
      });
    }
    
    // Navigate to dashboard
    setAppState('dashboard');
  };

  const handleOnboardingSkip = () => {
    // User skipped onboarding, go to dashboard anyway
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        hasCompletedOnboarding: true
      });
    }
    setAppState('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppState('home');
  };


  // Render appropriate component based on app state
  switch (appState) {
    case 'home':
      return (
        <HomePage 
          onLogin={handleLogin}
        />
      );
    
    case 'onboarding':
      return (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          userId={currentUser?.id}
        />
      );
    
    case 'dashboard':
      return (
        <DashboardApp 
          user={currentUser}
          onLogout={handleLogout}
        />
      );
    
    default:
      return (
        <HomePage 
          onLogin={handleLogin}
        />
      );
  }
}
