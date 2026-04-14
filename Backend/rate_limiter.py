import sqlite3
from datetime import datetime, timedelta
from typing import Dict, Optional

FREE_TIER_LIMIT = 5
CYCLE_DAYS = 14  # Upload cycle resets every 14 days


class RateLimiter:
    """Handles document upload rate limiting based on subscription tier."""

    def __init__(self, db_path: str = "local_datbase.db"):
        self.db_path = db_path

    def get_db_connection(self):
        """Get database connection."""
        conn = sqlite3.connect(self.db_path, timeout=15.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _is_cycle_passed(self, cycle_start: str) -> bool:
        """Check if 14 days have elapsed since cycle_start."""
        try:
            if not cycle_start:
                return True
            start = datetime.fromisoformat(str(cycle_start))
            return (datetime.now() - start) >= timedelta(days=CYCLE_DAYS)
        except Exception as e:
            print(f"[RateLimiter] Error checking cycle: {e}, cycle_start={cycle_start}")
            return True

    def _get_cycle_info(self, cycle_start: str) -> Dict:
        """Return cycle_start, cycle_end, and days_remaining for the current cycle."""
        try:
            if not cycle_start:
                start = datetime.now()
            else:
                start = datetime.fromisoformat(str(cycle_start))
        except Exception:
            start = datetime.now()

        end = start + timedelta(days=CYCLE_DAYS)
        now = datetime.now()
        days_remaining = max(0, (end - now).days)
        return {
            "cycle_start": start.isoformat(),
            "cycle_end": end.isoformat(),
            "days_remaining": days_remaining,
        }

    def _reset_cycle(self, user_id: int) -> None:
        """Reset the 14-day upload cycle for a user."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            now = datetime.now().isoformat()
            cursor.execute(
                """
                UPDATE user_profile
                SET documents_uploaded_this_month = 0,
                    last_reset_date = ?,
                    cycle_start = ?
                WHERE user_id = ?
                """,
                (now, now, user_id),
            )
            conn.commit()
        finally:
            conn.close()

    def create_notification(
        self, user_id: int, notif_type: str, title: str, message: str
    ) -> bool:
        """Insert a new notification for a user, avoiding duplicates of the same type in current cycle."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            # Only create if not already created a non-dismissed one of same type
            existing = cursor.execute(
                """
                SELECT notification_id FROM notifications
                WHERE user_id = ? AND type = ? AND is_dismissed = 0
                """,
                (user_id, notif_type),
            ).fetchone()
            if existing:
                return False  # Already active notification of this type

            cursor.execute(
                """
                INSERT INTO notifications (user_id, type, title, message)
                VALUES (?, ?, ?, ?)
                """,
                (user_id, notif_type, title, message),
            )
            conn.commit()
            return True
        except Exception as e:
            print(f"[RateLimiter] Error creating notification: {e}")
            return False
        finally:
            conn.close()

    def check_upload_limit(self, user_id: int) -> Dict:
        """
        Check if user can upload a document.
        Returns:
            { allowed, remaining, tier, message, cycle_info }
        """
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT subscription_tier, documents_uploaded_this_month,
                       last_reset_date, cycle_start
                FROM user_profile
                WHERE user_id = ?
                """,
                (user_id,),
            )
            result = cursor.fetchone()
            if not result:
                return {
                    "allowed": False,
                    "remaining": 0,
                    "tier": None,
                    "message": "User not found",
                    "cycle_info": {},
                }

            tier = result["subscription_tier"]
            docs_uploaded = result["documents_uploaded_this_month"] or 0
            cycle_start = result["cycle_start"] or result["last_reset_date"]
        finally:
            conn.close()

        # Premium users have unlimited uploads
        if tier == "premium":
            return {
                "allowed": True,
                "remaining": float("inf"),
                "tier": "premium",
                "message": "Premium users have unlimited uploads",
                "cycle_info": {},
            }

        # Check if 14-day cycle has passed
        if self._is_cycle_passed(cycle_start):
            self._reset_cycle(user_id)
            docs_uploaded = 0
            cycle_start = datetime.now().isoformat()

        remaining = max(0, FREE_TIER_LIMIT - docs_uploaded)
        allowed = remaining > 0

        message = f"You have {remaining} upload{'s' if remaining != 1 else ''} remaining this cycle"
        if not allowed:
            message = "Upload limit reached. Upgrade to Premium for unlimited uploads."

        return {
            "allowed": allowed,
            "remaining": remaining,
            "tier": "free",
            "message": message,
            "cycle_info": self._get_cycle_info(cycle_start),
        }

    def increment_upload_count(self, user_id: int) -> Dict:
        """
        Increment upload count and automatically fire notifications at 4 and 5 uploads.
        Returns updated tier info.
        """
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE user_profile
                SET documents_uploaded_this_month = documents_uploaded_this_month + 1
                WHERE user_id = ?
                """,
                (user_id,),
            )
            conn.commit()
            # Fetch new count
            row = cursor.execute(
                "SELECT documents_uploaded_this_month, subscription_tier FROM user_profile WHERE user_id = ?",
                (user_id,),
            ).fetchone()
        finally:
            conn.close()

        if not row:
            return {}

        new_count = row["documents_uploaded_this_month"]
        tier = row["subscription_tier"]

        # Auto-create notifications for free tier
        if tier == "free":
            if new_count == 4:
                self.create_notification(
                    user_id,
                    "warning",
                    "Almost at your limit",
                    f"You have used 4 of {FREE_TIER_LIMIT} uploads this cycle. 1 upload remaining.",
                )
            elif new_count >= FREE_TIER_LIMIT:
                # Dismiss any previous warning if exists
                self._dismiss_notifications_of_type(user_id, "warning")
                self.create_notification(
                    user_id,
                    "limit_reached",
                    "Upload limit reached",
                    "You've used all 5 free uploads for this cycle. Upgrade to Premium for unlimited access.",
                )

        return {"documents_uploaded": new_count}

    def _dismiss_notifications_of_type(self, user_id: int, notif_type: str) -> None:
        """Dismiss all active notifications of a given type for a user."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE notifications SET is_dismissed = 1 WHERE user_id = ? AND type = ?",
                (user_id, notif_type),
            )
            conn.commit()
        finally:
            conn.close()

    def increment_documents_processed(self, user_id: int) -> bool:
        """Increment the total documents processed count for a user."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE user_profile SET documents_processed = documents_processed + 1 WHERE user_id = ?",
                (user_id,),
            )
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def get_user_tier_info(self, user_id: int) -> Optional[Dict]:
        """Get user's current subscription tier information including cycle data."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT subscription_tier, documents_uploaded_this_month,
                       last_reset_date, documents_processed, cycle_start
                FROM user_profile
                WHERE user_id = ?
                """,
                (user_id,),
            )
            result = cursor.fetchone()
            if not result:
                return None

            tier = result["subscription_tier"]
            docs_uploaded = result["documents_uploaded_this_month"] or 0
            docs_processed = result["documents_processed"] or 0
            cycle_start = result["cycle_start"] or result["last_reset_date"]
        finally:
            conn.close()

        # Check if reset needed
        if self._is_cycle_passed(cycle_start):
            self._reset_cycle(user_id)
            docs_uploaded = 0
            cycle_start = datetime.now().isoformat()

        limit = float("inf") if tier == "premium" else FREE_TIER_LIMIT
        remaining = limit - docs_uploaded if limit != float("inf") else float("inf")

        return {
            "tier": tier,
            "documents_uploaded": docs_uploaded,
            "monthly_limit": limit,
            "remaining": remaining,
            "documents_processed": docs_processed,
            "cycle_info": self._get_cycle_info(cycle_start),
        }

    def get_upload_cycle(self, user_id: int) -> Optional[Dict]:
        """Return cycle timing data for a user."""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            row = cursor.execute(
                "SELECT cycle_start, last_reset_date FROM user_profile WHERE user_id = ?",
                (user_id,),
            ).fetchone()
            if not row:
                return None
            cycle_start = row["cycle_start"] or row["last_reset_date"]
        finally:
            conn.close()

        return self._get_cycle_info(cycle_start)


rate_limiter = RateLimiter()
