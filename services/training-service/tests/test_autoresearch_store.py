"""
Tests for ResearchProgramStore (Phase 4.3 - Storage)

Tests CRUD operations, persistence, and query functionality for research programs.
Following TDD approach: tests define expected behavior before implementation.
"""

import pytest
import tempfile
import json
from pathlib import Path
from datetime import datetime

from autoresearch.program import ResearchProgram, SearchDimension, DEFAULT_PROGRAMS
from autoresearch.store import ResearchProgramStore


class TestResearchProgramStoreInit:
    """Test store initialization and schema creation"""
    
    def test_init_creates_directory(self):
        """Store should create db directory if missing"""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_dir = Path(tmpdir) / "subdir" / "nested"
            store = ResearchProgramStore(db_dir=db_dir)
            
            assert db_dir.exists(), "Store should create parent directories"
            assert (db_dir / "programs.db").exists(), "Store should create database file"
    
    def test_init_creates_schema(self):
        """Store should create tables on first initialization"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            # Schema should exist without errors
            import sqlite3
            conn = sqlite3.connect(store.db_path)
            cursor = conn.cursor()
            
            # Check programs table exists
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='programs'"
            )
            assert cursor.fetchone() is not None, "programs table should exist"
            
            # Check runs table exists
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='runs'"
            )
            assert cursor.fetchone() is not None, "runs table should exist"
            
            conn.close()
    
    def test_init_idempotent(self):
        """Re-initializing store should not fail"""
        with tempfile.TemporaryDirectory() as tmpdir:
            db_dir = Path(tmpdir)
            
            store1 = ResearchProgramStore(db_dir=db_dir)
            store2 = ResearchProgramStore(db_dir=db_dir)
            
            assert store1.db_path == store2.db_path


class TestResearchProgramStoreCreate:
    """Test creating and persisting research programs"""
    
    def test_create_stores_program(self):
        """create() should persist program to database"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = ResearchProgram(
                run_tag="test-run",
                goal="Test goal",
                description="Test description",
                primary_metric="val_loss",
                time_budget_seconds=300,
                base_model="test-model",
                dataset_path="/data/test",
                search_dimensions=[
                    SearchDimension(
                        name="param1",
                        type="int",
                        min_val=1.0,
                        max_val=10.0,
                        current=5
                    )
                ],
            )
            
            created = store.create(program)
            
            assert created.id == program.id
            assert created.run_tag == "test-run"
            assert created.status == "pending"
    
    def test_create_returns_program_with_immutable_fields(self):
        """Created program should preserve all immutable fields"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = ResearchProgram(
                run_tag="immutable-test",
                goal="Test immutability",
                description="Ensure fields are preserved",
                primary_metric="val_bpb",
                time_budget_seconds=600,
                base_model="phi-2",
                dataset_path="/data/code",
                search_dimensions=[
                    SearchDimension(
                        name="lr",
                        type="float",
                        min_val=1e-5,
                        max_val=1e-3,
                        current=2e-4
                    ),
                    SearchDimension(
                        name="rank",
                        type="categorical",
                        options=[8, 16, 32],
                        current=16
                    )
                ],
                strategy="bayesian",
            )
            
            created = store.create(program)
            
            assert created.run_tag == program.run_tag
            assert created.goal == program.goal
            assert created.primary_metric == program.primary_metric
            assert created.time_budget_seconds == program.time_budget_seconds
            assert created.base_model == program.base_model
            assert created.dataset_path == program.dataset_path
            assert created.strategy == program.strategy
            assert len(created.search_dimensions) == 2
    
    def test_create_assigns_uuid(self):
        """create() should use provided ID or generate UUID"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = DEFAULT_PROGRAMS["quick-explore"]
            created = store.create(program)
            
            assert created.id is not None
            assert len(created.id) > 0
    
    def test_create_sets_created_at(self):
        """create() should set created_at timestamp"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            before = datetime.now()
            program = DEFAULT_PROGRAMS["overnight-run"]
            created = store.create(program)
            after = datetime.now()
            
            assert before <= created.created_at <= after


class TestResearchProgramStoreGet:
    """Test retrieving programs by ID"""
    
    def test_get_retrieves_created_program(self):
        """get() should retrieve program by ID"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = DEFAULT_PROGRAMS["quick-explore"]
            created = store.create(program)
            
            retrieved = store.get(created.id)
            
            assert retrieved is not None
            assert retrieved.id == created.id
            assert retrieved.run_tag == created.run_tag
    
    def test_get_returns_none_if_not_found(self):
        """get() should return None if program not found"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            retrieved = store.get("non-existent-id")
            
            assert retrieved is None
    
    def test_get_restores_search_dimensions(self):
        """get() should properly deserialize search_dimensions JSON"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = ResearchProgram(
                run_tag="dimensions-test",
                goal="Test dimension serialization",
                description="Ensure dimensions are restored",
                primary_metric="val_loss",
                time_budget_seconds=300,
                base_model="test",
                dataset_path="/data",
                search_dimensions=[
                    SearchDimension(
                        name="param1",
                        type="int",
                        min_val=1.0,
                        max_val=100.0,
                        current=50
                    ),
                    SearchDimension(
                        name="param2",
                        type="categorical",
                        options=["a", "b", "c"],
                        current="a"
                    )
                ]
            )
            
            created = store.create(program)
            retrieved = store.get(created.id)
            
            assert len(retrieved.search_dimensions) == 2
            assert retrieved.search_dimensions[0].name == "param1"
            assert retrieved.search_dimensions[0].type == "int"
            assert retrieved.search_dimensions[1].options == ["a", "b", "c"]


