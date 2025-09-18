"""
User Management Tools
Handles user registration, profile updates, and authentication
"""

import pandas as pd
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

# Database paths
DATABASE_DIR = Path(__file__).resolve().parents[2] / "database"
USER_PROFILE_CSV_PATH = DATABASE_DIR / "user_sme_profile.csv"

def _ensure_csv_exists():
    """Ensure the user profile CSV exists with proper headers"""
    if not USER_PROFILE_CSV_PATH.exists():
        # Create CSV with headers
        headers = [
            'user_id', 'company_name', 'owner_name', 'industry', 'country', 
            'employees', 'annual_revenue_usd', 'years_in_business', 'primary_business_activity',
            'current_financial_challenges', 'cash_flow_frequency', 'invoice_volume_monthly',
            'expense_categories', 'microfinancing_interest', 'credit_score',
            'banking_relationship_bank_name', 'banking_relationship_years',
            'technology_adoption_level', 'technology_adoption_tools', 'financial_goals',
            'business_address_street', 'business_address_city', 'business_address_province_or_state',
            'business_address_postal_code', 'business_address_country', 'contact_email',
            'contact_phone', 'preferred_language', 'recent_activity'
        ]
        
        df = pd.DataFrame(columns=headers)
        df.to_csv(USER_PROFILE_CSV_PATH, index=False)
        print(f"Created user profile CSV at {USER_PROFILE_CSV_PATH}")

def _get_next_user_id() -> int:
    """Get the next available user ID"""
    _ensure_csv_exists()
    
    try:
        df = pd.read_csv(USER_PROFILE_CSV_PATH)
        if df.empty:
            return 1
        return int(df['user_id'].max()) + 1
    except Exception as e:
        print(f"Error getting next user ID: {e}")
        return 1

