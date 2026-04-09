"""
Model Loader — loads models into memory for inference.
Supports HuggingFace (safetensors/pytorch), and GGUF via llama-cpp-python.
No Ollama. No LM Studio.
"""

import os
import logging
import pathlib
from typing import Optional, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Sentinel for lazy imports
_llama_cpp = None
_transformers = None


def _get_llama_cpp():
    global _llama_cpp
    if _llama_cpp is None:
        try:
            import llama_cpp as lc
            _llama_cpp = lc
        except ImportError:
            raise ImportError(
                "llama-cpp-python is required for GGUF inference. "
                "Install with: pip install llama-cpp-python"
            )
    return _llama_cpp


def _get_transformers():
    global _transformers
    if _transformers is None:
        import transformers as tf
        _transformers = tf
    return _transformers


class ModelLoader:
    """
    Loads a model into memory so it can be queried by the InferenceEngine.

    Two back-ends:
      1. **llama-cpp-python** for GGUF files — fast, low-memory, CPU-friendly.
      2. **transformers** for HuggingFace snapshots (safetensors / pytorch).

    The correct back-end is chosen automatically from *format*.
    """

    def __init__(self, device: str = "auto", max_cache_models: int = 2):
        self.device = self._resolve_device(device)
        self.max_cache_models = max_cache_models
        # model_id → (backend_type, model_object, tokenizer_or_None)
        self._loaded: Dict[str, Tuple[str, Any, Any]] = {}

    # ------------------------------------------------------------------
    # Device resolution
    # ------------------------------------------------------------------
    @staticmethod
    def _resolve_device(device: str) -> str:
        if device == "auto":
            try:
                import torch
                if torch.cuda.is_available():
                    return "cuda"
                if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                    return "mps"
            except ImportError:
                pass
            return "cpu"
        return device

    # ------------------------------------------------------------------
    # Load
    # ------------------------------------------------------------------
    def load(
        self,
        model_id: str,
        local_path: str,
        fmt: str,
        *,
        n_ctx: int = 4096,
        n_gpu_layers: int = -1,
        use_quantization: bool = False,
    ) -> str:
        """
        Load *model_id* into memory from *local_path*.

        Returns the backend type used: ``"llama_cpp"`` or ``"transformers"``.
        """
        if model_id in self._loaded:
            logger.info("Model %s already loaded.", model_id)
            return self._loaded[model_id][0]

        # Evict oldest if at capacity
        self._maybe_evict()

        if fmt == "gguf":
            backend = self._load_gguf(model_id, local_path, n_ctx, n_gpu_layers)
        else:
            backend = self._load_hf(model_id, local_path, use_quantization)

        return backend

    # ------------------------------------------------------------------
    # GGUF via llama-cpp-python
    # ------------------------------------------------------------------
    def _load_gguf(
        self, model_id: str, path: str, n_ctx: int, n_gpu_layers: int
    ) -> str:
        lc = _get_llama_cpp()

        # Resolve path: could be a directory containing one gguf, or a file
        gguf_file = self._resolve_gguf_path(path)

        if n_gpu_layers == -1 and self.device == "cpu":
            n_gpu_layers = 0

        logger.info("Loading GGUF %s (ctx=%d, gpu_layers=%d) …", gguf_file, n_ctx, n_gpu_layers)
        model = lc.Llama(
            model_path=str(gguf_file),
            n_ctx=n_ctx,
            n_gpu_layers=n_gpu_layers,
            verbose=False,
        )
        self._loaded[model_id] = ("llama_cpp", model, None)
        logger.info("GGUF model %s loaded.", model_id)
        return "llama_cpp"

    @staticmethod
    def _resolve_gguf_path(path: str) -> str:
        p = pathlib.Path(path)
        if p.is_file() and p.suffix.lower() == ".gguf":
            return str(p)
        if p.is_dir():
            gguf_files = list(p.glob("*.gguf"))
            # Prefer main model files; skip multimodal projector GGUFs
            model_ggufs = [
                f for f in gguf_files
                if "mmproj" not in f.name.lower() and "projector" not in f.name.lower()
            ]
            if model_ggufs:
                return str(model_ggufs[0])
            if gguf_files:
                return str(gguf_files[0])
        raise FileNotFoundError(f"No .gguf file found at {path}")

    # ------------------------------------------------------------------
    # HuggingFace transformers
    # ------------------------------------------------------------------
    def _load_hf(self, model_id: str, path: str, use_quant: bool) -> str:
        import torch
        tf = _get_transformers()

        logger.info("Loading HF model %s on %s …", path, self.device)

        model_kwargs: Dict[str, Any] = {
            "device_map": "auto" if self.device != "cpu" else "cpu",
            "dtype": torch.float32 if self.device == "cpu" else torch.bfloat16,
            "trust_remote_code": True,
        }

        if use_quant and self.device != "cpu":
            try:
                from transformers import BitsAndBytesConfig
                model_kwargs["quantization_config"] = BitsAndBytesConfig(
                    load_in_4bit=True,
                    bnb_4bit_compute_dtype=torch.bfloat16,
                    bnb_4bit_quant_type="nf4",
                    bnb_4bit_use_double_quant=True,
                )
            except ImportError:
                logger.warning("bitsandbytes not available; loading without quantization.")

        try:
            model = tf.AutoModelForCausalLM.from_pretrained(path, **model_kwargs)
        except (MemoryError, RuntimeError) as exc:
            raise RuntimeError(
                f"Failed to load model '{model_id}' — possibly out of memory. "
                f"Try a smaller model or GGUF format. Error: {exc}"
            ) from exc
        tokenizer = tf.AutoTokenizer.from_pretrained(path)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        self._loaded[model_id] = ("transformers", model, tokenizer)
        logger.info("HF model %s loaded.", model_id)
        return "transformers"

    # ------------------------------------------------------------------
    # Accessors
    # ------------------------------------------------------------------
    def get(self, model_id: str) -> Optional[Tuple[str, Any, Any]]:
        """Return (backend, model, tokenizer_or_None) or None."""
        return self._loaded.get(model_id)

    def is_loaded(self, model_id: str) -> bool:
        return model_id in self._loaded

    def unload(self, model_id: str) -> bool:
        if model_id in self._loaded:
            backend, model, tok = self._loaded.pop(model_id)
            del model
            if tok is not None:
                del tok
            try:
                import torch, gc
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            except ImportError:
                pass
            logger.info("Unloaded model %s", model_id)
            return True
        return False

    def loaded_models(self) -> list:
        return [
            {"model_id": k, "backend": v[0]}
            for k, v in self._loaded.items()
        ]

    # ------------------------------------------------------------------
    # Eviction
    # ------------------------------------------------------------------
    def _maybe_evict(self):
        while len(self._loaded) >= self.max_cache_models:
            oldest_key = next(iter(self._loaded))
            logger.info("Evicting model %s to make room.", oldest_key)
            self.unload(oldest_key)
