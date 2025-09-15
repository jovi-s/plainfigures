/**
 * OnboardingFlow Component
 * 
 * This is the user onboarding component for PlainFigures SME Finance Management.
 * It provides a multi-phase onboarding process for new users to set up their
 * business profile and preferences.
 * 
 * Features:
 * - 4-phase onboarding process (Essential Business Info, Financial Preferences, 
 *   Banking & Technology, Contact & Location)
 * - Progress indicator showing completion status
 * - Form validation and error handling
 * - Skip functionality for optional sections
 * - Integration with user profile completion API
 * - Responsive design with modern UI components
 * 
 * The component guides users through setting up their SME profile data
 * which is then saved to the backend user_sme_profile.csv database.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FinanceApiClient } from '@/api/client';
import { 
  Building2, 
  MapPin, 
  Target,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface OnboardingData {
  // Phase 1: Essential Business Info
  company_name: string;
  owner_name: string;
  industry: string;
  country: string;
  employees: number;
  annual_revenue_usd: number;
  years_in_business: number;
  primary_business_activity: string;
  
  // Phase 2: Financial Preferences
  current_financial_challenges: string[];
  cash_flow_frequency: string;
  invoice_volume_monthly: number;
  expense_categories: string[];
  financial_goals: string[];
  
  // Phase 3: Banking & Technology
  microfinancing_interest: string;
  credit_score: string;
  banking_relationship_bank_name: string;
  banking_relationship_years: number;
  technology_adoption_level: string;
  technology_adoption_tools: string[];
  
  // Phase 4: Contact & Location
  business_address_street: string;
  business_address_city: string;
  business_address_province_or_state: string;
  business_address_postal_code: string;
  business_address_country: string;
  contact_email: string;
  contact_phone: string;
  preferred_language: string;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
  userId?: string;
}

const INDUSTRIES = [
  'Import/Export', 'Manufacturing', 'Retail', 'Services', 'Technology', 
  'Healthcare', 'Education', 'Construction', 'Agriculture', 'Tourism',
  'Food & Beverage', 'Fashion', 'Real Estate', 'Consulting', 'Other'
];

const COUNTRIES = [
  'Singapore', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines',
  'Vietnam', 'Cambodia', 'Laos', 'Myanmar', 'Brunei'
];

const FINANCIAL_CHALLENGES = [
  'Seasonal cash flow gaps',
  'Delayed customer payments',
  'Currency fluctuation risks',
  'High operating costs',
  'Limited access to credit',
  'Inventory management',
  'Tax compliance',
  'Market competition',
  'Technology adoption',
  'Staff retention'
];

const EXPENSE_CATEGORIES = [
  'Inventory', 'Shipping', 'Staff salaries', 'Office rent', 'Marketing',
  'Equipment', 'Utilities', 'Insurance', 'Professional services', 'Travel'
];

const FINANCIAL_GOALS = [
  'Improve cash flow predictability',
  'Reduce payment collection time',
  'Expand inventory financing',
  'Increase revenue',
  'Reduce expenses',
  'Improve profit margins',
  'Expand to new markets',
  'Digital transformation',
  'Staff growth',
  'Technology upgrade'
];

const TECHNOLOGY_TOOLS = [
  'Accounting software', 'Online banking', 'CRM system', 'Inventory management',
  'E-commerce platform', 'Digital payments', 'Cloud storage', 'Project management',
  'Social media marketing', 'Analytics tools'
];

export function OnboardingFlow({ onComplete, onSkip, userId }: OnboardingFlowProps) {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    // Phase 1
    company_name: '',
    owner_name: '',
    industry: '',
    country: '',
    employees: 0,
    annual_revenue_usd: 0,
    years_in_business: 0,
    primary_business_activity: '',
    
    // Phase 2
    current_financial_challenges: [],
    cash_flow_frequency: '',
    invoice_volume_monthly: 0,
    expense_categories: [],
    financial_goals: [],
    
    // Phase 3
    microfinancing_interest: '',
    credit_score: '',
    banking_relationship_bank_name: '',
    banking_relationship_years: 0,
    technology_adoption_level: '',
    technology_adoption_tools: [],
    
    // Phase 4
    business_address_street: '',
    business_address_city: '',
    business_address_province_or_state: '',
    business_address_postal_code: '',
    business_address_country: '',
    contact_email: '',
    contact_phone: '',
    preferred_language: 'en'
  });

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    const currentArray = data[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateData(field, newArray);
  };

  const isPhaseValid = (phase: number): boolean => {
    switch (phase) {
      case 1:
        return !!(data.company_name && data.owner_name && data.industry && data.country && 
                 data.employees > 0 && data.annual_revenue_usd > 0 && data.primary_business_activity);
      case 2:
        return !!(data.cash_flow_frequency && data.invoice_volume_monthly > 0 && 
                 data.financial_goals.length > 0);
      case 3:
        return true; // Optional phase
      case 4:
        return true; // Optional phase
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentPhase < 4) {
      setCurrentPhase(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentPhase > 1) {
      setCurrentPhase(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (userId) {
        // Send onboarding data to backend
        const response = await FinanceApiClient.completeUserProfile(userId, data);
        
        if (response.success) {
          onComplete(data);
        } else {
          console.error('Failed to save onboarding data:', response.error);
          // Still complete the flow even if backend fails
          onComplete(data);
        }
      } else {
        // No userId, just complete the flow
        onComplete(data);
      }
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
      // Still complete the flow even if backend fails
      onComplete(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPhase1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Tell us about your business</h2>
        <p className="text-gray-600 mt-2">Help us understand your company to provide better insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Company Name *</label>
          <Input
            value={data.company_name}
            onChange={(e) => updateData('company_name', e.target.value)}
            placeholder="e.g., Sunrise Trading Co"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Owner/Manager Name *</label>
          <Input
            value={data.owner_name}
            onChange={(e) => updateData('owner_name', e.target.value)}
            placeholder="e.g., Tan Wei Ming"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Industry *</label>
          <Select value={data.industry} onValueChange={(value) => updateData('industry', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map(industry => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Country *</label>
          <Select value={data.country} onValueChange={(value) => updateData('country', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Number of Employees *</label>
          <Input
            type="number"
            value={data.employees || ''}
            onChange={(e) => updateData('employees', parseInt(e.target.value) || 0)}
            placeholder="e.g., 25"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Annual Revenue (USD) *</label>
          <Input
            type="number"
            value={data.annual_revenue_usd || ''}
            onChange={(e) => updateData('annual_revenue_usd', parseInt(e.target.value) || 0)}
            placeholder="e.g., 850000"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Years in Business</label>
          <Input
            type="number"
            value={data.years_in_business || ''}
            onChange={(e) => updateData('years_in_business', parseInt(e.target.value) || 0)}
            placeholder="e.g., 8"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Primary Business Activity *</label>
          <Textarea
            value={data.primary_business_activity}
            onChange={(e) => updateData('primary_business_activity', e.target.value)}
            placeholder="e.g., Importing electronics from China and distributing across Southeast Asia"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderPhase2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Financial preferences</h2>
        <p className="text-gray-600 mt-2">Help us understand your financial challenges and goals</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Current Financial Challenges</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {FINANCIAL_CHALLENGES.map(challenge => (
              <Badge
                key={challenge}
                variant={data.current_financial_challenges.includes(challenge) ? "default" : "outline"}
                className="cursor-pointer p-2 text-xs"
                onClick={() => toggleArrayItem('current_financial_challenges', challenge)}
              >
                {challenge}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Cash Flow Frequency *</label>
            <Select value={data.cash_flow_frequency} onValueChange={(value) => updateData('cash_flow_frequency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Monthly Invoice Volume *</label>
            <Input
              type="number"
              value={data.invoice_volume_monthly || ''}
              onChange={(e) => updateData('invoice_volume_monthly', parseInt(e.target.value) || 0)}
              placeholder="e.g., 45"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Main Expense Categories</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {EXPENSE_CATEGORIES.map(category => (
              <Badge
                key={category}
                variant={data.expense_categories.includes(category) ? "default" : "outline"}
                className="cursor-pointer p-2 text-xs"
                onClick={() => toggleArrayItem('expense_categories', category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Financial Goals *</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {FINANCIAL_GOALS.map(goal => (
              <Badge
                key={goal}
                variant={data.financial_goals.includes(goal) ? "default" : "outline"}
                className="cursor-pointer p-2 text-xs"
                onClick={() => toggleArrayItem('financial_goals', goal)}
              >
                {goal}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPhase3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CreditCard className="h-12 w-12 text-purple-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Banking & Technology</h2>
        <p className="text-gray-600 mt-2">Optional: Help us understand your current setup</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Microfinancing Interest</label>
          <Select value={data.microfinancing_interest} onValueChange={(value) => updateData('microfinancing_interest', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select interest level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="None">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Credit Score</label>
          <Select value={data.credit_score} onValueChange={(value) => updateData('credit_score', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select credit score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Excellent">Excellent</SelectItem>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Fair">Fair</SelectItem>
              <SelectItem value="Poor">Poor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Primary Bank</label>
          <Input
            value={data.banking_relationship_bank_name}
            onChange={(e) => updateData('banking_relationship_bank_name', e.target.value)}
            placeholder="e.g., DBS Bank"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Banking Relationship (Years)</label>
          <Input
            type="number"
            value={data.banking_relationship_years || ''}
            onChange={(e) => updateData('banking_relationship_years', parseInt(e.target.value) || 0)}
            placeholder="e.g., 5"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Technology Adoption Level</label>
          <Select value={data.technology_adoption_level} onValueChange={(value) => updateData('technology_adoption_level', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select adoption level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Current Technology Tools</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TECHNOLOGY_TOOLS.map(tool => (
              <Badge
                key={tool}
                variant={data.technology_adoption_tools.includes(tool) ? "default" : "outline"}
                className="cursor-pointer p-2 text-xs"
                onClick={() => toggleArrayItem('technology_adoption_tools', tool)}
              >
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPhase4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPin className="h-12 w-12 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Contact & Location</h2>
        <p className="text-gray-600 mt-2">Optional: Complete your business profile</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Business Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">Street Address</label>
              <Input
                value={data.business_address_street}
                onChange={(e) => updateData('business_address_street', e.target.value)}
                placeholder="e.g., 88 Market Street"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">City</label>
              <Input
                value={data.business_address_city}
                onChange={(e) => updateData('business_address_city', e.target.value)}
                placeholder="e.g., Singapore"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">State/Province</label>
              <Input
                value={data.business_address_province_or_state}
                onChange={(e) => updateData('business_address_province_or_state', e.target.value)}
                placeholder="e.g., Central"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Postal Code</label>
              <Input
                value={data.business_address_postal_code}
                onChange={(e) => updateData('business_address_postal_code', e.target.value)}
                placeholder="e.g., 048948"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Country</label>
              <Input
                value={data.business_address_country}
                onChange={(e) => updateData('business_address_country', e.target.value)}
                placeholder="e.g., Singapore"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                value={data.contact_email}
                onChange={(e) => updateData('contact_email', e.target.value)}
                placeholder="e.g., owner@sunrisetrading.sg"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <Input
                value={data.contact_phone}
                onChange={(e) => updateData('contact_phone', e.target.value)}
                placeholder="e.g., +65-6123-4567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Preferred Language</label>
              <Select value={data.preferred_language} onValueChange={(value) => updateData('preferred_language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                  <SelectItem value="th">ไทย</SelectItem>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                  <SelectItem value="tl">Filipino</SelectItem>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 1: return renderPhase1();
      case 2: return renderPhase2();
      case 3: return renderPhase3();
      case 4: return renderPhase4();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            Welcome to plainfigures
          </CardTitle>
          <p className="text-gray-600">Let's set up your business profile</p>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            {[1, 2, 3, 4].map((phase) => (
              <div key={phase} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  phase <= currentPhase 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {phase < currentPhase ? <CheckCircle className="h-4 w-4" /> : phase}
                </div>
                {phase < 4 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    phase < currentPhase ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          {renderCurrentPhase()}
          
          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <div>
              {currentPhase > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
              
              {currentPhase < 4 ? (
                <Button 
                  onClick={handleNext}
                  disabled={!isPhaseValid(currentPhase)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={!isPhaseValid(currentPhase) || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
