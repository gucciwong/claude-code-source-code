"""
SQLite-backed ResearchProgramStore (Phase 4.3 - Storage)

Provides CRUD operations for ResearchProgram records.
Immutable design (create once, update status/metadata only).

Features:
- Auto-initializes database schema
- JSON serialization for search_dimensions
- Timestamp tracking (created_at)
- Pagination support
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime
from typing import Optional, List

from .program import ResearchProgram, SearchDimension


class ResearchProgramStore:
    """SQLite-backed storage for research programs"""
    
    def __init__(self, db_dir: Optional[Path] = None):
        """
        Initialize research program store with SQLite database.
        
        Args:
            db_dir: Directory for database file. If None, uses ~/.sovereign-code/
        """
        if db_dir is None:
            db_dir = Path.home() / ".sovereign-code"
        
        self.db_dir = Path(db_dir)
        self.db_path = self.db_dir / "programs.db"
        
        # Create directory if missing
        self.db_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize database schema on first use
        self._initialize_database()
    
    def _initialize_database(self):
        """Create database and schema if not exists"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Enable WAL mode for reliability
        cursor.execute("PRAGMA journal_mode=WAL")
        
        # Create programs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS programs (
                id TEXT PRIMARY KEY,
                run_tag TEXT NOT NULL,
                goal TEXT NOT NULL,
                description TEXT NOT NULL,
                primary_metric TEXT NOT NULL,
                time_budget_seconds INTEGER NOT NULL,
                max_experiments INTEGER,
                base_model TEXT NOT NULL,
                dataset_path TEXT NOT NULL,
                search_dimensions TEXT NOT NULL,
                max_vram_mb REAL,
                simplicity_preference REAL,
                strategy TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                experiments_completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        
        # Create runs table (for future use: tracking experiment runs under a program)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                program_id TEXT NOT NULL,
                experiment_id TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (program_id) REFERENCES programs (id)
            )
        """)
        
        # Create indexes for common queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_run_tag 
            ON programs (run_tag)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_status 
            ON programs (status)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_created_at 
            ON programs (created_at DESC)
        """)
        
        conn.commit()
        conn.close()
    
    def create(self, program: ResearchProgram) -> ResearchProgram:
        """
        Create and persist a new research program.
        
        Args:
            program: ResearchProgram object to persist
        
        Returns:
            Created ResearchProgram with all fields preserved
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        now = datetime.now()
        
        # Serialize search_dimensions to JSON
        search_dims_json = json.dumps([
            {
                "name": d.name,
                "type": d.type,
                "min_val": d.min_val,
                "max_val": d.max_val,
                "options": d.options,
                "current": d.current
            }
            for d in program.search_dimensions
        ])
        
        cursor.execute("""
            INSERT INTO programs 
            (id, run_tag, goal, description, primary_metric, time_budget_seconds,
             max_experiments, base_model, dataset_path, search_dimensions,
             max_vram_mb, simplicity_preference, strategy, status, 
             experiments_completed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            program.id,
            program.run_tag,
            program.goal,
            program.description,
            program.primary_metric,
            program.time_budget_seconds,
            program.max_experiments,
            program.base_model,
            program.dataset_path,
            search_dims_json,
            program.max_vram_mb,
            program.simplicity_preference,
            program.strategy,
            program.status,
            program.experiments_completed,
            now.isoformat(),
            now.isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        # Return created program with updated timestamps
        program.created_at = now
        return program
    
    def get(self, program_id: str) -> Optional[ResearchProgram]:
        """
        Retrieve a research program by ID.
        
        Args:
            program_id: The program UUID
        
        Returns:
            ResearchProgram object or None if not found
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM programs WHERE id = ?", (program_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row is None:
            return None
        
        return self._row_to_program(row)
    
    def list(
        self,
        limit: int = 100,
        offset: int = 0
    ) -> List[ResearchProgram]:
        """
        List all research programs with pagination.
        
        Results sorted by created_at descending (most recent first).
        
        Args:
            limit: Maximum number of results
            offset: For pagination
        
        Returns:
            List of ResearchProgram objects
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM programs
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_program(row) for row in rows]
    
    def get_total_count(self) -> int:
        """
        Get total count of research programs.
        
        Returns:
            Total number of programs in database
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM programs")
        count = cursor.fetchone()[0]
        conn.close()
        
        return count
    
    def update(self, program_id: str, **kwargs) -> ResearchProgram:
        """
        Update program status and metadata (NOT the search space).
        
        Only allows updating:
        - status (pending, running, completed, stopped)
        - experiments_completed
        
        Args:
            program_id: The program ID
            **kwargs: Fields to update (status, experiments_completed)
        
        Returns:
            Updated ResearchProgram
        
        Raises:
            ValueError: If program not found or invalid field
        """
        # Verify program exists
        program = self.get(program_id)
        if program is None:
            raise ValueError(f"Research program '{program_id}' not found")
        
        # Only allow updating these fields
        allowed_fields = {"status", "experiments_completed"}
        provided_fields = set(kwargs.keys())
        invalid_fields = provided_fields - allowed_fields
        
        if invalid_fields:
            # Silently ignore invalid fields (don't raise, just skip)
            kwargs = {k: v for k, v in kwargs.items() if k in allowed_fields}
        
        if not kwargs:
            # No valid fields provided, return unchanged
            return program
        
        # Build update query
        update_parts = []
        params = []
        
        if "status" in kwargs:
            update_parts.append("status = ?")
            params.append(kwargs["status"])
        
        if "experiments_completed" in kwargs:
            update_parts.append("experiments_completed = ?")
            params.append(kwargs["experiments_completed"])
        
        update_parts.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(program_id)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = f"UPDATE programs SET {', '.join(update_parts)} WHERE id = ?"
        cursor.execute(query, params)
        
        conn.commit()
        conn.close()
        
        # Return updated program
        return self.get(program_id)
    
    def delete(self, program_id: str) -> None:
        """
        Delete a research program.
        
        Args:
            program_id: The program ID
        
        Raises:
            ValueError: If program not found
        """
        # Verify program exists
        program = self.get(program_id)
        if program is None:
            raise ValueError(f"Research program '{program_id}' not found")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Delete runs associated with this program
        cursor.execute("DELETE FROM runs WHERE program_id = ?", (program_id,))
        
        # Delete program
        cursor.execute("DELETE FROM programs WHERE id = ?", (program_id,))
        
        conn.commit()
        conn.close()
    
    def _row_to_program(self, row: tuple) -> ResearchProgram:
        """Convert database row to ResearchProgram object"""
        (
            id, run_tag, goal, description, primary_metric, time_budget_seconds,
            max_experiments, base_model, dataset_path, search_dims_json,
            max_vram_mb, simplicity_preference, strategy, status,
            experiments_completed, created_at, updated_at
        ) = row
        
        # Deserialize search_dimensions from JSON
        dims_data = json.loads(search_dims_json)
        search_dimensions = [
            SearchDimension(
                name=d["name"],
                type=d["type"],
                min_val=d.get("min_val"),
                max_val=d.get("max_val"),
                options=d.get("options"),
                current=d["current"]
            )
            for d in dims_data
        ]
        
        return ResearchProgram(
            id=id,
            run_tag=run_tag,
            goal=goal,
            description=description,
            primary_metric=primary_metric,
            time_budget_seconds=time_budget_seconds,
            max_experiments=max_experiments,
            base_model=base_model,
            dataset_path=dataset_path,
            search_dimensions=search_dimensions,
            max_vram_mb=max_vram_mb,
            simplicity_preference=simplicity_preference,
            strategy=strategy,
            status=status,
            experiments_completed=experiments_completed,
            created_at=datetime.fromisoformat(created_at)
        )
