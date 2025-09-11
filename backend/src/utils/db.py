import json
import os
import sqlite3
import threading
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional


_connection_lock = threading.Lock()
_db_connection: Optional[sqlite3.Connection] = None


def _get_db_path() -> str:
    base_dir = Path(__file__).resolve().parents[2] / "database"
    base_dir.mkdir(parents=True, exist_ok=True)
    return str(base_dir / "memory.db")


def get_connection() -> sqlite3.Connection:
    global _db_connection
    if _db_connection is None:
        with _connection_lock:
            if _db_connection is None:
                _db_connection = sqlite3.connect(_get_db_path(), check_same_thread=False)
                _db_connection.row_factory = sqlite3.Row
    return _db_connection


def init_db() -> None:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS openai_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            cache_key TEXT,
            user_context TEXT,
            data_json TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS market_research (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            cache_key TEXT,
            prompt_context TEXT,
            output_text TEXT NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS enhanced_recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            cache_key TEXT,
            market_hash TEXT,
            user_context TEXT,
            data_json TEXT NOT NULL
        )
        """
    )

    conn.commit()


def _now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


def save_openai_recommendations(data: Dict[str, Any], cache_key: Optional[str] = None, user_context: Optional[Dict[str, Any]] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO openai_recommendations (created_at, cache_key, user_context, data_json)
        VALUES (?, ?, ?, ?)
        """,
        (
            _now_iso(),
            cache_key,
            json.dumps(user_context or {}),
            json.dumps(data or {}),
        ),
    )
    conn.commit()
    return cursor.lastrowid


def save_market_research(output_text: str, cache_key: Optional[str] = None, prompt_context: Optional[str] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO market_research (created_at, cache_key, prompt_context, output_text)
        VALUES (?, ?, ?, ?)
        """,
        (
            _now_iso(),
            cache_key,
            prompt_context or "",
            output_text or "",
        ),
    )
    conn.commit()
    return cursor.lastrowid


def save_enhanced_recommendations(data: Dict[str, Any], cache_key: Optional[str] = None, market_hash: Optional[str] = None, user_context: Optional[Dict[str, Any]] = None) -> int:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO enhanced_recommendations (created_at, cache_key, market_hash, user_context, data_json)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            _now_iso(),
            cache_key,
            market_hash,
            json.dumps(user_context or {}),
            json.dumps(data or {}),
        ),
    )
    conn.commit()
    return cursor.lastrowid


