# PlainFigures Permissions System

## Overview
This document describes the permissions system for PlainFigures SME Finance Management application.

## File Structure
- `permissions.csv` - Main permissions and login information
- `user_sme_profile.csv` - User business profile data
- `PERMISSIONS_README.md` - This documentation file

## Account Types

### 1. Demo Accounts
**Purpose:** For testing and demonstration purposes
- **Password:** `demo123` (for all demo accounts)
- **Access:** Limited to core functionality

### 2. Admin Accounts
**Purpose:** System administration and full access
- **Password:** `admin123`
- **Access:** All permissions including user management

### 3. Test Accounts
**Purpose:** Development and testing
- **Password:** `test123`
- **Access:** Basic functionality for testing

### 4. Guest Accounts
**Purpose:** Read-only access for visitors
- **Password:** `guest123`
- **Access:** View-only permissions

## Available Permissions

| Permission | Description |
|------------|-------------|
| `admin` | Full system administration access |
| `view_dashboard` | Access to main dashboard |
| `add_transactions` | Add new financial transactions |
| `view_invoices` | View and manage invoices |
| `generate_reports` | Generate financial reports |
| `ai_recommendations` | Access to AI-powered recommendations |
| `user_management` | Manage user accounts and permissions |
| `system_settings` | Configure system settings |

## Current Accounts

### 1. Sunrise Trading Co (Demo)
- **Email:** `owner@sunrisetrading.sg`
- **Password:** `demo123`
- **Type:** Demo account with full access
- **Company:** Sunrise Trading Co (Import/Export, Singapore)
- **Owner:** Tan Wei Ming
- **Permissions:** All core permissions

### 2. Demo Company (Demo)
- **Email:** `demo@company.com`
- **Password:** `demo123`
- **Type:** Demo account with limited access
- **Company:** Demo Company (Technology, Malaysia)
- **Owner:** John Doe
- **Permissions:** Basic dashboard and transaction access

### 3. PlainFigures Admin (Admin)
- **Email:** `admin@plainfigures.com`
- **Password:** `admin123`
- **Type:** System administrator
- **Company:** PlainFigures Admin
- **Owner:** Admin User
- **Permissions:** All permissions including user management

### 4. Test Company (Test)
- **Email:** `test@example.com`
- **Password:** `test123`
- **Type:** Development testing
- **Company:** Test Company (Retail, Thailand)
- **Owner:** Jane Smith
- **Permissions:** Basic functionality

### 5. Guest User (Guest)
- **Email:** `guest@plainfigures.com`
- **Password:** `guest123`
- **Type:** Read-only access
- **Company:** Guest User
- **Owner:** Guest User
- **Permissions:** View-only dashboard access

## Security Notes

⚠️ **Important Security Considerations:**
- These are demo/test passwords and should be changed in production
- Passwords are stored in plain text for demo purposes only
- In production, implement proper password hashing (bcrypt, etc.)
- Consider implementing role-based access control (RBAC)
- Add session management and JWT tokens for production use

## Usage Instructions

1. **For Testing:** Use the demo accounts with `demo123` password
2. **For Development:** Use the test account with `test123` password
3. **For Administration:** Use the admin account with `admin123` password
4. **For Read-only Access:** Use the guest account with `guest123` password

## Adding New Accounts

To add a new account, add a row to `permissions.csv` with:
- Unique `user_id`
- Valid `email` address
- Secure `password`
- Appropriate `account_type`
- Company and owner information
- Required `permissions` (comma-separated)
- `status` (active/inactive)
- `created_date` and other metadata

## Integration with User Profile

The `permissions.csv` file works alongside `user_sme_profile.csv`:
- `permissions.csv` handles authentication and access control
- `user_sme_profile.csv` contains detailed business profile information
- Both files use the same `user_id` for linking

## Future Enhancements

- Implement proper password hashing
- Add two-factor authentication (2FA)
- Create role-based permission groups
- Add audit logging for permission changes
- Implement session management
- Add password reset functionality