class TestResearchProgramStoreList:
    """Test listing programs with pagination"""
    
    def test_list_returns_all_programs(self):
        """list() should return all stored programs"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            # Create 3 programs
            program1 = DEFAULT_PROGRAMS["quick-explore"]
            program2 = DEFAULT_PROGRAMS["overnight-run"]
            program3 = ResearchProgram(
                run_tag="custom",
                goal="Custom goal",
                description="Custom",
                primary_metric="val_loss",
                time_budget_seconds=600,
                base_model="test",
                dataset_path="/data",
                search_dimensions=[
                    SearchDimension(
                        name="x",
                        type="int",
                        min_val=1.0,
                        max_val=10.0,
                        current=5
                    )
                ]
            )
            
            store.create(program1)
            store.create(program2)
            store.create(program3)
            
            programs = store.list()
            
            assert len(programs) == 3
    
    def test_list_pagination(self):
        """list() should support limit and offset"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            # Create 5 programs
            for i in range(5):
                program = ResearchProgram(
                    run_tag=f"prog-{i}",
                    goal=f"Goal {i}",
                    description=f"Desc {i}",
                    primary_metric="val_loss",
                    time_budget_seconds=300,
                    base_model="test",
                    dataset_path="/data",
                    search_dimensions=[
                        SearchDimension(
                            name="x",
                            type="int",
                            min_val=1.0,
                            max_val=10.0,
                            current=5
                        )
                    ]
                )
                store.create(program)
            
            # Test limit
            page1 = store.list(limit=2, offset=0)
            assert len(page1) == 2
            
            # Test offset
            page2 = store.list(limit=2, offset=2)
            assert len(page2) == 2
            
            # Test final page (smaller)
            page3 = store.list(limit=2, offset=4)
            assert len(page3) == 1
    
    def test_list_empty_database(self):
        """list() should return empty list if no programs"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            programs = store.list()
            
            assert programs == []


class TestResearchProgramStoreUpdate:
    """Test updating program status and metadata"""
    
    def test_update_status(self):
        """update() should change status field"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = DEFAULT_PROGRAMS["quick-explore"]
            created = store.create(program)
            
            assert created.status == "pending"
            
            # Update to running
            updated = store.update(created.id, status="running")
            
            assert updated.status == "running"
            
            # Verify persistence
            retrieved = store.get(created.id)
            assert retrieved.status == "running"
    
    def test_update_experiments_completed(self):
        """update() should increment experiments_completed counter"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = DEFAULT_PROGRAMS["quick-explore"]
            created = store.create(program)
            
            assert created.experiments_completed == 0
            
            # Update counter
            updated = store.update(created.id, experiments_completed=5)
            
            assert updated.experiments_completed == 5
            
            # Verify persistence
            retrieved = store.get(created.id)
            assert retrieved.experiments_completed == 5
    
    def test_update_returns_updated_program(self):
        """update() should return the updated ResearchProgram object"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = DEFAULT_PROGRAMS["quick-explore"]
            created = store.create(program)
            
            updated = store.update(created.id, status="completed")
            
            # Should be a ResearchProgram instance
            assert isinstance(updated, ResearchProgram)
            assert updated.id == created.id
            assert updated.status == "completed"
    
    def test_update_non_existent_raises_error(self):
        """update() should raise error if program not found"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            with pytest.raises(ValueError) as exc_info:
                store.update("non-existent", status="running")
            
            assert "not found" in str(exc_info.value).lower()
    
    def test_update_search_dimensions_readonly(self):
        """update() should NOT allow modifying search_dimensions"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = DEFAULT_PROGRAMS["quick-explore"]
            created = store.create(program)
            
            original_dims = created.search_dimensions
            
            # Try to update search_dimensions (should be ignored or raise error)
            new_dims = [
                SearchDimension(
                    name="different",
                    type="int",
                    min_val=1.0,
                    max_val=10.0,
                    current=5
                )
            ]
            
            # Should either ignore or raise
            try:
                updated = store.update(created.id, search_dimensions=new_dims)
                # If it doesn't raise, verify dimensions didn't change
                assert updated.search_dimensions == original_dims
            except (ValueError, TypeError):
                # Expected: search_dimensions is immutable
                pass


