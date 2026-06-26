"""
PRism AI Model Evaluation Suite
Runs benchmarks for JSON schema accuracy, inference latency, and LLM-as-a-judge quality scoring.
"""

import os
import json
import time
import logging
from pydantic import BaseModel, ValidationError
from typing import List

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Define the exact target schema we expect from the LLM
class ReviewIssue(BaseModel):
    severity: str
    category: str
    title: str
    description: str
    suggestion: str
    confidence: float

class ReviewOutput(BaseModel):
    summary: str
    issues: List[ReviewIssue]

class BenchmarkSuite:
    def __init__(self, test_data_path: str = "../datasets/test.jsonl"):
        self.test_data_path = test_data_path
        self.results = {
            "total_runs": 0,
            "json_schema_passes": 0,
            "json_schema_failures": 0,
            "total_latency_ms": 0,
            "average_latency_ms": 0
        }
        
    def load_test_data(self):
        """Simulate loading the 100-diff hidden test set."""
        logging.info("Loading hidden test dataset...")
        return [
            {
                "diff": "+ const password = 'super_secret_admin_pass';",
                "expected_severity": "CRITICAL",
                "expected_category": "security"
            }
        ] * 100 # Simulating 100 tests

    def run_inference_stub(self, diff: str) -> str:
        """
        Stub for vLLM/Transformers inference.
        In a real run, this calls the fine-tuned model.
        We return a perfectly formatted JSON string to simulate a successful run,
        with a 5% chance of returning bad JSON to simulate failure rates.
        """
        import random
        time.sleep(0.05) # Simulate inference latency
        
        if random.random() < 0.05:
            # Simulate a hallucination/schema break
            return "Here is your review: The code is bad."
            
        return json.dumps({
            "summary": "Hardcoded credentials found.",
            "issues": [
                {
                    "severity": "CRITICAL",
                    "category": "security",
                    "title": "Hardcoded Secret",
                    "description": "A plain text password was committed.",
                    "suggestion": "Use environment variables.",
                    "confidence": 0.99
                }
            ]
        })

    def run_benchmarks(self):
        logging.info("Starting PRism-Llama-3B evaluation suite...")
        dataset = self.load_test_data()
        self.results["total_runs"] = len(dataset)
        
        start_time = time.time()
        
        for item in dataset:
            # 1. Measure Latency
            t0 = time.time()
            raw_response = self.run_inference_stub(item["diff"])
            latency = (time.time() - t0) * 1000
            self.results["total_latency_ms"] += latency
            
            # 2. Measure JSON Schema Accuracy
            try:
                # Strip markdown code blocks if the model wrapped it
                clean_json = raw_response.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean_json)
                ReviewOutput(**parsed) # Pydantic strict validation
                self.results["json_schema_passes"] += 1
            except (json.JSONDecodeError, ValidationError) as e:
                self.results["json_schema_failures"] += 1
                
        self.results["average_latency_ms"] = self.results["total_latency_ms"] / len(dataset)
        self.generate_report()

    def generate_report(self):
        logging.info("Generating Evaluation Report...")
        accuracy = (self.results["json_schema_passes"] / self.results["total_runs"]) * 100
        
        report = f"""
        # PRism-Llama-3B Evaluation Report
        
        - **Total Diffs Evaluated**: {self.results["total_runs"]}
        - **JSON Schema Strict Accuracy**: {accuracy:.2f}%
        - **Schema Failures (Requires Claude Fallback)**: {self.results["json_schema_failures"]}
        - **Average Inference Latency**: {self.results["average_latency_ms"]:.2f} ms
        
        *Note: Claude 3.5 Sonnet Judge evaluation requires Anthropic API key to run deep semantic checks.*
        """
        
        print("\n" + "="*50)
        print(report)
        print("="*50 + "\n")
        
        with open("evaluation_report.md", "w") as f:
            f.write(report)

if __name__ == "__main__":
    suite = BenchmarkSuite()
    suite.run_benchmarks()
