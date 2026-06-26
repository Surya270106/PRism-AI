"""
Configuration for PRism AI Machine Learning Pipeline
This file locks in the model choices justified in Phase 2.
"""

from pydantic import BaseModel

class ModelConfig(BaseModel):
    # The selected base model for fine-tuning
    base_model_name: str = "meta-llama/Llama-3.2-3B-Instruct"
    
    # Context window based on Llama 3.2 constraints (we will cap at 32k for memory efficiency during training)
    max_seq_length: int = 32768
    
    # Fallback model for orchestration
    fallback_model_name: str = "claude-3-5-sonnet-20240620"
    
    # Trust threshold for JSON output confidence
    fallback_confidence_threshold: float = 0.80

config = ModelConfig()
