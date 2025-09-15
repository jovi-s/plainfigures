"""
Permissions Management Tools
Handles user authentication, permissions, and access control
"""

import pandas as pd
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

# Database paths
DATABASE_DIR = Path(__file__).resolve().parents[2] / "database"
PERMISSIONS_CSV_PATH = DATABASE_DIR / "permissions.csv"

def _ensure_permissions_csv_exists():
    """Ensure the permissions CSV exists with proper headers"""
    if not PERMISSIONS_CSV_PATH.exists():
        # Create CSV with headers
        headers = [
            'user_id', 'email', 'password', 'account_type', 'company_name', 'owner_name',
            'industry', 'country', 'permissions', 'status', 'created_date', 'last_login', 'notes'
        ]
        df = pd.DataFrame(columns=headers)
        df.to_csv(PERMISSIONS_CSV_PATH, index=False)

def _load_permissions_df() -> pd.DataFrame:
    """Load the permissions DataFrame"""
    _ensure_permissions_csv_exists()
    return pd.read_csv(PERMISSIONS_CSV_PATH)

def _save_permissions_df(df: pd.DataFrame):
    """Save the permissions DataFrame"""
    df.to_csv(PERMISSIONS_CSV_PATH, index=False)

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate a user with email and password
    
    Args:
        email: User's email address
        password: User's password
        
    Returns:
        User data if authentication successful, None otherwise
    """
    try:
        df = _load_permissions_df()
        
        # Find user by email
        user_row = df[df['email'] == email]
        
        if user_row.empty:
            return None
            
        user_data = user_row.iloc[0].to_dict()
        
        # Check password (in production, this should be hashed)
        if user_data['password'] != password:
            return None
            
        # Check if account is active
        if user_data['status'] != 'active':
            return None
            
        # Update last login
        df.loc[df['email'] == email, 'last_login'] = datetime.now().strftime('%Y-%m-%d')
        _save_permissions_df(df)
        
        # Return user data without password
        user_data.pop('password', None)
        return user_data
        
    except Exception as e:
        print(f"Error in authenticate_user: {e}")
        return None

def get_user_permissions(user_id: str) -> List[str]:
    """
    Get permissions for a specific user
    
    Args:
        user_id: User ID
        
    Returns:
        List of permissions
    """
    try:
        df = _load_permissions_df()
        user_row = df[df['user_id'].astype(str) == str(user_id)]
        
        if user_row.empty:
            return []
            
        permissions_str = user_row.iloc[0]['permissions']
        if pd.isna(permissions_str) or permissions_str == '':
            return []
            
        return [p.strip() for p in permissions_str.split(',')]
        
    except Exception as e:
        print(f"Error in get_user_permissions: {e}")
        return []

def check_permission(user_id: str, permission: str) -> bool:
    """
    Check if a user has a specific permission
    
    Args:
        user_id: User ID
        permission: Permission to check
        
    Returns:
        True if user has permission, False otherwise
    """
    user_permissions = get_user_permissions(user_id)
    return permission in user_permissions

def get_all_users() -> List[Dict[str, Any]]:
    """
    Get all users (without passwords)
    
    Returns:
        List of user data
    """
    try:
        df = _load_permissions_df()
        users = df.to_dict('records')
        
        # Remove passwords from response
        for user in users:
            user.pop('password', None)
            
        return users
        
    except Exception as e:
        print(f"Error in get_all_users: {e}")
        return []

def create_user_account(user_data: Dict[str, Any]) -> bool:
    """
    Create a new user account
    
    Args:
        user_data: User account data
        
    Returns:
        True if successful, False otherwise
    """
    try:
        df = _load_permissions_df()
        
        # Check if email already exists
        if not df[df['email'] == user_data['email']].empty:
            return False
            
        # Get next user ID
        if df.empty:
            next_id = 1
        else:
            next_id = int(df['user_id'].max()) + 1
            
        # Prepare new user data
        new_user = {
            'user_id': next_id,
            'email': user_data['email'],
            'password': user_data.get('password', ''),
            'account_type': user_data.get('account_type', 'user'),
            'company_name': user_data.get('company_name', ''),
            'owner_name': user_data.get('owner_name', ''),
            'industry': user_data.get('industry', ''),
            'country': user_data.get('country', ''),
            'permissions': user_data.get('permissions', 'view_dashboard'),
            'status': user_data.get('status', 'active'),
            'created_date': datetime.now().strftime('%Y-%m-%d'),
            'last_login': '',
            'notes': user_data.get('notes', '')
        }
        
        # Add new user
        new_df = pd.concat([df, pd.DataFrame([new_user])], ignore_index=True)
        _save_permissions_df(new_df)
        
        return True
        
    except Exception as e:
        print(f"Error in create_user_account: {e}")
        return False

def update_user_permissions(user_id: str, permissions: List[str]) -> bool:
    """
    Update user permissions
    
    Args:
        user_id: User ID
        permissions: List of new permissions
        
    Returns:
        True if successful, False otherwise
    """
    try:
        df = _load_permissions_df()
        
        # Find user
        user_mask = df['user_id'].astype(str) == str(user_id)
        if user_mask.empty:
            return False
            
        # Update permissions
        df.loc[user_mask, 'permissions'] = ','.join(permissions)
        _save_permissions_df(df)
        
        return True
        
    except Exception as e:
        print(f"Error in update_user_permissions: {e}")
        return False

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get user data by ID (without password)
    
    Args:
        user_id: User ID
        
    Returns:
        User data if found, None otherwise
    """
    try:
        df = _load_permissions_df()
        user_row = df[df['user_id'].astype(str) == str(user_id)]
        
        if user_row.empty:
            return None
            
        user_data = user_row.iloc[0].to_dict()
        user_data.pop('password', None)
        return user_data
        
    except Exception as e:
        print(f"Error in get_user_by_id: {e}")
        return None
