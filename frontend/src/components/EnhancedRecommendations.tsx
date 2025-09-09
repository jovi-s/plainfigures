import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Calendar, 
  DollarSign,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  ArrowRight,
  Clock,
  Star,
  Shield
} from 'lucide-react';

interface EnhancedRecommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  original_recommendation_reference?: string;
  financial_foundation?: string;
  market_enhancement?: string;
  market_rationale: string;
  financial_impact: string;
  action_items?: string[];
  enhanced_action_items?: Array<{
    original_action: string;
    market_enhancement: string;
    enhanced_action: string;
  }>;
  success_metrics: string[];
  investment_required: string;
  roi_timeline: string;
  data_traceability?: {
    financial_data_source: string;
    market_data_source: string;
  };
}

interface EnhancedRecommendationsProps {
  data: {
    executive_summary: string;
    market_context: {
      key_opportunities: string[];
      main_threats: string[];
      competitive_position: string;
    };
    enhanced_recommendations: EnhancedRecommendation[];
    implementation_roadmap: {
      phase_1_immediate: string[];
      phase_2_short_term: string[];
      phase_3_long_term: string[];
    };
    risk_mitigation: Array<{
      risk: string;
      mitigation_strategy: string;
      monitoring_approach: string;
    }>;
    visualizations?: any;
    generated_at: string;
    integration_type: string;
  };
  onClose: () => void;
}

