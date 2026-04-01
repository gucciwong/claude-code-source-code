"""
Model merging and export utilities
Combines LoRA adapters with base models for inference
"""

import logging
import os
from pathlib import Path
from typing import Optional

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

logger = logging.getLogger(__name__)


class ModelMerger:
    """Merge LoRA adapters with base models"""
    
    @staticmethod
    async def merge(
        base_model_id: str,
        adapter_path: str,
        output_path: str,
        device: str = "auto",
    ) -> str:
        """
        Merge LoRA adapter with base model
        
        Args:
            base_model_id: HuggingFace model ID
            adapter_path: Path to saved adapter
            output_path: Where to save merged model
            device: 'auto' | 'cuda' | 'cpu' | 'mps'
        
        Returns:
            Path to merged model
        """
        
        logger.info(f"Merging adapter from {adapter_path}...")
        
        try:
            from peft import AutoPeftModelForCausalLM
            
            # Load model with adapter
            model = AutoPeftModelForCausalLM.from_pretrained(
                adapter_path,
                device_map=device,
                torch_dtype=torch.float32 if device == "cpu" else torch.bfloat16,
            )
            
            # Merge
            merged_model = model.merge_and_unload()
            
            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(adapter_path)
            
            # Save
            os.makedirs(output_path, exist_ok=True)
            merged_model.save_pretrained(output_path)
            tokenizer.save_pretrained(output_path)
            
            logger.info(f"✓ Merged model saved to {output_path}")
            
            # Cleanup
            del model
            del merged_model
            torch.cuda.empty_cache()
            
            return output_path
        
        except Exception as e:
            logger.error(f"Merge failed: {e}")
            raise
    
    @staticmethod
    def export_for_inference(
        adapter_path: str,
        export_path: str,
        export_format: str = "safetensors",
    ) -> str:
        """
        Export adapter for deployment
        Formats: safetensors, pytorch
        """
        
        logger.info(f"Exporting adapter to {export_format} format...")
        
        os.makedirs(export_path, exist_ok=True)
        
        # Copy adapter weights
        adapter_file = "adapter_model.safetensors" if export_format == "safetensors" else "adapter_model.bin"
        src = Path(adapter_path) / adapter_file
        dst = Path(export_path) / adapter_file
        
        if src.exists():
            import shutil
            shutil.copy(src, dst)
            logger.info(f"✓ Adapter exported to {dst}")
        
        return export_path


if __name__ == "__main__":
    import asyncio
    
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # merger = ModelMerger()
    # merged_path = asyncio.run(merger.merge(
    #     base_model_id="mistral-7b",
    #     adapter_path="./models/quick_0/adapter",
    #     output_path="./models/merged",
    # ))
