"""
Advanced Financial Forecasting Module
Implements hybrid approach with ARIMA, Prophet, and Random Forest models
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
import warnings
import os
import logging

# Comprehensive warning suppression
warnings.filterwarnings('ignore')
os.environ['PYTHONWARNINGS'] = 'ignore'

# Suppress specific ARIMA warnings that are flooding the console
logging.getLogger('statsmodels.tsa.base.tsa_model').setLevel(logging.CRITICAL)
logging.getLogger('statsmodels.base.model').setLevel(logging.CRITICAL)
logging.getLogger('statsmodels').setLevel(logging.CRITICAL)

# Suppress all statsmodels warnings
warnings.filterwarnings('ignore', category=UserWarning, module='statsmodels')
warnings.filterwarnings('ignore', message='No frequency information was provided')
warnings.filterwarnings('ignore', message='Maximum Likelihood optimization failed to converge')
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=DeprecationWarning)

# Suppress specific warning patterns
warnings.filterwarnings('ignore', message='.*inferred frequency.*')
warnings.filterwarnings('ignore', message='.*Maximum Likelihood optimization.*')

# Time series models
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

# Prophet for business forecasting
from prophet import Prophet

# Machine learning models
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Data processing
import logging

logger = logging.getLogger(__name__)


class AdvancedForecaster:
    """
    Advanced financial forecasting using hybrid approach:
    - ARIMA for short-term (7-30 days) cashflow
    - Prophet for medium-term (30-90 days) business forecasting  
    - Random Forest for category/currency analysis
    - Ensemble for robust predictions
    """
    
    def __init__(self, cashflow_df: pd.DataFrame):
        self.cashflow_df = cashflow_df.copy()
        self.daily_cashflow = self._prepare_daily_data()
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        
    def _prepare_daily_data(self) -> pd.DataFrame:
        """Prepare daily aggregated cashflow data"""
        # Convert to datetime
        self.cashflow_df['payment_date'] = pd.to_datetime(self.cashflow_df['payment_date'])
        
        # Create daily cashflow
        daily = self.cashflow_df.groupby('payment_date').agg({
            'amount_sgd': 'sum',
            'direction': lambda x: (x == 'in').sum() - (x == 'out').sum()  # net direction
        }).reset_index()
        
        # Fill missing dates with 0
        date_range = pd.date_range(
            start=daily['payment_date'].min(),
            end=daily['payment_date'].max(),
            freq='D'
        )
        daily = daily.set_index('payment_date').reindex(date_range, fill_value=0).reset_index()
        daily.columns = ['payment_date', 'daily_amount', 'net_direction']
        
        # Calculate cumulative cashflow
        daily['cumulative'] = daily['daily_amount'].cumsum()
        
        return daily
    
    def _check_stationarity(self, series: pd.Series) -> bool:
        """Check if time series is stationary using Augmented Dickey-Fuller test"""
        result = adfuller(series.dropna())
        return result[1] < 0.05  # p-value < 0.05 means stationary
    
    def _make_stationary(self, series: pd.Series) -> Tuple[pd.Series, int]:
        """Make time series stationary using differencing"""
        diff_order = 0
        current_series = series.copy()
        
        while not self._check_stationarity(current_series) and diff_order < 3:
            current_series = current_series.diff().dropna()
            diff_order += 1
            
        return current_series, diff_order
    
    def forecast_arima(self, days_ahead: int = 30) -> Dict[str, Any]:
        """
        ARIMA forecasting for short-term cashflow (7-30 days)
        Best for: Daily patterns, short-term trends
        """
        try:
            df = self.daily_cashflow.copy()
            
            # Use cumulative cashflow for forecasting
            series = df.set_index('payment_date')['cumulative']
            
            # Make stationary if needed
            stationary_series, diff_order = self._make_stationary(series)
            
            # Auto ARIMA - try different combinations
            best_aic = float('inf')
            best_model = None
            best_order = None
            
            # Grid search for best ARIMA parameters with warning suppression
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                
                for p in range(0, 3):
                    for d in range(0, 2):
                        for q in range(0, 3):
                            try:
                                model = ARIMA(series, order=(p, d, q))
                                fitted_model = model.fit()
                                
                                if fitted_model.aic < best_aic:
                                    best_aic = fitted_model.aic
                                    best_model = fitted_model
                                    best_order = (p, d, q)
                            except:
                                continue
                
                if best_model is None:
                    # Fallback to simple ARIMA(1,1,1)
                    best_model = ARIMA(series, order=(1, 1, 1)).fit()
                    best_order = (1, 1, 1)
            
            # Generate forecasts
            forecast = best_model.forecast(steps=days_ahead)
            conf_int = best_model.get_forecast(steps=days_ahead).conf_int()
            
            # Calculate metrics
            fitted_values = best_model.fittedvalues
            mae = mean_absolute_error(series[1:], fitted_values[1:])
            rmse = np.sqrt(mean_squared_error(series[1:], fitted_values[1:]))
            r2 = r2_score(series[1:], fitted_values[1:])
            
            # Generate future dates
            last_date = series.index[-1]
            future_dates = [last_date + timedelta(days=i) for i in range(1, days_ahead + 1)]
            
            return {
                'model_type': 'ARIMA',
                'model_order': best_order,
                'forecast': forecast.values.tolist(),  # Convert numpy array to list
                'confidence_interval': {
                    'lower': conf_int.iloc[:, 0].values.tolist(),  # Convert numpy array to list
                    'upper': conf_int.iloc[:, 1].values.tolist()   # Convert numpy array to list
                },
                'future_dates': [d.isoformat() for d in future_dates],  # Convert dates to strings
                'metrics': {
                    'mae': float(mae),  # Convert numpy float to Python float
                    'rmse': float(rmse),  # Convert numpy float to Python float
                    'r2_score': float(r2),  # Convert numpy float to Python float
                    'aic': float(best_aic)  # Convert numpy float to Python float
                },
                'trend': 'increasing' if forecast.iloc[-1] > series.iloc[-1] else 'decreasing'
            }
            
        except Exception as e:
            logger.error(f"ARIMA forecasting failed: {e}")
            return self._fallback_forecast(days_ahead, 'ARIMA')
    
    def forecast_prophet(self, days_ahead: int = 90) -> Dict[str, Any]:
        """
        Prophet forecasting for medium-term business planning (30-90 days)
        Best for: Seasonality, holidays, business cycles
        """
        try:
            df = self.daily_cashflow.copy()
            
            # Prepare data for Prophet (requires 'ds' and 'y' columns)
            prophet_df = df[['payment_date', 'cumulative']].copy()
            prophet_df.columns = ['ds', 'y']
            
            # Initialize and fit Prophet model with warning suppression
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                
                model = Prophet(
                    yearly_seasonality=True,
                    weekly_seasonality=True,
                    daily_seasonality=False,
                    seasonality_mode='multiplicative',
                    changepoint_prior_scale=0.05,
                    seasonality_prior_scale=10.0
                )
                
                # Add custom seasonalities for business patterns
                model.add_seasonality(name='monthly', period=30.5, fourier_order=5)
                model.add_seasonality(name='quarterly', period=91.25, fourier_order=3)
                
                model.fit(prophet_df)
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=days_ahead)
            forecast = model.predict(future)
            
            # Extract future predictions
            future_forecast = forecast.tail(days_ahead)
            
            # Calculate metrics on historical data
            historical_forecast = forecast[:-days_ahead]
            mae = mean_absolute_error(prophet_df['y'], historical_forecast['yhat'])
            rmse = np.sqrt(mean_squared_error(prophet_df['y'], historical_forecast['yhat']))
            r2 = r2_score(prophet_df['y'], historical_forecast['yhat'])
            
            return {
                'model_type': 'Prophet',
                'forecast': future_forecast['yhat'].values.tolist(),  # Convert numpy array to list
                'confidence_interval': {
                    'lower': future_forecast['yhat_lower'].values.tolist(),  # Convert numpy array to list
                    'upper': future_forecast['yhat_upper'].values.tolist()   # Convert numpy array to list
                },
                'future_dates': [d.isoformat() for d in future_forecast['ds'].dt.date.tolist()],  # Convert dates to strings
                'metrics': {
                    'mae': float(mae),  # Convert numpy float to Python float
                    'rmse': float(rmse),  # Convert numpy float to Python float
                    'r2_score': float(r2)  # Convert numpy float to Python float
                },
                'trend': 'increasing' if future_forecast['yhat'].iloc[-1] > prophet_df['y'].iloc[-1] else 'decreasing',
                'seasonality': {
                    'yearly': model.params.get('yearly', {}),
                    'weekly': model.params.get('weekly', {}),
                    'monthly': model.params.get('monthly', {})
                }
            }
            
        except Exception as e:
            logger.error(f"Prophet forecasting failed: {e}")
            return self._fallback_forecast(days_ahead, 'Prophet')
    
    def forecast_random_forest(self, days_ahead: int = 30) -> Dict[str, Any]:
        """
        Random Forest for multi-variable analysis and category forecasting
        Best for: Multiple features, non-linear relationships, feature importance
        """
        try:
            df = self.cashflow_df.copy()
            df['payment_date'] = pd.to_datetime(df['payment_date'])
            
            # Feature engineering
            features_df = self._create_features(df)
            
            # Prepare target variable (cumulative cashflow)
            daily_target = self.daily_cashflow.set_index('payment_date')['cumulative']
            
            # Align features with target
            aligned_data = features_df.join(daily_target, how='inner')
            aligned_data = aligned_data.dropna()
            
            if len(aligned_data) < 10:  # Need minimum data
                return self._fallback_forecast(days_ahead, 'RandomForest')
            
            # Prepare features and target
            feature_cols = [col for col in aligned_data.columns if col != 'cumulative']
            X = aligned_data[feature_cols]
            y = aligned_data['cumulative']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, shuffle=False
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train Random Forest
            rf_model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
            
            rf_model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = rf_model.predict(X_test_scaled)
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)
            
            # Feature importance
            feature_importance = dict(zip(feature_cols, rf_model.feature_importances_))
            
            # Generate future predictions
            last_features = features_df.iloc[-1:].copy()
            future_predictions = []
            
            for i in range(days_ahead):
                # Use last prediction to update features for next prediction
                pred = rf_model.predict(scaler.transform(last_features))[0]
                future_predictions.append(pred)
                
                # Update features for next iteration (simplified)
                last_features = last_features.copy()
                # Add time-based features for next day
                last_date = features_df.index[-1] + timedelta(days=i+1)
                last_features.index = [last_date]
                last_features['day_of_week'] = last_date.weekday()
                last_features['day_of_month'] = last_date.day
                last_features['month'] = last_date.month
            
            # Generate future dates
            last_date = features_df.index[-1]
            future_dates = [last_date + timedelta(days=i) for i in range(1, days_ahead + 1)]
            
            return {
                'model_type': 'RandomForest',
                'forecast': future_predictions,  # Already a list
                'confidence_interval': {
                    'lower': [p * 0.9 for p in future_predictions],  # Simplified CI as list
                    'upper': [p * 1.1 for p in future_predictions]   # Simplified CI as list
                },
                'future_dates': [d.isoformat() for d in future_dates],  # Convert dates to strings
                'metrics': {
                    'mae': float(mae),  # Convert numpy float to Python float
                    'rmse': float(rmse),  # Convert numpy float to Python float
                    'r2_score': float(r2)  # Convert numpy float to Python float
                },
                'feature_importance': feature_importance,
                'trend': 'increasing' if future_predictions[-1] > y.iloc[-1] else 'decreasing'
            }
            
        except Exception as e:
            logger.error(f"Random Forest forecasting failed: {e}")
            return self._fallback_forecast(days_ahead, 'RandomForest')
    
    def _create_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create engineered features for Random Forest"""
        features = []
        
        # Daily aggregation
        daily = df.groupby('payment_date').agg({
            'amount_sgd': ['sum', 'mean', 'count'],
            'direction': lambda x: (x == 'in').sum() - (x == 'out').sum()
        }).reset_index()
        
        daily.columns = ['payment_date', 'total_amount', 'avg_amount', 'transaction_count', 'net_direction']
        daily = daily.set_index('payment_date')
        
        # Time-based features
        daily['day_of_week'] = daily.index.dayofweek
        daily['day_of_month'] = daily.index.day
        daily['month'] = daily.index.month
        daily['quarter'] = daily.index.quarter
        daily['is_weekend'] = (daily['day_of_week'] >= 5).astype(int)
        daily['is_month_end'] = (daily['day_of_month'] >= 28).astype(int)
        
        # Rolling features
        daily['amount_7d_avg'] = daily['total_amount'].rolling(7).mean()
        daily['amount_30d_avg'] = daily['total_amount'].rolling(30).mean()
        daily['count_7d_avg'] = daily['transaction_count'].rolling(7).mean()
        
        # Lag features
        daily['amount_lag_1'] = daily['total_amount'].shift(1)
        daily['amount_lag_7'] = daily['total_amount'].shift(7)
        daily['amount_lag_30'] = daily['total_amount'].shift(30)
        
        # Category features (if available)
        if 'category' in df.columns:
            category_daily = df.groupby(['payment_date', 'category'])['amount_sgd'].sum().unstack(fill_value=0)
            daily = daily.join(category_daily, how='left')
        
        # Currency features (if available)
        if 'currency' in df.columns:
            currency_daily = df.groupby(['payment_date', 'currency'])['amount_sgd'].sum().unstack(fill_value=0)
            daily = daily.join(currency_daily, how='left')
        
        # Fill NaN values
        daily = daily.fillna(0)
        
        return daily
    
    def ensemble_forecast(self, days_ahead: int = 30) -> Dict[str, Any]:
        """
        Ensemble forecasting combining multiple models
        Provides robust predictions with confidence intervals
        """
        try:
            # Get forecasts from all models
            arima_result = self.forecast_arima(days_ahead)
            prophet_result = self.forecast_prophet(days_ahead)
            rf_result = self.forecast_random_forest(days_ahead)
            
            # Weight models based on their performance
            arima_weight = 0.4  # Good for short-term
            prophet_weight = 0.4  # Good for seasonality
            rf_weight = 0.2     # Good for multi-variable
            
            # Convert forecasts to numpy arrays for proper multiplication
            arima_forecast = np.array(arima_result['forecast'])
            prophet_forecast = np.array(prophet_result['forecast'])
            rf_forecast = np.array(rf_result['forecast'])
            
            # Ensemble prediction
            ensemble_forecast = (
                arima_forecast * arima_weight +
                prophet_forecast * prophet_weight +
                rf_forecast * rf_weight
            )
            
            # Convert confidence intervals to numpy arrays
            arima_lower = np.array(arima_result['confidence_interval']['lower'])
            prophet_lower = np.array(prophet_result['confidence_interval']['lower'])
            rf_lower = np.array(rf_result['confidence_interval']['lower'])
            
            arima_upper = np.array(arima_result['confidence_interval']['upper'])
            prophet_upper = np.array(prophet_result['confidence_interval']['upper'])
            rf_upper = np.array(rf_result['confidence_interval']['upper'])
            
            # Ensemble confidence interval (weighted average)
            ensemble_lower = (
                arima_lower * arima_weight +
                prophet_lower * prophet_weight +
                rf_lower * rf_weight
            )
            
            ensemble_upper = (
                arima_upper * arima_weight +
                prophet_upper * prophet_weight +
                rf_upper * rf_weight
            )
            
            # Calculate ensemble metrics
            ensemble_metrics = {
                'arima_mae': arima_result['metrics']['mae'],
                'prophet_mae': prophet_result['metrics']['mae'],
                'rf_mae': rf_result['metrics']['mae'],
                'ensemble_mae': np.mean([
                    arima_result['metrics']['mae'],
                    prophet_result['metrics']['mae'],
                    rf_result['metrics']['mae']
                ])
            }
            
            # Determine trend
            current_value = self.daily_cashflow['cumulative'].iloc[-1]
            future_value = ensemble_forecast[-1]
            trend = 'increasing' if future_value > current_value else 'decreasing'
            
            return {
                'model_type': 'Ensemble',
                'forecast': ensemble_forecast.tolist() if hasattr(ensemble_forecast, 'tolist') else ensemble_forecast,  # Convert numpy array to list
                'confidence_interval': {
                    'lower': ensemble_lower.tolist() if hasattr(ensemble_lower, 'tolist') else ensemble_lower,  # Convert numpy array to list
                    'upper': ensemble_upper.tolist() if hasattr(ensemble_upper, 'tolist') else ensemble_upper   # Convert numpy array to list
                },
                'future_dates': arima_result['future_dates'],
                'metrics': ensemble_metrics,
                'trend': trend,
                'model_weights': {
                    'arima': arima_weight,
                    'prophet': prophet_weight,
                    'random_forest': rf_weight
                },
                'individual_models': {
                    'arima': arima_result,
                    'prophet': prophet_result,
                    'random_forest': rf_result
                }
            }
            
        except Exception as e:
            logger.error(f"Ensemble forecasting failed: {e}")
            return self._fallback_forecast(days_ahead, 'Ensemble')
    
    def _fallback_forecast(self, days_ahead: int, model_type: str) -> Dict[str, Any]:
        """Fallback simple linear trend when advanced models fail"""
        try:
            df = self.daily_cashflow.copy()
            series = df['cumulative'].values
            
            # Simple linear trend
            x = np.arange(len(series))
            coeffs = np.polyfit(x, series, 1)
            
            # Generate future predictions
            future_x = np.arange(len(series), len(series) + days_ahead)
            future_predictions = np.polyval(coeffs, future_x)
            
            # Simple confidence interval (±10%)
            ci_range = future_predictions * 0.1
            
            # Generate future dates
            last_date = df['payment_date'].iloc[-1]
            future_dates = [last_date + timedelta(days=i) for i in range(1, days_ahead + 1)]
            
            return {
                'model_type': f'{model_type}_Fallback',
                'forecast': future_predictions.tolist(),  # Convert numpy array to list
                'confidence_interval': {
                    'lower': (future_predictions - ci_range).tolist(),  # Convert numpy array to list
                    'upper': (future_predictions + ci_range).tolist()   # Convert numpy array to list
                },
                'future_dates': [d.isoformat() for d in future_dates],  # Convert dates to strings
                'metrics': {
                    'mae': 0.0,  # Fallback doesn't have proper metrics
                    'rmse': 0.0,
                    'r2_score': 0.0
                },
                'trend': 'increasing' if coeffs[0] > 0 else 'decreasing'
            }
            
        except Exception as e:
            logger.error(f"Fallback forecasting failed: {e}")
            # Ultimate fallback - return current value
            current_value = self.daily_cashflow['cumulative'].iloc[-1]
            return {
                'model_type': 'Ultimate_Fallback',
                'forecast': [current_value] * days_ahead,  # List instead of numpy array
                'confidence_interval': {
                    'lower': [current_value * 0.9] * days_ahead,  # List instead of numpy array
                    'upper': [current_value * 1.1] * days_ahead   # List instead of numpy array
                },
                'future_dates': [],
                'metrics': {'mae': 0.0, 'rmse': 0.0, 'r2_score': 0.0},
                'trend': 'stable'
            }
    
    def get_model_recommendations(self) -> Dict[str, str]:
        """Get recommendations on which model to use for different scenarios"""
        return {
            'short_term_7_30_days': 'ARIMA - Best for daily patterns and short-term trends',
            'medium_term_30_90_days': 'Prophet - Best for seasonality and business cycles',
            'multi_variable_analysis': 'Random Forest - Best for category/currency analysis',
            'robust_forecasting': 'Ensemble - Combines all models for most reliable predictions',
            'business_planning': 'Prophet - Handles holidays, seasonality, and business events',
            'risk_analysis': 'Ensemble - Provides confidence intervals and multiple perspectives'
        }