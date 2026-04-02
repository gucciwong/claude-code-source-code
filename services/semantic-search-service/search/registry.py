from .embedder import CodeEmbedder
from .index_manager import IndexManager
from .search_engine import SearchEngine

index_manager = IndexManager()
search_engine = SearchEngine(index_manager)
