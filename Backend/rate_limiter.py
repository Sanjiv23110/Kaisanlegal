import sqlite3
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

class RateLimiter:
    """Handles document upload rate limiting based on subscription tier."""
    
    def __init__(self, db_path: str = "local_datbase.db"):
        self.db_path = db_path
    
    def get_db_connection(self):
        """Get database connection."""
        return sqlite3.connect(self.db_path, timeout=15.0)
    
    def _is_month_passed(self, last_reset_date: str) -> bool:
        """Check if a month has passed since the last reset date."""
        try:
            # Handle NULL or empty strings
            if not last_reset_date:
                return True
            
            last_reset = datetime.fromisoformat(last_reset_date)
            now = datetime.now()
            return (now.month != last_reset.month) or (now.year != last_reset.year)
        except Exception as e:
            print(f"[RateLimiter] Error checking month: {e}, last_reset_date={last_reset_date}")
            return True
    
    def _reset_monthly_counter(self, user_id: int) -> None:
        """Reset the monthly document counter for a user."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user_profile 
                SET documents_uploaded_this_month = 0, last_reset_date = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (user_id,))
            conn.commit()
        finally:
            conn.close()
    
    def check_upload_limit(self, user_id: int) -> Dict[str, any]:
        """
        Check if user can upload a document.
        Returns: {
            'allowed': bool,
            'remaining': int,
            'tier': str,
            'message': str
        }
        """
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Get user subscription tier and current upload count
            cursor.execute("""
                SELECT subscription_tier, documents_uploaded_this_month, last_reset_date
                FROM user_profile
                WHERE user_id = ?
            """, (user_id,))
            
            result = cursor.fetchone()
            if not result:
                return {
                    'allowed': False,
                    'remaining': 0,
                    'tier': None,
                    'message': 'User not found'
                }
            
            tier, docs_uploaded, last_reset = result
            
            # Handle NULL or missing last_reset_date
            if last_reset is None:
                self._reset_monthly_counter(user_id)
                last_reset = datetime.now().isoformat()
            
            # Premium users have unlimited uploads
            if tier == 'premium':
                return {
                    'allowed': True,
                    'remaining': float('inf'),
                    'tier': 'premium',
                    'message': 'Premium users have unlimited uploads'
                }
            
            # Check if monthly counter needs reset
            if self._is_month_passed(last_reset):
                self._reset_monthly_counter(user_id)
                docs_uploaded = 0
            
            # Free tier: 5 documents per month
            limit = 5
            remaining = max(0, limit - docs_uploaded)
            allowed = remaining > 0
            
            message = f'You have {remaining} uploads remaining this month'
            if not allowed:
                message = 'Monthly upload limit reached. Upgrade to premium for unlimited uploads.'
            
            return {
                'allowed': allowed,
                'remaining': remaining,
                'tier': 'free',
                'message': message
            }
        finally:
            conn.close()
    
    def increment_upload_count(self, user_id: int) -> bool:
        """Increment the document upload count for a user."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user_profile 
                SET documents_uploaded_this_month = documents_uploaded_this_month + 1
                WHERE user_id = ?
            """, (user_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()
    
    def increment_documents_processed(self, user_id: int) -> bool:
        """Increment the total documents processed count for a user."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user_profile 
                SET documents_processed = documents_processed + 1
                WHERE user_id = ?
            """, (user_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()
    
    def get_user_tier_info(self, user_id: int) -> Dict[str, any]:
        """Get user's current subscription tier information."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT subscription_tier, documents_uploaded_this_month, last_reset_date, documents_processed
                FROM user_profile
                WHERE user_id = ?
            """, (user_id,))
            
            result = cursor.fetchone()
            if not result:
                return None
            
            tier, docs_uploaded, last_reset, docs_processed = result
            
            # Handle NULL or missing last_reset_date
            if last_reset is None:
                self._reset_monthly_counter(user_id)
                last_reset = datetime.now().isoformat()
            
            # Check if reset needed
            if self._is_month_passed(last_reset):
                self._reset_monthly_counter(user_id)
                docs_uploaded = 0
            
            limit = float('inf') if tier == 'premium' else 5
            
            return {
                'tier': tier,
                'documents_uploaded': docs_uploaded,
                'monthly_limit': limit,
                'remaining': limit - docs_uploaded if limit != float('inf') else float('inf'),
                'documents_processed': docs_processed
            }
        finally:
            conn.close()

rate_limiter = RateLimiter()
