"""
Pinned Validation Dataset Manager — Phase 2.2

This module manages the fixed validation dataset for evaluation harness.
The dataset is PINNED: never changes between experiments, ensuring
reproducible evaluation across training runs.

Design:
  - Caches validation data locally in ~/.sovereign-code/eval-data/
  - Immutable once created (SHA256 checksum verification)
  - Supports mock data for Phase 2.2, real data in Phase 3+
  - Fast in-memory loading for evaluation
  - Deterministic: same size always produces same dataset

Usage:
  from evaluation.data import ValidationDataset
  
  # Load default 500-example dataset (or from cache)
  dataset = ValidationDataset.get_default(size=500)
  
  # Or custom size
  dataset = ValidationDataset.get_default(size=100)
  
  # Verify cache integrity
  is_valid = ValidationDataset.verify_checksum()
  
  # Clear cache (forces regeneration on next load)
  ValidationDataset.clear_cache()
"""

import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict
import logging

logger = logging.getLogger(__name__)


class ValidationDataset:
    """
    Manages pinned validation dataset for evaluation harness.
    
    IMMUTABLE: Dataset is fixed once created. All experiments evaluate on
    identical data to ensure reproducibility and fair comparison.
    
    Attributes:
        CACHE_DIR: Path to cache directory (~/.sovereign-code/eval-data/)
        CACHE_FILE: Name of cached dataset file (validation_set.json)
        CHECKSUM_ALGORITHM: SHA256 for integrity verification
    """
    
    CACHE_DIR = Path.home() / ".sovereign-code" / "eval-data"
    CACHE_FILE = "validation_set.json"
    CHECKSUM_ALGORITHM = "sha256"
    
    # Mock data: Python code completion examples (Phase 2.2)
    # Format: (prompt, expected_completion)
    MOCK_PROMPTS = [
        # Function definitions
        ("def hello():\n    return", " 'Hello World'"),
        ("def add(a, b):\n    return", " a + b"),
        ("def greet(name):\n    print", "(f'Hello {name}')"),
        ("def calculate(x, y, z):\n    result =" , " x * y + z\n    return result"),
        ("def fibonacci(n):\n    if", " n <= 1:\n        return n"),
        
        # Class definitions
        ("class User:\n    def __init__(self, name):\n        self.", "name = name"),
        ("class Animal:\n    def speak(self):\n        return", " 'Some sound'"),
        ("class Database:\n    def __init__(self):\n        self.", "conn = None"),
        ("class Logger:\n    def log(self, msg):\n        print", "(msg)"),
        ("class Calculator:\n    def multiply(self, a, b):\n        return", " a * b"),
        
        # Loops
        ("for i in range(10):\n    print", "(i)"),
        ("for item in items:\n    if", " item not in processed:\n        process(item)"),
        ("while True:\n    data = input()\n    if", " data == 'quit':\n        break"),
        ("for key, value in dict.items():\n    print", "(f'{key}: {value}')"),
        ("for line in file:\n    processed_lines.append", "(line.strip())"),
        
        # Conditionals
        ("if x > 0:\n    print", "('positive')"),
        ("if name and age:\n    user = User()", "\n    users.append(user)"),
        ("if not found:\n    raise", " ValueError('Not found')"),
        ("if error:\n    logger.error()", "\n    return None"),
        ("if response.status_code == 200:\n    data =", " response.json()"),
        
        # Try/Except
        ("try:\n    result = json.loads(data)\nexcept", " json.JSONDecodeError:\n    result = None"),
        ("try:\n    file = open(path)\nexcept", " FileNotFoundError:\n    print('File not found')"),
        ("try:\n    value = int(s)\nexcept", " ValueError:\n    value = 0"),
        ("try:\n    result = risky_operation()\nexcept", " Exception as e:\n    logger.error(str(e))"),
        ("try:\n    connection.execute(query)\nexcept", " Exception:\n    connection.rollback()"),
        
        # List operations
        ("result = [x for x in numbers if", " x > 0]"),
        ("filtered = list(filter(lambda x:", " x.startswith('a'), items))"),
        ("sorted_data = sorted(data, key=lambda x:", " x['score'], reverse=True)"),
        ("unique = list(set(", "items))"),
        ("flattened = sum([[1, 2], [3, 4]], [])", " # flattens lists\n        "),
        
        # String operations
        ("text = 'hello world'\ntext.", "upper()"),
        ("name = '  spaces  '\nname.", "strip()"),
        ("words = 'a,b,c'.split(", "',')"),
        ("formatted = f'Value: {x}, Type:", " {type(x).__name__}'"),
        ("message = ' '.join(", "['hello', 'world'])"),
        
        # Import statements
        ("import", " json"),
        ("from pathlib import", " Path"),
        ("import numpy as", " np"),
        ("from typing import", " Optional, List, Dict"),
        ("import logging\nlogger = logging.", "getLogger(__name__)"),
        
        # Dictionary operations
        ("config = {", "'name': 'app', 'version': '1.0'}"),
        ("value = dictionary.get('key',", " 'default')"),
        ("for k, v in mapping.items():", " pass"),
        ("updated = {**dict1, **dict2}", " # merge dicts\n        "),
        ("keys = list(mapping.", "keys())"),
        
        # Lambda functions
        ("square = lambda x:", " x * x"),
        ("add = lambda x, y:", " x + y"),
        ("filter_positive = lambda nums:", " [x for x in nums if x > 0]"),
        ("reverse = lambda s:", " s[::-1]"),
        ("join_words = lambda words:", " ' '.join(words)"),
        
        # Async/await (basic)
        ("async def fetch():\n    result = await", " get_data()"),
        ("async def process():\n    await", " asyncio.sleep(1)"),
        ("async def main():\n    tasks = [", "get_data() for _ in range(10)]"),
        
        # Error handling patterns
        ("if not isinstance(obj, dict):\n    raise", " TypeError('Expected dict')"),
        ("if len(password) < 8:\n    raise", " ValueError('Too short')"),
        ("if not os.path.exists(path):\n    raise", " FileNotFoundError()"),
        
        # Common patterns
        ("response = requests.get(url)\nif", " response.ok:\n    data = response.json()"),
        ("data = pd.read_csv(", "'data.csv')"),
        ("df_filtered = df[df['column'] >", " 0]"),
        ("model = load_model(", "'model.pkl')"),
        ("result = model.predict(", "X_test)"),
        
        # Logging
        ("logger.info(", "'Processing started')"),
        ("logger.warning(", "'Deprecated function')"),
        ("logger.error(", "'Operation failed')"),
        ("logger.debug(", "'Debug information')"),
        
        # Context managers
        ("with open(file, 'r') as f:\n    content =", " f.read()"),
        ("with sqlite3.connect(db) as conn:\n    cursor =", " conn.cursor()"),
        ("with concurrent.futures.ThreadPoolExecutor() as executor:\n    results =", " executor.map(func, items)"),
        
        # Decorators
        ("@property\ndef", " name(self):"),
        ("@staticmethod\ndef", " utility():"),
        ("@classmethod\ndef", " create(cls):"),
        ("@lru_cache(maxsize=128)\ndef", " fibonacci(n):"),
        
        # Type hints
        ("def process(data: Dict[str, Any]) ->", " Optional[str]:"),
        ("def calculate(x: float, y: float) ->", " float:"),
        ("def get_items() ->", " List[Item]:"),
        ("def callback(func: Callable[[int], str]) ->", " None:"),
        
        # List comprehensions
        ("[x*2 for x in", " range(10)]"),
        ("[x for x in items if", " x != None]"),
        ("[f(x) for x in data if", " condition(x)]"),
        ("{key: value for key, value in", " pairs(data)}"),
        
        # Common math operations
        ("result = abs(", "-5)"),
        ("max_value = max(", "[1, 5, 3, 9, 2])"),
        ("total = sum(", "numbers)"),
        ("rounded = round(", "3.14159, 2)"),
        ("power = pow(", "2, 8)"),
        
        # More complex patterns
        ("def decorator(func):\n    def wrapper(*args, **kwargs):\n        return", " func(*args, **kwargs)"),
        ("class Iterator:\n    def __iter__(self):\n        return", " self"),
        ("class Context:\n    def __enter__(self):\n        return", " self"),
        ("def generator():\n    for i in range(10):\n        yield", " i"),
        
        # Data processing
        ("df['new_col'] = df['old_col'].apply(", "lambda x: x * 2)"),
        ("grouped = df.groupby('category').agg({'value':", " 'sum'})"),
        ("normalized = (df - df.mean()) /", " df.std()"),
        ("encoded = pd.get_dummies(", "df['categorical_col'])"),
        
        # API/Request patterns
        ("payload = {", "'user': user_id, 'action': 'update'}"),
        ("headers = {'Authorization':", " f'Bearer {token}'}"),
        ("response = requests.post(url, json=", "payload)"),
        ("data = response.json() if response.status_code ==", " 200 else None"),
        
        # Config/Settings
        ("config = {\n    'debug':", " True,\n    'port': 8000\n}"),
        ("settings = load_config(", "os.getenv('CONFIG_PATH'))"),
        ("db_url = os.getenv('DATABASE_URL',", " 'sqlite:///app.db')"),
        
        # Validation
        ("if not email or '@' not in", " email:\n    raise ValueError()"),
        ("if password and len(password) <", " 8:\n    return False"),
        ("if not re.match(r'^[a-zA-Z0-9]+$',", " username):\n    raise ValueError()"),
        
        # Error messages
        ("raise ValueError(f'Invalid value:", " {value}')"),
        ("raise RuntimeError(", "'Operation timed out')"),
        ("raise KeyError(", "'Configuration key not found')"),
        
        # Mocking / Testing
        ("assert result ==", " expected_value"),
        ("assert isinstance(obj,", " dict)"),
        ("with pytest.raises(", "ValueError):\n    function()"),
        
        # Additional Python patterns
        ("isinstance(x,", " (list, tuple))"),
        ("hasattr(obj,", " 'attribute')"),
        ("getattr(obj, 'name',", " 'default')"),
        ("callable(", "obj)"),
        ("zip(", "list1, list2)"),
        
        # Module reload
        ("import importlib\nimportlib.reload(", "module)"),
        
        # Path operations  
        ("from pathlib import Path\np = Path(", "'file.txt')"),
        ("path = os.path.join(", "directory, filename)"),
        ("exists = os.path.exists(", "filepath)"),
        
        # Environment variables
        ("api_key = os.getenv(", "'API_KEY')"),
        ("os.environ['VAR'] =", " 'value'"),
        
        # JSON operations
        ("serialized = json.dumps(", "data)"),
        ("parsed = json.loads(", "json_string)"),
        ("with open('data.json') as f:\n    data = json.", "load(f)"),
        
        # Regex
        ("import re\nmatch = re.search(", "pattern, text)"),
        ("matches = re.findall(", "r'\\d+', text)"),
        ("replaced = re.sub(", "r'[^a-z]', '', text)"),
        
        # Timing
        ("import time\ntime.sleep(", "1)"),
        ("start = time.time()\nresult = operation()\nelapsed =", " time.time() - start"),
        
        # UUID
        ("import uuid\nid = uuid.", "uuid4()"),
        
        # Random
        ("import random\nnumber = random.", "randint(1, 100)"),
        ("random.choice(", "items)"),
        ("random.shuffle(", "items)"),
    ]
    
    @classmethod
    def get_default(cls, size: int = 500) -> List[Dict]:
        """
        Load or generate default validation dataset.
        
        Returns cached data if available, otherwise generates mock data,
        caches it, and returns it.
        
        Args:
            size: Number of examples to include (default 500)
            
        Returns:
            List of dicts with {prompt: str, expected: str, tokens: int}
            
        Raises:
            ValueError: If size <= 0
        """
        if size <= 0:
            raise ValueError("Size must be positive")
        
        cache_path = cls.CACHE_DIR / cls.CACHE_FILE
        
        # Create cache directory if missing
        cls.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        
        # Try to load from cache
        if cache_path.exists():
            logger.debug(f"Loading validation dataset from cache: {cache_path}")
            dataset = cls._load_cached_dataset(cache_path)
            # If cached size differs from requested, regenerate
            if len(dataset) != size:
                logger.info(f"Cached size ({len(dataset)}) differs from requested ({size}). Regenerating.")
                dataset = cls._generate_mock_dataset(size)
                cls._save_dataset_to_cache(dataset, cache_path)
            return dataset
        
        # Generate mock data if not cached
        logger.info(f"Generating mock validation dataset ({size} examples)")
        dataset = cls._generate_mock_dataset(size)
        
        # Cache it
        cls._save_dataset_to_cache(dataset, cache_path)
        
        return dataset
    
    @staticmethod
    def _generate_mock_dataset(size: int = 500) -> List[Dict]:
        """
        Generate synthetic Python code completion examples for testing.
        
        Creates deterministic, balanced dataset by cycling through prompt
        templates and appending indices for uniqueness.
        
        Args:
            size: Number of examples to generate
            
        Returns:
            List of {prompt, expected, tokens} dicts
        """
        dataset = []
        prompt_count = len(ValidationDataset.MOCK_PROMPTS)
        
        for i in range(size):
            # Cycle through prompts for balance
            prompt, expected = ValidationDataset.MOCK_PROMPTS[i % prompt_count]
            
            # Add index for uniqueness when cycling
            if i >= prompt_count:
                suffix = f" # example_{i}"
                prompt = prompt + suffix
            
            # Calculate token count (simple: split by whitespace/punctuation)
            tokens = len(prompt.split())
            
            dataset.append({
                "prompt": prompt,
                "expected": expected,
                "tokens": tokens,
            })
        
        return dataset
    
    @staticmethod
    def _save_dataset_to_cache(dataset: List[Dict], cache_path: Path) -> None:
        """
        Save dataset to cache file with metadata and checksum.
        
        Args:
            dataset: List of {prompt, expected, tokens} dicts
            cache_path: Path to cache file
        """
        # Calculate checksum
        checksum = ValidationDataset._calculate_checksum(dataset)
        
        # Build cache data structure
        cache_data = {
            "examples": dataset,
            "metadata": {
                "size": len(dataset),
                "hash": checksum,
                "created_at": datetime.now().isoformat(),
                "source": "mock",  # Phase 2.2: mock data
            },
        }
        
        # Write to cache
        with open(cache_path, 'w') as f:
            json.dump(cache_data, f, indent=2)
        
        logger.info(f"Cached validation dataset to {cache_path}")
    
    @staticmethod
    def _load_cached_dataset(cache_path: Path) -> List[Dict]:
        """
        Load dataset from cache file.
        
        Args:
            cache_path: Path to cache file
            
        Returns:
            List of {prompt, expected, tokens} dicts
        """
        with open(cache_path, 'r') as f:
            cache_data = json.load(f)
        
        examples = cache_data.get("examples", [])
        
        # Return all cached examples
        return examples
    
    @staticmethod
    def _calculate_checksum(dataset: List[Dict]) -> str:
        """
        Calculate SHA256 checksum of dataset for integrity verification.
        
        Args:
            dataset: List of examples
            
        Returns:
            Hex-encoded SHA256 checksum (64 characters)
        """
        # Serialize dataset deterministically
        serialized = json.dumps(dataset, sort_keys=True, separators=(',', ':'))
        
        # Calculate SHA256
        checksum = hashlib.sha256(serialized.encode()).hexdigest()
        
        return checksum
    
    @classmethod
    def verify_checksum(cls) -> bool:
        """
        Verify cached dataset hasn't been tampered with.
        
        Compares stored checksum with calculated checksum of current data.
        Returns False if cache doesn't exist.
        
        Returns:
            True if checksum matches (data is valid), False otherwise
        """
        cache_path = cls.CACHE_DIR / cls.CACHE_FILE
        
        if not cache_path.exists():
            logger.warning(f"Cache file not found: {cache_path}")
            return False
        
        try:
            with open(cache_path, 'r') as f:
                cache_data = json.load(f)
            
            stored_hash = cache_data["metadata"]["hash"]
            examples = cache_data["examples"]
            
            # Recalculate checksum
            calculated_hash = cls._calculate_checksum(examples)
            
            if stored_hash == calculated_hash:
                logger.debug("Checksum validation passed")
                return True
            else:
                logger.error(
                    f"Checksum mismatch! Stored: {stored_hash}, "
                    f"Calculated: {calculated_hash}"
                )
                return False
                
        except Exception as e:
            logger.error(f"Error verifying checksum: {e}")
            return False
    
    @classmethod
    def clear_cache(cls) -> None:
        """
        Delete cached validation dataset.
        
        Next call to get_default() will regenerate the data.
        Safe to call even if cache doesn't exist.
        """
        cache_path = cls.CACHE_DIR / cls.CACHE_FILE
        
        if cache_path.exists():
            cache_path.unlink()
            logger.info(f"Cleared validation dataset cache: {cache_path}")
        else:
            logger.debug(f"Cache file does not exist: {cache_path}")