class TestResearchProgramStoreDelete:
    """Test deleting programs"""
    
    def test_delete_removes_program(self):
        """delete() should remove program from database"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = DEFAULT_PROGRAMS["quick-explore"]
            created = store.create(program)
            prog_id = created.id
            
            # Verify it exists
            assert store.get(prog_id) is not None
            
            # Delete
            store.delete(prog_id)
            
            # Verify it's gone
            assert store.get(prog_id) is None
    
    def test_delete_non_existent_raises_error(self):
        """delete() should raise error if program not found"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            with pytest.raises(ValueError) as exc_info:
                store.delete("non-existent")
            
            assert "not found" in str(exc_info.value).lower()


class TestResearchProgramStorePersistence:
    """Test that store properly persists across restarts"""
    
    def test_persistence_across_store_instances(self):
        """Data should persist when creating new store instance"""
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create store and add program
            store1 = ResearchProgramStore(db_dir=Path(tmpdir))
            program = DEFAULT_PROGRAMS["quick-explore"]
            created = store1.create(program)
            prog_id = created.id
            
            # Create new store instance with same db_dir
            store2 = ResearchProgramStore(db_dir=Path(tmpdir))
            
            # Should be able to retrieve
            retrieved = store2.get(prog_id)
            assert retrieved is not None
            assert retrieved.id == prog_id
            assert retrieved.run_tag == "quick-explore"


class TestResearchProgramStoreDefaultPrograms:
    """Test integration with DEFAULT_PROGRAMS"""
    
    def test_create_from_default_quick_explore(self):
        """Should be able to store DEFAULT_PROGRAMS['quick-explore']"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = DEFAULT_PROGRAMS["quick-explore"]
            created = store.create(program)
            
            assert created.run_tag == "quick-explore"
            assert created.time_budget_seconds == 300
            assert created.max_experiments == 12
    
    def test_create_from_default_overnight_run(self):
        """Should be able to store DEFAULT_PROGRAMS['overnight-run']"""
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ResearchProgramStore(db_dir=Path(tmpdir))
            
            program = DEFAULT_PROGRAMS["overnight-run"]
            created = store.create(program)
            
            assert created.run_tag == "overnight-run"
            assert created.time_budget_seconds == 600
            assert created.max_experiments is None
