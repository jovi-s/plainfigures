import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FinanceApiClient } from '@/api/client';
import { type UserProfile } from '@/api/types';
import { Building2, User, MapPin, Users } from 'lucide-react';

interface UserProfileProps {
  userId?: string;
}

export function UserProfile({ userId = "1" }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await FinanceApiClient.getUserProfile(userId);
        if (response.success && response.data) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const formatRevenue = (revenue: number) => {
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
                {profile.company_name}
              </h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {profile.industry}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{profile.owner_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{profile.country}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{profile.employees} employees</span>
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
          <span className="font-medium">Business:</span> {profile.primary_business_activity}
        </div>
      </CardContent>
    </Card>
  );
}