export function EnhancedRecommendations({ data, onClose }: EnhancedRecommendationsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  return (
    <div id="enhanced-recommendations" className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 via-indigo-50 to-cyan-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-purple-900 text-lg">
                  Enhanced Strategic Recommendations
                </CardTitle>
                <p className="text-purple-700 text-sm mt-1">
                  Market Intelligence + Financial Analysis = Strategic Advantage
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Executive Summary
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {data.executive_summary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Market Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-900 text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Key Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.market_context.key_opportunities.map((opportunity, index) => (
                <li key={index} className="text-green-800 text-xs flex items-start gap-2">
                  <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {opportunity}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-900 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Main Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.market_context.main_threats.map((threat, index) => (
                <li key={index} className="text-red-800 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  {threat}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-900 text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Competitive Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 text-xs leading-relaxed">
              {data.market_context.competitive_position}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          Strategic Recommendations
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.enhanced_recommendations.map((rec, index) => (
            <Card key={index} className="bg-white border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getPriorityIcon(rec.priority)}
                    <div className="flex-1">
                      <CardTitle className="text-gray-900 text-base leading-tight">
                        {rec.title}
                      </CardTitle>
                      <Badge className={`mt-2 text-xs ${getPriorityColor(rec.priority)}`}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Original Recommendation Reference */}
                {rec.original_recommendation_reference && (
                  <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                    <h4 className="font-medium text-blue-900 text-xs mb-1 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" />
                      Building Upon AI Recommendation
                    </h4>
                    <p className="text-blue-800 text-xs leading-relaxed font-medium">
                      {rec.original_recommendation_reference}
                    </p>
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-700 text-sm leading-relaxed">
                  {rec.description}
                </p>

                {/* Financial Foundation */}
                {rec.financial_foundation && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="font-medium text-green-900 text-xs mb-1 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Financial Foundation
                    </h4>
                    <p className="text-green-800 text-xs leading-relaxed">
                      {rec.financial_foundation}
                    </p>
                  </div>
                )}

                {/* Market Enhancement */}
                {rec.market_enhancement && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <h4 className="font-medium text-purple-900 text-xs mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Market Intelligence Enhancement
                    </h4>
                    <p className="text-purple-800 text-xs leading-relaxed">
                      {rec.market_enhancement}
                    </p>
                  </div>
                )}

                {/* Market Rationale */}
                <div className="bg-indigo-50 rounded-lg p-3">
                  <h4 className="font-medium text-indigo-900 text-xs mb-1">Strategic Market Context</h4>
                  <p className="text-indigo-800 text-xs leading-relaxed">
                    {rec.market_rationale}
                  </p>
                </div>

                {/* Financial Impact */}
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="font-medium text-green-900 text-xs mb-1 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Expected Impact
                  </h4>
                  <p className="text-green-800 text-xs leading-relaxed">
                    {rec.financial_impact}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-green-700">
                      <strong>Investment:</strong> {rec.investment_required}
                    </span>
                    <span className="text-green-700">
                      <strong>ROI Timeline:</strong> {rec.roi_timeline}
                    </span>
                  </div>
                </div>

                {/* Enhanced Action Items */}
                <div>
                  <h4 className="font-medium text-gray-900 text-xs mb-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Enhanced Action Items
                  </h4>
                  
                  {rec.enhanced_action_items && rec.enhanced_action_items.length > 0 ? (
                    <div className="space-y-3">
                      {rec.enhanced_action_items.slice(0, 3).map((enhancedItem, itemIndex) => (
                        <div key={itemIndex} className="bg-gray-50 rounded-lg p-3 border-l-4 border-orange-400">
                          {/* Original Action */}
                          <div className="mb-2">
                            <h5 className="font-medium text-orange-900 text-xs mb-1">Original AI Action:</h5>
                            <p className="text-orange-800 text-xs leading-relaxed">
                              {enhancedItem.original_action}
                            </p>
                          </div>
                          
                          {/* Market Enhancement */}
                          <div className="mb-2">
                            <h5 className="font-medium text-purple-900 text-xs mb-1">Market Enhancement:</h5>
                            <p className="text-purple-800 text-xs leading-relaxed">
                              {enhancedItem.market_enhancement}
                            </p>
                          </div>
                          
                          {/* Enhanced Action */}
                          <div>
                            <h5 className="font-medium text-green-900 text-xs mb-1">Enhanced Action:</h5>
                            <p className="text-green-800 text-xs leading-relaxed font-medium">
                              {enhancedItem.enhanced_action}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Fallback to regular action items */
                    <ul className="space-y-1">
                      {(rec.action_items || []).slice(0, 3).map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-700 text-xs flex items-start gap-2">
                          <ArrowRight className="h-3 w-3 mt-0.5 text-purple-500 flex-shrink-0" />
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Success Metrics */}
                <div>
                  <h4 className="font-medium text-gray-900 text-xs mb-2">Success Metrics</h4>
                  <div className="flex flex-wrap gap-1">
                    {rec.success_metrics.slice(0, 3).map((metric, metricIndex) => (
                      <Badge key={metricIndex} variant="outline" className="text-xs px-2 py-1">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Data Traceability */}
                {rec.data_traceability && (
                  <div className="border-t border-gray-200 pt-3 mt-4">
                    <h4 className="font-medium text-gray-700 text-xs mb-2 flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      Data Sources
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 font-medium">💰 Financial:</span>
                        <span className="text-gray-600">{rec.data_traceability.financial_data_source}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 font-medium">📊 Market:</span>
                        <span className="text-gray-600">{rec.data_traceability.market_data_source}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Implementation Roadmap */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Implementation Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              <h4 className="font-semibold text-indigo-900 text-sm mb-2">
                Phase 1: Immediate (30 days)
              </h4>
              <ul className="space-y-1">
                {data.implementation_roadmap.phase_1_immediate.map((item, index) => (
                  <li key={index} className="text-indigo-800 text-xs flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-purple-100">
              <h4 className="font-semibold text-purple-900 text-sm mb-2">
                Phase 2: Short-term (3-6 months)
              </h4>
              <ul className="space-y-1">
                {data.implementation_roadmap.phase_2_short_term.map((item, index) => (
                  <li key={index} className="text-purple-800 text-xs flex items-start gap-2">
                    <span className="text-purple-500">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border border-cyan-100">
              <h4 className="font-semibold text-cyan-900 text-sm mb-2">
                Phase 3: Long-term (12+ months)
              </h4>
              <ul className="space-y-1">
                {data.implementation_roadmap.phase_3_long_term.map((item, index) => (
                  <li key={index} className="text-cyan-800 text-xs flex items-start gap-2">
                    <span className="text-cyan-500">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      {data.visualizations && data.visualizations.charts && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Enhanced Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.visualizations.charts.priority_breakdown && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Priority & Impact Analysis</h4>
                  <img 
                    src={`data:image/png;base64,${data.visualizations.charts.priority_breakdown}`}
                    alt="Priority breakdown chart"
                    className="w-full h-auto rounded border"
                  />
                </div>
              )}
              {data.visualizations.charts.financial_health_gauge && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Financial Health Dashboard</h4>
                  <img 
                    src={`data:image/png;base64,${data.visualizations.charts.financial_health_gauge}`}
                    alt="Financial health gauge"
                    className="w-full h-auto rounded border"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-xs text-gray-500">
        Generated at {new Date(data.generated_at).toLocaleString()} • 
        Integration Type: {data.integration_type}
      </div>
    </div>
  );
}
