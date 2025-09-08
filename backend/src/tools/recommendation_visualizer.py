"""
AI Recommendations Visualizer
Creates charts and metrics for OpenAI recommendations to make them more actionable
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import base64
import io
from typing import Dict, List, Any, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# Set style for better-looking charts
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

class RecommendationVisualizer:
    """Creates visualizations for AI recommendations"""
    
    def __init__(self, recommendations: List[Dict], financial_data: Dict):
        self.recommendations = recommendations
        self.financial_data = financial_data
        self.charts = {}
        
    def generate_all_charts(self) -> Dict[str, Any]:
        """Generate all recommendation visualization charts"""
        try:
            # Extract financial metrics
            cashflow = self.financial_data.get('cashflow', {})
            total_income = cashflow.get('total_income', 0)
            total_expenses = cashflow.get('total_expenses', 0)
            net_cashflow = cashflow.get('net_cashflow', 0)
            
            # Generate charts
            self.charts['priority_breakdown'] = self._create_priority_breakdown_chart()
            self.charts['financial_health_gauge'] = self._create_financial_health_gauge(
                total_income, total_expenses, net_cashflow
            )
            self.charts['impact_projections'] = self._create_impact_projections_chart(
                total_income, total_expenses
            )
            self.charts['action_timeline'] = self._create_action_timeline_chart()
            
            # Generate insights
            insights = self._generate_insights(total_income, total_expenses, net_cashflow)
            
            return {
                'charts': self.charts,
                'insights': insights,
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'chart_count': len(self.charts),
                    'recommendation_count': len(self.recommendations)
                }
            }
            
        except Exception as e:
            print(f"Error generating recommendation charts: {e}")
            return {'charts': {}, 'insights': {}, 'error': str(e)}
    
    def _create_priority_breakdown_chart(self) -> str:
        """Create a chart showing recommendation priorities and categories"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # Priority breakdown (pie chart)
        priorities = [rec.get('priority', 'medium') for rec in self.recommendations]
        priority_counts = pd.Series(priorities).value_counts()
        
        colors = {'high': '#FF6B6B', 'medium': '#FFD93D', 'low': '#6BCF7F'}
        pie_colors = [colors.get(p, '#95A5A6') for p in priority_counts.index]
        
        wedges, texts, autotexts = ax1.pie(priority_counts.values, 
                                          labels=priority_counts.index.str.title(),
                                          autopct='%1.1f%%',
                                          colors=pie_colors,
                                          startangle=90,
                                          textprops={'fontsize': 11})
        
        ax1.set_title('Recommendation Priorities', fontsize=14, fontweight='bold', pad=20)
        
        # Action items count by category
        categories = []
        action_counts = []
        
        for rec in self.recommendations:
            title = rec.get('title', 'Unknown')
            action_count = len(rec.get('action_items', []))
            categories.append(title.split()[0])  # First word as category
            action_counts.append(action_count)
        
        bars = ax2.bar(range(len(categories)), action_counts, 
                      color=['#FF6B6B', '#FFD93D', '#6BCF7F'][:len(categories)])
        
        ax2.set_title('Action Items by Category', fontsize=14, fontweight='bold', pad=20)
        ax2.set_xlabel('Category', fontsize=12)
        ax2.set_ylabel('Number of Action Items', fontsize=12)
        ax2.set_xticks(range(len(categories)))
        ax2.set_xticklabels(categories, rotation=45, ha='right')
        
        # Add value labels on bars
        for bar, count in zip(bars, action_counts):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 0.05,
                    f'{int(count)}', ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        return self._fig_to_base64(fig)
    
    def _create_financial_health_gauge(self, income: float, expenses: float, net: float) -> str:
        """Create a gauge chart showing financial health metrics"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
        
        # 1. Expense Ratio Gauge
        expense_ratio = (expenses / income * 100) if income > 0 else 0
        self._create_gauge(ax1, expense_ratio, 'Expense Ratio', '%', 
                          good_range=(0, 50), warning_range=(50, 70), danger_range=(70, 100))
        
        # 2. Cashflow Health Gauge
        cashflow_health = min(100, max(0, (net / income * 100) + 50)) if income > 0 else 50
        self._create_gauge(ax2, cashflow_health, 'Cashflow Health', 'Score', 
                          good_range=(70, 100), warning_range=(40, 70), danger_range=(0, 40))
        
        # 3. Revenue Target Progress
        annual_target = 850000  # From user profile
        current_annual = income * 12
        progress = min(100, (current_annual / annual_target * 100)) if annual_target > 0 else 0
        self._create_gauge(ax3, progress, 'Revenue Target', '% of Goal', 
                          good_range=(80, 100), warning_range=(50, 80), danger_range=(0, 50))
        
        # 4. Financial Stability Score (composite)
        stability_score = (
            (100 - expense_ratio) * 0.4 +  # Lower expenses = better
            cashflow_health * 0.4 +         # Higher cashflow = better  
            progress * 0.2                   # Progress to goal
        )
        self._create_gauge(ax4, stability_score, 'Overall Score', 'Points', 
                          good_range=(80, 100), warning_range=(60, 80), danger_range=(0, 60))
        
        plt.suptitle('Financial Health Dashboard', fontsize=16, fontweight='bold', y=0.95)
        plt.tight_layout()
        return self._fig_to_base64(fig)
    
    def _create_gauge(self, ax, value: float, title: str, unit: str, 
                     good_range: Tuple, warning_range: Tuple, danger_range: Tuple):
        """Create a single gauge chart"""
        # Create gauge background
        theta = np.linspace(0, np.pi, 100)
        
        # Color segments
        ax.fill_between(theta, 0, 1, where=(theta <= np.pi * danger_range[1]/100), 
                       color='#FF6B6B', alpha=0.3, label='Poor')
        ax.fill_between(theta, 0, 1, where=((theta > np.pi * danger_range[1]/100) & 
                                           (theta <= np.pi * warning_range[1]/100)), 
                       color='#FFD93D', alpha=0.3, label='Fair')
        ax.fill_between(theta, 0, 1, where=(theta > np.pi * warning_range[1]/100), 
                       color='#6BCF7F', alpha=0.3, label='Good')
        
        # Gauge needle
        needle_angle = np.pi * (1 - value/100)
        ax.arrow(0, 0, 0.8 * np.cos(needle_angle), 0.8 * np.sin(needle_angle),
                head_width=0.05, head_length=0.1, fc='black', ec='black', linewidth=2)
        
        # Center circle
        circle = plt.Circle((0, 0), 0.1, color='black')
        ax.add_patch(circle)
        
        # Value text
        ax.text(0, -0.3, f'{value:.1f}{unit}', ha='center', va='center', 
               fontsize=14, fontweight='bold')
        
        ax.set_xlim(-1.1, 1.1)
        ax.set_ylim(-0.5, 1.1)
        ax.set_aspect('equal')
        ax.axis('off')
        ax.set_title(title, fontsize=12, fontweight='bold', pad=10)
    
    def _create_impact_projections_chart(self, income: float, expenses: float) -> str:
        """Create projections showing potential impact of recommendations"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
        
        # Scenario analysis
        scenarios = {
            'Current': {'income': income, 'expenses': expenses},
            'Revenue +20%': {'income': income * 1.2, 'expenses': expenses},
            'Expenses -10%': {'income': income, 'expenses': expenses * 0.9},
            'Both Improved': {'income': income * 1.2, 'expenses': expenses * 0.9}
        }
        
        scenario_names = list(scenarios.keys())
        net_cashflows = [s['income'] - s['expenses'] for s in scenarios.values()]
        expense_ratios = [s['expenses']/s['income']*100 for s in scenarios.values()]
        
        # Net cashflow comparison
        bars1 = ax1.bar(scenario_names, net_cashflows, 
                       color=['#95A5A6', '#6BCF7F', '#3498DB', '#2ECC71'])
        ax1.set_title('Projected Net Cashflow by Scenario', fontsize=14, fontweight='bold')
        ax1.set_ylabel('Net Cashflow ($)', fontsize=12)
        ax1.tick_params(axis='x', rotation=45)
        
        # Add value labels
        for bar, value in zip(bars1, net_cashflows):
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + (max(net_cashflows)*0.01),
                    f'${value:,.0f}', ha='center', va='bottom', fontweight='bold')
        
        # Expense ratio comparison
        bars2 = ax2.bar(scenario_names, expense_ratios,
                       color=['#95A5A6', '#6BCF7F', '#3498DB', '#2ECC71'])
        ax2.set_title('Expense Ratio by Scenario', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Expense Ratio (%)', fontsize=12)
        ax2.tick_params(axis='x', rotation=45)
        ax2.axhline(y=50, color='green', linestyle='--', alpha=0.7, label='Healthy (<50%)')
        ax2.axhline(y=70, color='orange', linestyle='--', alpha=0.7, label='Warning (>70%)')
        
        # Add value labels
        for bar, value in zip(bars2, expense_ratios):
            height = bar.get_height()
            ax2.text(bar.get_x() + bar.get_width()/2., height + 1,
                    f'{value:.1f}%', ha='center', va='bottom', fontweight='bold')
        
        ax2.legend()
        plt.tight_layout()
        return self._fig_to_base64(fig)
    
    def _create_action_timeline_chart(self) -> str:
        """Create a timeline showing recommended action implementation"""
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Create timeline data
        timeline_data = []
        colors = {'high': '#FF6B6B', 'medium': '#FFD93D', 'low': '#6BCF7F'}
        
        y_pos = 0
        for i, rec in enumerate(self.recommendations):
            priority = rec.get('priority', 'medium')
            title = rec.get('title', f'Recommendation {i+1}')
            actions = rec.get('action_items', [])
            
            # Main recommendation
            ax.barh(y_pos, 30, left=0, height=0.6, 
                   color=colors[priority], alpha=0.7, label=f'{priority.title()} Priority' if i == 0 else "")
            ax.text(15, y_pos, title, ha='center', va='center', fontweight='bold', fontsize=10)
            
            # Action items
            for j, action in enumerate(actions[:2]):  # Show max 2 actions per rec
                y_pos -= 0.8
                ax.barh(y_pos, 20, left=10, height=0.4,
                       color=colors[priority], alpha=0.4)
                action_text = action[:50] + "..." if len(action) > 50 else action
                ax.text(20, y_pos, f"• {action_text}", ha='center', va='center', fontsize=8)
            
            y_pos -= 1.5
        
        ax.set_xlim(0, 40)
        ax.set_ylim(y_pos, 1)
        ax.set_xlabel('Implementation Timeline (Days)', fontsize=12)
        ax.set_title('Recommended Action Implementation Timeline', fontsize=14, fontweight='bold', pad=20)
        ax.set_yticks([])
        
        # Add timeline markers
        for day in [0, 10, 20, 30]:
            ax.axvline(x=day, color='gray', linestyle=':', alpha=0.5)
            ax.text(day, 0.5, f'Day {day}', ha='center', va='bottom', fontsize=9, alpha=0.7)
        
        # Remove duplicate legend entries
        handles, labels = ax.get_legend_handles_labels()
        by_label = dict(zip(labels, handles))
        ax.legend(by_label.values(), by_label.keys(), loc='upper right')
        
        plt.tight_layout()
        return self._fig_to_base64(fig)
    
    def _generate_insights(self, income: float, expenses: float, net: float) -> Dict:
        """Generate insights from recommendations and financial data"""
        expense_ratio = (expenses / income * 100) if income > 0 else 0
        
        # Priority distribution
        priorities = [rec.get('priority', 'medium') for rec in self.recommendations]
        priority_counts = pd.Series(priorities).value_counts().to_dict()
        
        # Action items analysis
        total_actions = sum(len(rec.get('action_items', [])) for rec in self.recommendations)
        
        # Financial health assessment
        if expense_ratio < 50:
            health_status = "excellent"
        elif expense_ratio < 70:
            health_status = "good"
        else:
            health_status = "needs_improvement"
        
        return {
            'summary': {
                'total_recommendations': len(self.recommendations),
                'total_action_items': total_actions,
                'priority_distribution': priority_counts,
                'financial_health': health_status
            },
            'key_metrics': {
                'expense_ratio': expense_ratio,
                'net_cashflow': net,
                'monthly_burn_rate': expenses,
                'revenue_run_rate': income * 12
            },
            'projections': {
                'revenue_growth_20pct': income * 1.2,
                'expense_reduction_10pct': expenses * 0.9,
                'combined_impact': (income * 1.2) - (expenses * 0.9)
            }
        }
    
    def _fig_to_base64(self, fig) -> str:
        """Convert matplotlib figure to base64 string"""
        buffer = io.BytesIO()
        fig.savefig(buffer, format='png', dpi=300, bbox_inches='tight', 
                   facecolor='white', edgecolor='none')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        plt.close(fig)
        return image_base64


def generate_recommendation_charts(recommendations: List[Dict], financial_data: Dict) -> Dict[str, Any]:
    """
    Generate visualization charts for AI recommendations
    
    Args:
        recommendations: List of recommendation dictionaries from OpenAI
        financial_data: Financial data dictionary with cashflow info
    
    Returns:
        Dictionary containing base64-encoded charts and insights
    """
    try:
        visualizer = RecommendationVisualizer(recommendations, financial_data)
        return visualizer.generate_all_charts()
    except Exception as e:
        print(f"Error in generate_recommendation_charts: {e}")
        return {
            'charts': {},
            'insights': {},
            'error': str(e)
        }
