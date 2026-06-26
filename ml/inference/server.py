"""
PRism AI Production Inference Server
FastAPI wrapper for serving the fine-tuned Llama 3.2 3B model.
Includes Bearer token auth, health checks, and optimized generation.
"""

import os
import logging
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI(title="PRism AI Inference Engine", version="1.0.0")
security = HTTPBearer()

# Configuration
MODEL_PATH = os.getenv("MODEL_PATH", "../training/checkpoints/prism-llama-3b_final")
API_KEY = os.getenv("API_KEY", "prism_secret_inference_key_123")
MAX_NEW_TOKENS = 2048

# Global state for model pipeline
inference_pipeline = None
tokenizer = None

class ReviewRequest(BaseModel):
    diff: str

def verify_api_key(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Simple Bearer token authentication."""
    if credentials.credentials != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return credentials.credentials

@app.on_event("startup")
async def startup_event():
    """Load model into VRAM on startup."""
    global inference_pipeline, tokenizer
    logging.info(f"Loading fine-tuned model from {MODEL_PATH}...")
    
    try:
        # In production, we load in 4-bit to save VRAM
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            device_map="auto",
            load_in_4bit=True,
            torch_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
        )
        inference_pipeline = pipeline("text-generation", model=model, tokenizer=tokenizer)
        logging.info("Model loaded successfully. Server ready for inference.")
    except Exception as e:
        logging.error(f"Failed to load model: {e}")
        # Note: We don't exit in case this is running in a local mock environment, 
        # but in production, this should hard-fail the container startup.

@app.get("/health")
async def health_check():
    """Kubernetes / Docker health check."""
    status = "healthy" if inference_pipeline is not None else "starting_or_failed"
    return {"status": status, "model": MODEL_PATH}

@app.post("/review")
async def generate_review(request: ReviewRequest, _: str = Depends(verify_api_key)):
    """
    Takes a Git diff and returns the structured JSON review.
    """
    if inference_pipeline is None:
        # Fallback mechanism if model failed to load (e.g., no GPU detected in dev environment)
        # In a real environment, the orchestrator handles fallback anyway if we return 503.
        raise HTTPException(status_code=503, detail="Model pipeline is currently unavailable.")
        
    logging.info(f"Received review request for diff size: {len(request.diff)} chars")
    
    # Construct the instruction prompt
    messages = [
        {
            "role": "system",
            "content": "You are an expert AI code reviewer. Analyze the following Git diff and output a structured JSON review evaluating security, architecture, and bugs."
        },
        {
            "role": "user",
            "content": f"[GIT DIFF]\n{request.diff}"
        }
    ]
    
    # Apply ChatML / Llama 3 formatting
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    
    # Run inference
    try:
        outputs = inference_pipeline(
            prompt,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=True,
            temperature=0.1, # Low temperature for highly deterministic JSON output
            top_p=0.9
        )
        
        # Extract the generated response (strip the prompt)
        generated_text = outputs[0]["generated_text"]
        response = generated_text[len(prompt):].strip()
        
        return {"raw_json": response}
        
    except Exception as e:
        logging.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail="Error during model generation.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
