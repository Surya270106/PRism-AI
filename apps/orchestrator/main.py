"""
PRism AI Review Orchestrator
The central intelligence router that sits between the frontend and the LLMs.
Handles schema validation, confidence thresholds, and automatic fallback to Claude.
"""

import os
import json
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, ValidationError, Field
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI(title="PRism AI Review Orchestrator", version="1.0.0")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
USE_LOCAL_MODEL = os.getenv("USE_LOCAL_MODEL", "true").lower() == "true"
USE_CLAUDE_FALLBACK = os.getenv("USE_CLAUDE_FALLBACK", "true").lower() == "true"
CLAUDE_CONFIDENCE_THRESHOLD = float(os.getenv("CLAUDE_CONFIDENCE_THRESHOLD", "0.80"))

LLAMA_SERVER_URL = os.getenv("LLAMA_SERVER_URL", "http://localhost:8000/review")
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY", "prism_secret_inference_key_123")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = "claude-3-5-sonnet-20240620"

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------
class ReviewRequest(BaseModel):
    diff: str

class ReviewIssue(BaseModel):
    severity: str = Field(..., description="LOW, MED, HIGH, or CRITICAL")
    category: str = Field(..., description="security, performance, maintainability, or bug")
    title: str
    description: str
    suggestion: str
    confidence: float = Field(..., ge=0.0, le=1.0)

class ReviewOutput(BaseModel):
    summary: str
    issues: List[ReviewIssue]

# ---------------------------------------------------------------------------
# External API Callers
# ---------------------------------------------------------------------------
async def fetch_llama_review(diff: str) -> Optional[ReviewOutput]:
    """Calls the local PRism Llama 3B inference server."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                LLAMA_SERVER_URL,
                json={"diff": diff},
                headers={"Authorization": f"Bearer {LLAMA_API_KEY}"}
            )
            response.raise_for_status()
            data = response.json()
            
            raw_json = data.get("raw_json", "")
            # Clean up markdown formatting if the model wrapped it
            clean_json = raw_json.replace("```json", "").replace("```", "").strip()
            
            # Strict validation
            parsed_json = json.loads(clean_json)
            review = ReviewOutput(**parsed_json)
            
            # Confidence check
            avg_confidence = sum(issue.confidence for issue in review.issues) / len(review.issues) if review.issues else 1.0
            if avg_confidence < CLAUDE_CONFIDENCE_THRESHOLD:
                logging.warning(f"Llama 3B confidence ({avg_confidence:.2f}) is below threshold ({CLAUDE_CONFIDENCE_THRESHOLD}).")
                return None
                
            return review
            
    except (httpx.RequestError, json.JSONDecodeError, ValidationError) as e:
        logging.error(f"Llama 3B Failed: {str(e)}")
        return None

async def fetch_claude_review(diff: str) -> ReviewOutput:
    """Calls Anthropic Claude 3.5 Sonnet as the enterprise fallback."""
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="Claude fallback triggered, but ANTHROPIC_API_KEY is not set.")
        
    logging.info("Routing request to Claude 3.5 Sonnet...")
    system_prompt = "You are an expert AI code reviewer. Analyze the Git diff and output a structured JSON review evaluating security, architecture, and bugs. ONLY output JSON matching the schema."
    
    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": 2048,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": f"[GIT DIFF]\n{diff}"}
                    ]
                }
            )
            response.raise_for_status()
            data = response.json()
            raw_text = data["content"][0]["text"]
            
            clean_json = raw_text.replace("```json", "").replace("```", "").strip()
            parsed_json = json.loads(clean_json)
            return ReviewOutput(**parsed_json)
            
    except Exception as e:
        logging.error(f"Claude fallback failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Both primary model and fallback model failed.")

# ---------------------------------------------------------------------------
# Orchestrator Endpoints
# ---------------------------------------------------------------------------
@app.post("/api/v1/review", response_model=ReviewOutput)
async def create_review(request: ReviewRequest):
    """
    Enterprise Model Router Endpoint.
    1. Try Llama 3B (if enabled).
    2. Validate JSON & Confidence.
    3. Fallback to Claude 3.5 Sonnet (if enabled & needed).
    """
    review = None
    
    if USE_LOCAL_MODEL:
        logging.info("Attempting primary generation via PRism Llama 3B...")
        review = await fetch_llama_review(request.diff)
        
    if review is not None:
        logging.info("Successfully generated review via Llama 3B.")
        return review
        
    if USE_CLAUDE_FALLBACK:
        logging.warning("Triggering Enterprise Fallback to Claude Sonnet.")
        review = await fetch_claude_review(request.diff)
        return review
        
    raise HTTPException(status_code=500, detail="Primary model failed and fallback is disabled.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
