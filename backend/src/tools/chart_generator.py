"""
AI-powered chart generation and forecasting tool
Automatically creates visualizations and predictions based on financial data
"""

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for server environments
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import r2_score, mean_absolute_error
from datetime import datetime, timedelta
import base64
import io
from typing import Dict, List, Any, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

# Set style for better-looking charts
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

class AIChartGenerator:
    """AI-powered chart generation with forecasting capabilities"""
    
    def __init__(self, cashflow_df: pd.DataFrame, user_profile: Dict[str, Any]):
        self.cashflow_df = cashflow_df.copy()
        self.user_profile = user_profile
        self.prepare_data()
    
    def prepare_data(self):
        """Prepare and clean data for analysis"""
        # Convert dates
        self.cashflow_df['payment_date'] = pd.to_datetime(self.cashflow_df['payment_date'], format='%d/%m/%y')
        
        # Convert amounts to SGD (using simplified rates)
        currency_rates = {
            'SGD': 1.0,
            'MYR': 1/3.3,
            'THB': 1/24,
            'IDR': 1/12633,
            'PHP': 1/44,
        }
        
        self.cashflow_df['amount_sgd'] = self.cashflow_df.apply(
            lambda row: row['payment_amount'] * currency_rates.get(row['currency'], 1.0), 
            axis=1
        )
        
        # Create time-based aggregations
        self.daily_cashflow = self.create_daily_cashflow()
        self.category_summary = self.create_category_summary()
        
    def create_daily_cashflow(self) -> pd.DataFrame:
        """Create daily cashflow summary"""
        daily = self.cashflow_df.groupby(['payment_date', 'direction']).agg({
            'amount_sgd': 'sum'
        }).reset_index()
        
        # Pivot to get IN/OUT columns
        daily_pivot = daily.pivot(index='payment_date', columns='direction', values='amount_sgd').fillna(0)
        daily_pivot['net'] = daily_pivot.get('IN', 0) - daily_pivot.get('OUT', 0)
        daily_pivot['cumulative'] = daily_pivot['net'].cumsum()
        
        return daily_pivot.reset_index()
    
    def create_category_summary(self) -> pd.DataFrame:
        """Create category-wise spending summary"""
        return self.cashflow_df.groupby(['category', 'direction']).agg({
            'amount_sgd': ['sum', 'count', 'mean']
        }).round(2)
    
    def forecast_cashflow(self, days_ahead: int = 30) -> Tuple[np.ndarray, Dict[str, float]]:
        """Forecast future cashflow using polynomial regression"""
        df = self.daily_cashflow.copy()
        
        # Prepare features (days since start)
        df['days_since_start'] = (df['payment_date'] - df['payment_date'].min()).dt.days
        
        X = df[['days_since_start']].values
        y = df['cumulative'].values
        
        # Try polynomial features for better fit
        poly_features = PolynomialFeatures(degree=2)
        X_poly = poly_features.fit_transform(X)
        
        # Fit model
        model = LinearRegression()
        model.fit(X_poly, y)
        
        # Generate future predictions
        last_day = X[-1][0]
        future_days = np.array([[last_day + i] for i in range(1, days_ahead + 1)])
        future_days_poly = poly_features.transform(future_days)
        
        predictions = model.predict(future_days_poly)
        
        # Calculate metrics
        y_pred = model.predict(X_poly)
        metrics = {
            'r2_score': r2_score(y, y_pred),
            'mae': mean_absolute_error(y, y_pred),
            'trend': 'increasing' if predictions[-1] > y[-1] else 'decreasing'
        }
        
        return predictions, metrics
    
    def generate_cashflow_trend_chart(self) -> str:
        """Generate cashflow trend chart with forecast"""
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 10))
        
        df = self.daily_cashflow.copy()
        
        # Chart 1: Daily IN/OUT/Net
        ax1.plot(df['payment_date'], df.get('IN', 0), marker='o', label='Income', color='green', linewidth=2)
        ax1.plot(df['payment_date'], df.get('OUT', 0), marker='s', label='Expenses', color='red', linewidth=2)
        ax1.plot(df['payment_date'], df['net'], marker='^', label='Net Cashflow', color='blue', linewidth=2)
        
        ax1.set_title('Daily Cashflow Analysis', fontsize=14, fontweight='bold')
        ax1.set_ylabel('Amount (SGD)', fontsize=12)
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        ax1.tick_params(axis='x', rotation=45)
        
        # Chart 2: Cumulative with forecast
        ax2.plot(df['payment_date'], df['cumulative'], marker='o', label='Actual Cumulative', color='navy', linewidth=2)
        
        # Add forecast
        forecast, metrics = self.forecast_cashflow(30)
        future_dates = pd.date_range(start=df['payment_date'].max() + timedelta(days=1), periods=30, freq='D')
        ax2.plot(future_dates, forecast, '--', marker='x', label='30-Day Forecast', color='orange', linewidth=2)
        
        ax2.set_title(f'Cumulative Cashflow with Forecast (R² = {metrics["r2_score"]:.3f})', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Cumulative Amount (SGD)', fontsize=12)
        ax2.set_xlabel('Date', fontsize=12)
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        ax2.tick_params(axis='x', rotation=45)
        
        # Add target line if available
        if 'annual_revenue_usd' in self.user_profile:
            monthly_target = self.user_profile['annual_revenue_usd'] / 12
            ax2.axhline(y=monthly_target, color='red', linestyle=':', alpha=0.7, label=f'Monthly Target: ${monthly_target:,.0f}')
            ax2.legend()
        
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        chart_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return chart_base64
    
    def generate_category_breakdown_chart(self) -> str:
        """Generate category breakdown pie/bar chart"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        
        # Expense categories pie chart
        expenses = self.cashflow_df[self.cashflow_df['direction'] == 'OUT']
        expense_by_category = expenses.groupby('category')['amount_sgd'].sum().sort_values(ascending=False)
        
        colors = plt.cm.Set3(np.linspace(0, 1, len(expense_by_category)))
        wedges, texts, autotexts = ax1.pie(expense_by_category.values, labels=expense_by_category.index, 
                                          autopct='%1.1f%%', colors=colors, startangle=90)
        ax1.set_title('Expense Breakdown by Category', fontsize=14, fontweight='bold')
        
        # Revenue sources bar chart
        income = self.cashflow_df[self.cashflow_df['direction'] == 'IN']
        income_by_category = income.groupby('category')['amount_sgd'].sum().sort_values(ascending=True)
        
        bars = ax2.barh(range(len(income_by_category)), income_by_category.values, color='lightgreen')
        ax2.set_yticks(range(len(income_by_category)))
        ax2.set_yticklabels(income_by_category.index)
        ax2.set_title('Revenue Sources', fontsize=14, fontweight='bold')
        ax2.set_xlabel('Amount (SGD)', fontsize=12)
        
        # Add value labels on bars
        for i, bar in enumerate(bars):
            width = bar.get_width()
            ax2.text(width + max(income_by_category.values) * 0.01, bar.get_y() + bar.get_height()/2, 
                    f'${width:,.0f}', ha='left', va='center', fontsize=10)
        
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        chart_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return chart_base64
    
    def generate_currency_analysis_chart(self) -> str:
        """Generate multi-currency analysis chart"""
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
        
        # Currency distribution
        currency_totals = self.cashflow_df.groupby('currency')['payment_amount'].sum().sort_values(ascending=False)
        
        bars = ax1.bar(currency_totals.index, currency_totals.values, 
                       color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'])
        ax1.set_title('Transaction Volume by Currency (Original Amounts)', fontsize=14, fontweight='bold')
        ax1.set_ylabel('Amount', fontsize=12)
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            ax1.text(bar.get_x() + bar.get_width()/2., height + max(currency_totals.values) * 0.01,
                    f'{height:,.0f}', ha='center', va='bottom', fontsize=10)
        
        # SGD equivalent timeline
        currency_timeline = self.cashflow_df.groupby(['payment_date', 'currency'])['amount_sgd'].sum().reset_index()
        
        for currency in currency_timeline['currency'].unique():
            curr_data = currency_timeline[currency_timeline['currency'] == currency]
            ax2.plot(curr_data['payment_date'], curr_data['amount_sgd'], 
                    marker='o', label=currency, linewidth=2)
        
        ax2.set_title('Daily Transaction Values (SGD Equivalent)', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Amount (SGD)', fontsize=12)
        ax2.set_xlabel('Date', fontsize=12)
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        ax2.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        
        # Convert to base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        chart_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return chart_base64
    
    def generate_ai_insights(self) -> Dict[str, Any]:
        """Generate AI-powered insights from the data"""
        insights = {
            'summary_stats': {
                'total_transactions': len(self.cashflow_df),
                'date_range': {
                    'start': self.cashflow_df['payment_date'].min().strftime('%Y-%m-%d'),
                    'end': self.cashflow_df['payment_date'].max().strftime('%Y-%m-%d')
                },
                'total_income_sgd': self.cashflow_df[self.cashflow_df['direction'] == 'IN']['amount_sgd'].sum(),
                'total_expenses_sgd': self.cashflow_df[self.cashflow_df['direction'] == 'OUT']['amount_sgd'].sum(),
                'net_cashflow_sgd': self.cashflow_df[self.cashflow_df['direction'] == 'IN']['amount_sgd'].sum() - 
                                   self.cashflow_df[self.cashflow_df['direction'] == 'OUT']['amount_sgd'].sum()
            },
            'forecasting': {},
            'patterns': {},
            'recommendations': []
        }
        
        # Add forecasting insights
        forecast, metrics = self.forecast_cashflow(30)
        insights['forecasting'] = {
            'next_30_days_trend': metrics['trend'],
            'model_accuracy': metrics['r2_score'],
            'predicted_end_value': float(forecast[-1]),
            'confidence': 'high' if metrics['r2_score'] > 0.8 else 'medium' if metrics['r2_score'] > 0.5 else 'low'
        }
        
        # Pattern analysis
        insights['patterns'] = {
            'most_expensive_category': self.cashflow_df[self.cashflow_df['direction'] == 'OUT'].groupby('category')['amount_sgd'].sum().idxmax(),
            'most_profitable_category': self.cashflow_df[self.cashflow_df['direction'] == 'IN'].groupby('category')['amount_sgd'].sum().idxmax(),
            'dominant_currency': self.cashflow_df['currency'].value_counts().index[0],
            'average_transaction_size': float(self.cashflow_df['amount_sgd'].mean())
        }
        
        # AI-generated recommendations
        net_cashflow = insights['summary_stats']['net_cashflow_sgd']
        if net_cashflow > 0:
            insights['recommendations'].append({
                'type': 'positive_cashflow',
                'message': f'Strong positive cashflow of ${net_cashflow:,.2f}. Consider investing surplus in growth opportunities.',
                'priority': 'medium'
            })
        else:
            insights['recommendations'].append({
                'type': 'negative_cashflow', 
                'message': f'Negative cashflow of ${abs(net_cashflow):,.2f}. Focus on expense reduction and revenue increase.',
                'priority': 'high'
            })
        
        return insights


def generate_charts_for_recommendations(cashflow_df: pd.DataFrame, user_profile: Dict[str, Any]) -> Dict[str, Any]:
    """Main function to generate all charts and insights"""
    
    chart_gen = AIChartGenerator(cashflow_df, user_profile)
    
    return {
        'charts': {
            'cashflow_trend': chart_gen.generate_cashflow_trend_chart(),
            'category_breakdown': chart_gen.generate_category_breakdown_chart(), 
            'currency_analysis': chart_gen.generate_currency_analysis_chart()
        },
        'insights': chart_gen.generate_ai_insights(),
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'chart_count': 3,
            'data_points': len(cashflow_df)
        }
    }
