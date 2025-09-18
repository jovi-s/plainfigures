import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FinanceApiClient } from '@/api/client';
import { type UserProfile } from '@/api/types';
import { Building2, User, MapPin, Users } from 'lucide-react';

interface UserProfileProps {
  userId?: string;
  userData?: {
    id: string;
    email: string;
    company_name: string;
    owner_name: string;
    industry: string;
    country: string;
    hasCompletedOnboarding: boolean;
  };
}

export function UserProfile({ userId = "1", userData }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('UserProfile: Loading profile for userId:', userId);
        // Always try to load from API first to get complete data
        const response = await FinanceApiClient.getUserProfile(userId);
        console.log('UserProfile: API response:', response);
        if (response.success && response.data) {
          console.log('UserProfile: Setting profile data:', response.data);
          setProfile(response.data);
          setIsLoading(false);
          return;
        }

        // Fallback to userData if API fails
        if (userData) {
          const profileData: UserProfile = {
            user_id: parseInt(userData.id),
            company_name: userData.company_name,
            owner_name: userData.owner_name,
            industry: userData.industry,
            country: userData.country,
            employees: 0, // Default value
            annual_revenue_usd: 0, // Default value
            years_in_business: 0, // Default value
            primary_business_activity: '' // Default value
          };
          setProfile(profileData);
          setIsLoading(false);
          return;
        }

        // If we get here, both API and userData failed
        setError('Failed to load user profile');
      } catch (error) {
        console.error('Failed to load user profile:', error);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, userData]);

  const formatRevenue = (revenue: number | undefined | null) => {
    if (!revenue || isNaN(revenue)) {
      return '$0';
    }
    if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(1)}M`;
    } else if (revenue >= 1000) {
      return `$${(revenue / 1000).toFixed(0)}K`;
    }
    return `$${revenue.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse flex items-center space-x-4">
            <div className="rounded-full bg-neutral-200 h-12 w-12"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="text-center text-red-600">
            <p>Error loading user profile: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-neutral-900 truncate">
                {profile.company_name || 'Unknown Company'}
              </h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {profile.industry || 'Not specified'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{profile.owner_name || 'Unknown Owner'}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{profile.country || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{profile.employees || 0} employees</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-semibold text-neutral-900">
              {formatRevenue(profile.annual_revenue_usd)}
            </div>
            <div className="text-xs text-neutral-500">
              Annual Revenue
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-neutral-600 bg-white/50 rounded p-2">
          <span className="font-medium">Business:</span> {profile.primary_business_activity || 'Not specified'}
        </div>
      </CardContent>
    </Card>
  );
}
