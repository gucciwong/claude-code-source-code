"""
SQLite-backed Persistent Experiment Store (Phase 1.2)

Provides CRUD operations, querying, and export for Experiment records.
Designed for autonomous hyperparameter experimentation (autoresearch integration).

Features:
- Auto-initializes database and schema on first use
- Parameterized queries (SQL injection protection)
- WAL mode for reliability
- JSON serialization for complex fields
- Immutable records (create once, update status/metrics only)
- TSV export for analysis
"""

import sqlite3
import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Any

from .models import Experiment, ExperimentStatus


class ExperimentStore:
    """SQLite-backed storage for experiments"""
    
    def __init__(self, db_dir: Optional[Path] = None):
        """
        Initialize experiment store with SQLite database.
        
        Args:
            db_dir: Directory for database file. If None, uses ~/.sovereign-code/
        """
        if db_dir is None:
            db_dir = Path.home() / ".sovereign-code"
        
        self.db_dir = Path(db_dir)
        self.db_path = self.db_dir / "experiments.db"
        
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
        
        # Create experiments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS experiments (
                id TEXT PRIMARY KEY,
                run_tag TEXT NOT NULL,
                commit_hash TEXT,
                config TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                val_loss REAL,
                val_bpb REAL,
                primary_metric REAL,
                secondary_metrics TEXT,
                peak_vram_mb REAL,
                training_seconds REAL,
                total_seconds REAL,
                created_at TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                parent_experiment_id TEXT,
                changes_from_parent TEXT,
                FOREIGN KEY (parent_experiment_id) REFERENCES experiments (id)
            )
        """)
        
        # Create index for common queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_run_tag_status 
            ON experiments (run_tag, status)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_created_at 
            ON experiments (created_at DESC)
        """)
        
        conn.commit()
        conn.close()
    
    def create(
        self,
        run_tag: str,
        config: Dict[str, Any],
        description: str,
        parent_experiment_id: Optional[str] = None
    ) -> Experiment:
        """
        Create and store a new experiment.
        
        Args:
            run_tag: Run identifier (e.g., "autoresearch/jun15")
            config: Training configuration dict
            description: Human-readable description
            parent_experiment_id: Parent experiment ID for lineage tracking
        
        Returns:
            Created Experiment object
        """
        experiment_id = str(uuid.uuid4())
        now = datetime.now()
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO experiments 
            (id, run_tag, config, description, status, created_at, parent_experiment_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            experiment_id,
            run_tag,
            json.dumps(config),
            description,
            ExperimentStatus.PENDING.value,
            now.isoformat(),
            parent_experiment_id
        ))
        
        conn.commit()
        conn.close()
        
        # Return Experiment object
        return Experiment(
            id=experiment_id,
            run_tag=run_tag,
            config=config,
            description=description,
            status=ExperimentStatus.PENDING,
            created_at=now,
            parent_experiment_id=parent_experiment_id
        )
    
    def get(self, experiment_id: str) -> Optional[Experiment]:
        """
        Retrieve an experiment by ID.
        
        Args:
            experiment_id: The experiment UUID
        
        Returns:
            Experiment object or None if not found
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM experiments WHERE id = ?", (experiment_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row is None:
            return None
        
        return self._row_to_experiment(row)
    
    def list(
        self,
        run_tag: Optional[str] = None,
        status: Optional[ExperimentStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Experiment]:
        """
        List experiments with optional filtering.
        
        Results sorted by created_at descending (most recent first).
        
        Args:
            run_tag: Filter by run_tag
            status: Filter by status
            limit: Maximum number of results
            offset: For pagination
        
        Returns:
            List of Experiment objects
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Build query dynamically
        query = "SELECT * FROM experiments WHERE 1=1"
        params = []
        
        if run_tag is not None:
            query += " AND run_tag = ?"
            params.append(run_tag)
        
        if status is not None:
            query += " AND status = ?"
            params.append(status.value if isinstance(status, ExperimentStatus) else status)
        
        # Sort by created_at descending, apply limit/offset
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_experiment(row) for row in rows]
    
    def update(self, experiment_id: str, **kwargs) -> Experiment:
        """
        Update experiment status and metrics.
        
        Allowed fields: status, val_loss, val_bpb, primary_metric, secondary_metrics,
                       peak_vram_mb, training_seconds, total_seconds, started_at,
                       completed_at, changes_from_parent, commit_hash
        
        Args:
            experiment_id: The experiment to update
            **kwargs: Fields to update
        
        Returns:
            Updated Experiment object
        
        Raises:
            ValueError: If experiment not found
        """
        # Verify experiment exists
        if self.get(experiment_id) is None:
            raise ValueError(f"Experiment {experiment_id} not found")
        
        # Map kwargs to database columns
        allowed_fields = {
            'status', 'val_loss', 'val_bpb', 'primary_metric', 'secondary_metrics',
            'peak_vram_mb', 'training_seconds', 'total_seconds', 'started_at',
            'completed_at', 'changes_from_parent', 'commit_hash'
        }
        
        updates = {}
        for key, value in kwargs.items():
            if key not in allowed_fields:
                raise ValueError(f"Cannot update field: {key}")
            
            # Convert status enum to string
            if key == 'status' and isinstance(value, ExperimentStatus):
                updates[key] = value.value
            # JSON serialize dict fields
            elif key == 'secondary_metrics' and isinstance(value, dict):
                updates[key] = json.dumps(value)
            # Convert datetime to ISO format
            elif key in ('started_at', 'completed_at') and isinstance(value, datetime):
                updates[key] = value.isoformat()
            else:
                updates[key] = value
        
        if not updates:
            return self.get(experiment_id)
        
        # Build UPDATE query
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        params = list(updates.values()) + [experiment_id]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            f"UPDATE experiments SET {set_clause} WHERE id = ?",
            params
        )
        conn.commit()
        conn.close()
        
        return self.get(experiment_id)
    
    def get_best(
        self,
        run_tag: str,
        primary_metric: str = "val_loss"
    ) -> Optional[Experiment]:
        """
        Get the best experiment for a run_tag.
        
        Returns experiment with lowest primary_metric value and status=KEEP.
        
        Args:
            run_tag: The run to search
            primary_metric: Metric column to minimize (default: val_loss)
                           Must be one of: val_loss, val_bpb, primary_metric
        
        Returns:
            Best Experiment or None if no KEEP experiments
        
        Raises:
            ValueError: If primary_metric is not a valid column name
        """
        # Validate metric column name (prevent SQL injection)
        allowed_metrics = {'val_loss', 'val_bpb', 'primary_metric'}
        if primary_metric not in allowed_metrics:
            raise ValueError(f"Invalid metric: {primary_metric}. Must be one of {allowed_metrics}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Query for lowest primary_metric with status=KEEP
        query = f"""
            SELECT * FROM experiments
            WHERE run_tag = ? AND status = ? AND {primary_metric} IS NOT NULL
            ORDER BY {primary_metric} ASC
            LIMIT 1
        """
        
        cursor.execute(query, (run_tag, ExperimentStatus.KEEP.value))
        row = cursor.fetchone()
        conn.close()
        
        if row is None:
            return None
        
        return self._row_to_experiment(row)
    
    def export_tsv(self, run_tag: str, output_path: Path) -> None:
        """
        Export experiments as TSV (tab-separated values).
        
        Format:
        commit_hash    val_loss    val_bpb    peak_vram_mb    status    description
        
        Args:
            run_tag: The run to export
            output_path: Where to write the TSV file
        """
        experiments = self.list(run_tag=run_tag)
        
        output_path = Path(output_path)
        
        with open(output_path, 'w') as f:
            # Write header
            f.write("commit_hash\tval_loss\tval_bpb\tpeak_vram_mb\tstatus\tdescription\n")
            
            # Write data rows (sorted by created_at descending)
            for exp in experiments:
                commit_hash = exp.commit_hash or ""
                val_loss = str(exp.val_loss) if exp.val_loss is not None else ""
                val_bpb = str(exp.val_bpb) if exp.val_bpb is not None else ""
                peak_vram = str(exp.peak_vram_mb) if exp.peak_vram_mb is not None else ""
                status = exp.status.value
                description = exp.description
                
                f.write(f"{commit_hash}\t{val_loss}\t{val_bpb}\t{peak_vram}\t{status}\t{description}\n")
    
    def _row_to_experiment(self, row: tuple) -> Experiment:
        """Convert database row to Experiment object"""
        (
            id_, run_tag, commit_hash, config_json, description, status,
            val_loss, val_bpb, primary_metric, secondary_metrics_json,
            peak_vram_mb, training_seconds, total_seconds, created_at_str,
            started_at_str, completed_at_str, parent_experiment_id, changes_from_parent
        ) = row
        
        # Deserialize JSON fields
        config = json.loads(config_json)
        secondary_metrics = json.loads(secondary_metrics_json) if secondary_metrics_json else {}
        
        # Parse timestamps
        created_at = datetime.fromisoformat(created_at_str)
        started_at = datetime.fromisoformat(started_at_str) if started_at_str else None
        completed_at = datetime.fromisoformat(completed_at_str) if completed_at_str else None
        
        return Experiment(
            id=id_,
            run_tag=run_tag,
            commit_hash=commit_hash,
            config=config,
            description=description,
            status=ExperimentStatus(status),
            val_loss=val_loss,
            val_bpb=val_bpb,
            primary_metric=primary_metric,
            secondary_metrics=secondary_metrics,
            peak_vram_mb=peak_vram_mb,
            training_seconds=training_seconds,
            total_seconds=total_seconds,
            created_at=created_at,
            started_at=started_at,
            completed_at=completed_at,
            parent_experiment_id=parent_experiment_id,
            changes_from_parent=changes_from_parent or ""
        )
