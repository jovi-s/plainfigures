"""
Simple in-memory cache with TTL (Time To Live) for caching expensive API calls
"""

import time
from typing import Any, Optional, Dict
from datetime import datetime, timedelta


class TTLCache:
    """Simple in-memory cache with Time To Live (TTL) support"""
    
    def __init__(self, default_ttl_seconds: int = 1800):  # 30 minutes default
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl_seconds
    
    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Set a value in the cache with optional TTL override"""
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        expiry_time = time.time() + ttl
        
        self.cache[key] = {
            'value': value,
            'expiry': expiry_time,
            'created_at': time.time()
        }
        
        print(f"Cache SET: {key} (TTL: {ttl}s, expires at: {datetime.fromtimestamp(expiry_time)})")
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache, returns None if expired or not found"""
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        current_time = time.time()
        
        if current_time > entry['expiry']:
            # Entry has expired, remove it
            del self.cache[key]
            print(f"Cache EXPIRED: {key}")
            return None
        
        age_minutes = (current_time - entry['created_at']) / 60
        print(f"Cache HIT: {key} (age: {age_minutes:.1f} minutes)")
        return entry['value']
    
    def delete(self, key: str) -> bool:
        """Delete a specific cache entry"""
        if key in self.cache:
            del self.cache[key]
            print(f"Cache DELETE: {key}")
            return True
        return False
    
    def clear(self) -> None:
        """Clear all cache entries"""
        self.cache.clear()
        print("Cache CLEARED: All entries removed")
    
    def cleanup_expired(self) -> int:
        """Remove all expired entries and return count of removed items"""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.cache.items() 
            if current_time > entry['expiry']
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            print(f"Cache CLEANUP: Removed {len(expired_keys)} expired entries")
        
        return len(expired_keys)
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        current_time = time.time()
        active_entries = 0
        expired_entries = 0
        
        for entry in self.cache.values():
            if current_time > entry['expiry']:
                expired_entries += 1
            else:
                active_entries += 1
        
        return {
            'total_entries': len(self.cache),
            'active_entries': active_entries,
            'expired_entries': expired_entries,
            'cache_keys': list(self.cache.keys())
        }


# Global cache instance
app_cache = TTLCache(default_ttl_seconds=43200)  # 12 hours default TTL