def _convert_arrays_to_string(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert array fields to JSON strings for CSV storage"""
    array_fields = [
        'current_financial_challenges', 'expense_categories', 'financial_goals',
        'technology_adoption_tools', 'recent_activity'
    ]
    
    converted_data = data.copy()
    for field in array_fields:
        if field in converted_data and isinstance(converted_data[field], list):
            converted_data[field] = json.dumps(converted_data[field])
        elif field not in converted_data:
            converted_data[field] = json.dumps([])
    
    return converted_data

def _convert_strings_to_arrays(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert JSON string fields back to arrays"""
    array_fields = [
        'current_financial_challenges', 'expense_categories', 'financial_goals',
        'technology_adoption_tools', 'recent_activity'
    ]
    
    converted_data = data.copy()
    for field in array_fields:
        if field in converted_data and isinstance(converted_data[field], str):
            try:
                converted_data[field] = json.loads(converted_data[field])
            except (json.JSONDecodeError, TypeError):
                converted_data[field] = []
        elif field not in converted_data:
            converted_data[field] = []
    
    return converted_data

def create_user_profile(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user profile
    
    Args:
        profile_data: Dictionary containing user profile information
        
    Returns:
        Dictionary with created user profile including user_id
    """
    _ensure_csv_exists()
    
    try:
        # Get next user ID
        user_id = _get_next_user_id()
        
        # Prepare data for CSV storage
        csv_data = _convert_arrays_to_string(profile_data)
        csv_data['user_id'] = user_id
        
        # Add timestamp for recent_activity
        csv_data['recent_activity'] = json.dumps([{
            'action': 'profile_created',
            'timestamp': datetime.now().isoformat(),
            'description': 'User profile created during onboarding'
        }])
        
        # Load existing data
        df = pd.read_csv(USER_PROFILE_CSV_PATH)
        
        # Add new row
        new_row = pd.DataFrame([csv_data])
        df = pd.concat([df, new_row], ignore_index=True)
        
        # Save back to CSV
        df.to_csv(USER_PROFILE_CSV_PATH, index=False)
        
        print(f"Created user profile for user_id: {user_id}")
        
        # Return the created profile with arrays converted back
        return _convert_strings_to_arrays(csv_data)
        
    except Exception as e:
        print(f"Error creating user profile: {e}")
        raise Exception(f"Failed to create user profile: {str(e)}")

def update_user_profile(user_id: int, profile_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing user profile
    
    Args:
        user_id: ID of the user to update
        profile_data: Dictionary containing updated profile information
        
    Returns:
        Dictionary with updated user profile
    """
    _ensure_csv_exists()
    
    try:
        # Load existing data
        df = pd.read_csv(USER_PROFILE_CSV_PATH)
        
        # Find user
        user_mask = df['user_id'].astype(str) == str(user_id)
        if not user_mask.any():
            raise Exception(f"User with ID {user_id} not found")
        
        # Prepare data for CSV storage
        csv_data = _convert_arrays_to_string(profile_data)
        csv_data['user_id'] = user_id
        
        # Update recent_activity
        try:
            existing_activity = json.loads(df.loc[user_mask, 'recent_activity'].iloc[0])
        except:
            existing_activity = []
        
        existing_activity.append({
            'action': 'profile_updated',
            'timestamp': datetime.now().isoformat(),
            'description': 'User profile updated'
        })
        
        csv_data['recent_activity'] = json.dumps(existing_activity)
        
        # Update the row
        for key, value in csv_data.items():
            if key in df.columns:
                df.loc[user_mask, key] = value
        
        # Save back to CSV
        df.to_csv(USER_PROFILE_CSV_PATH, index=False)
        
        print(f"Updated user profile for user_id: {user_id}")
        
        # Return the updated profile with arrays converted back
        updated_profile = df.loc[user_mask].iloc[0].to_dict()
        return _convert_strings_to_arrays(updated_profile)
        
    except Exception as e:
        print(f"Error updating user profile: {e}")
        raise Exception(f"Failed to update user profile: {str(e)}")

def get_user_profile(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Get user profile by ID
    
    Args:
        user_id: ID of the user
        
    Returns:
        Dictionary with user profile or None if not found
    """
    _ensure_csv_exists()
    
    try:
        df = pd.read_csv(USER_PROFILE_CSV_PATH)
        
        # Find user
        user_mask = df['user_id'].astype(str) == str(user_id)
        if not user_mask.any():
            return None
        
        # Get user data
        user_data = df.loc[user_mask].iloc[0].to_dict()
        
        # Convert arrays back
        return _convert_strings_to_arrays(user_data)
        
    except Exception as e:
        print(f"Error getting user profile: {e}")
        return None

def get_all_user_profiles() -> List[Dict[str, Any]]:
    """
    Get all user profiles
    
    Returns:
        List of dictionaries with user profiles
    """
    _ensure_csv_exists()
    
    try:
        df = pd.read_csv(USER_PROFILE_CSV_PATH)
        
        if df.empty:
            return []
        
        # Convert all profiles
        profiles = []
        for _, row in df.iterrows():
            profile = _convert_strings_to_arrays(row.to_dict())
            profiles.append(profile)
        
        return profiles
        
    except Exception as e:
        print(f"Error getting all user profiles: {e}")
        return []

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate user by email and password
    
    Args:
        email: User's email address
        password: User's password (in real app, this would be hashed)
        
    Returns:
        User profile if authentication successful, None otherwise
    """
    try:
        profiles = get_all_user_profiles()
        
        for profile in profiles:
            if profile.get('contact_email') == email:
                # In a real app, you would hash the password and compare
                # For demo purposes, we'll accept any password
                return profile
        
        return None
        
    except Exception as e:
        print(f"Error authenticating user: {e}")
        return None

def check_user_exists(email: str) -> bool:
    """
    Check if a user with the given email already exists
    
    Args:
        email: Email address to check
        
    Returns:
        True if user exists, False otherwise
    """
    try:
        profiles = get_all_user_profiles()
        
        for profile in profiles:
            if profile.get('contact_email') == email:
                return True
        
        return False
        
    except Exception as e:
        print(f"Error checking if user exists: {e}")
        return False
