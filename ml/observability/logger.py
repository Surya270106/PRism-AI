"""
PRism AI Enterprise Observability Logger
Structured JSON logging for Datadog / ELK ingestion.
Tracks model routing, confidence, latency, and fallback frequency.
"""

import json
import logging
import time
from typing import Dict, Any

class PrismLogger:
    def __init__(self):
        self.logger = logging.getLogger("prism_ai.orchestrator")
        self.logger.setLevel(logging.INFO)
        
        # Ensure we don't duplicate handlers
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            # In an enterprise, we log pure JSON strings so CloudWatch/Datadog can parse them
            formatter = logging.Formatter('%(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def log_review_trace(
        self, 
        request_id: str, 
        model_selected: str, 
        latency_ms: float, 
        confidence: float, 
        fallback_triggered: bool, 
        schema_valid: bool, 
        error_msg: str = None
    ):
        """
        Emits a structured JSON trace for a single PR review.
        """
        log_payload = {
            "event": "review_trace",
            "timestamp": time.time(),
            "request_id": request_id,
            "metrics": {
                "latency_ms": latency_ms,
                "confidence_score": confidence,
            },
            "routing": {
                "primary_model_used": model_selected,
                "fallback_triggered": fallback_triggered,
                "schema_validation_passed": schema_valid
            }
        }
        
        if error_msg:
            log_payload["error"] = error_msg
            self.logger.error(json.dumps(log_payload))
        else:
            self.logger.info(json.dumps(log_payload))

# Singleton instance
prism_logger = PrismLogger()

if __name__ == "__main__":
    # Test the logger
    prism_logger.log_review_trace(
        request_id="req_123abc",
        model_selected="PRism-Llama-3B",
        latency_ms=124.5,
        confidence=0.92,
        fallback_triggered=False,
        schema_valid=True
    )
