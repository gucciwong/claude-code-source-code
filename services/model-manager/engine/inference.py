"""
Inference Engine — runs generation on a loaded model.
Works with both llama-cpp-python (GGUF) and HuggingFace transformers.
No Ollama. No LM Studio.
"""

import asyncio
import logging
from typing import AsyncIterator, Optional, Dict, Any

logger = logging.getLogger(__name__)


class InferenceEngine:
    """
    Generates text from a loaded model.

    Usage::

        engine = InferenceEngine(loader)
        async for token in engine.generate("model-id", "Hello!"):
            print(token, end="")
    """

    def __init__(self, loader):
        """
        Args:
            loader: A ``ModelLoader`` instance that already has models loaded.
        """
        self.loader = loader

    # ------------------------------------------------------------------
    # Streaming generation
    # ------------------------------------------------------------------
    async def generate(
        self,
        model_id: str,
        prompt: str,
        *,
        max_tokens: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.9,
        top_k: int = 40,
        min_p: float = 0.0,
        repeat_penalty: float = 1.0,
        frequency_penalty: float = 0.0,
        presence_penalty: float = 0.0,
        seed: int = -1,
        stop: Optional[list] = None,
    ) -> AsyncIterator[str]:
        """
        Yields tokens one-by-one as they are generated.
        """
        entry = self.loader.get(model_id)
        if entry is None:
            raise RuntimeError(f"Model {model_id} is not loaded. Load it first.")

        backend, model, tokenizer = entry

        extra = {
            "top_k": top_k,
            "min_p": min_p,
            "repeat_penalty": repeat_penalty,
            "frequency_penalty": frequency_penalty,
            "presence_penalty": presence_penalty,
            "seed": seed,
        }

        if backend == "llama_cpp":
            async for tok in self._generate_llama_cpp(
                model, prompt, max_tokens, temperature, top_p, stop, extra
            ):
                yield tok
        elif backend == "transformers":
            async for tok in self._generate_transformers(
                model, tokenizer, prompt, max_tokens, temperature, top_p, stop, extra
            ):
                yield tok
        else:
            raise RuntimeError(f"Unknown backend {backend}")

    # ------------------------------------------------------------------
    # Non-streaming (convenience)
    # ------------------------------------------------------------------
    async def complete(
        self,
        model_id: str,
        prompt: str,
        **kwargs,
    ) -> str:
        tokens = []
        async for t in self.generate(model_id, prompt, **kwargs):
            tokens.append(t)
        return "".join(tokens)

    # ------------------------------------------------------------------
    # llama-cpp-python back-end
    # ------------------------------------------------------------------
    async def _generate_llama_cpp(
        self, model, prompt, max_tokens, temperature, top_p, stop, extra
    ) -> AsyncIterator[str]:
        loop = asyncio.get_event_loop()

        def _blocking():
            kwargs: Dict[str, Any] = {
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "top_k": extra.get("top_k", 40),
                "min_p": extra.get("min_p", 0.0),
                "repeat_penalty": extra.get("repeat_penalty", 1.0),
                "frequency_penalty": extra.get("frequency_penalty", 0.0),
                "presence_penalty": extra.get("presence_penalty", 0.0),
                "stop": stop or [],
                "stream": True,
            }
            seed = extra.get("seed", -1)
            if seed >= 0:
                kwargs["seed"] = seed
            return model.create_completion(prompt, **kwargs)

        stream = await loop.run_in_executor(None, _blocking)

        for chunk in stream:
            text = chunk["choices"][0].get("text", "")
            if text:
                yield text

    # ------------------------------------------------------------------
    # HuggingFace transformers back-end (TextIteratorStreamer)
    # ------------------------------------------------------------------
    async def _generate_transformers(
        self, model, tokenizer, prompt, max_tokens, temperature, top_p, stop, extra
    ) -> AsyncIterator[str]:
        import torch
        from threading import Thread
        from transformers import TextIteratorStreamer

        inputs = tokenizer(prompt, return_tensors="pt")
        input_ids = inputs["input_ids"].to(model.device)
        attention_mask = inputs.get("attention_mask")
        if attention_mask is not None:
            attention_mask = attention_mask.to(model.device)

        streamer = TextIteratorStreamer(
            tokenizer, skip_prompt=True, skip_special_tokens=True
        )

        gen_kwargs: Dict[str, Any] = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "max_new_tokens": max_tokens,
            "temperature": max(temperature, 1e-7),
            "top_p": top_p,
            "top_k": extra.get("top_k", 40),
            "repetition_penalty": extra.get("repeat_penalty", 1.0),
            "do_sample": temperature > 0,
            "streamer": streamer,
        }

        seed = extra.get("seed", -1)
        if seed >= 0:
            gen_kwargs["seed"] = seed

        # Run generation in a background thread so we can yield tokens
        thread = Thread(target=model.generate, kwargs=gen_kwargs, daemon=True)
        thread.start()

        for text in streamer:
            if text:
                yield text
            # Give the event-loop a chance to breathe
            await asyncio.sleep(0)

        thread.join(timeout=120)
