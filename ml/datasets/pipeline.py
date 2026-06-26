"""
PRism AI Dataset Engineering Pipeline
Downloads, cleans, and formats raw GitHub diffs into the target JSON instruction format.
"""

import json
import logging
from typing import List, Dict
import random

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class DatasetPipeline:
    def __init__(self, output_file: str = "ml/datasets/train.jsonl"):
        self.output_file = output_file
        self.raw_data = []
        self.formatted_data = []

    def load_raw_data(self):
        """
        Simulate loading from CodeReviewer, CommitPackFT, and OWASP.
        In production, this pulls from HuggingFace datasets via `datasets.load_dataset`.
        """
        logging.info("Loading raw data from HuggingFace (simulated for pipeline structure)...")
        # Example of raw diffs
        self.raw_data = [
            {
                "diff": "+ def authenticate(user_token):\n+     execute(f\"SELECT * FROM users WHERE token = '{user_token}'\")",
                "label": "SQL Injection vulnerability"
            },
            {
                "diff": "+ for i in range(len(users)):\n+     print(users[i])",
                "label": "Inefficient iteration, use 'for user in users'"
            }
        ]

    def format_to_json_schema(self) -> List[Dict]:
        """
        Transforms raw diffs into the rigid JSON schema we want the Llama model to learn.
        """
        logging.info("Formatting data to strict JSON Schema...")
        for item in self.raw_data:
            # In a real pipeline, we would use a teacher model (e.g., Claude 3.5 Sonnet) 
            # to generate these high-quality JSON labels for 10k examples.
            if "SQL" in item["label"]:
                target_json = {
                    "summary": "Critical SQL Injection vulnerability in authentication flow.",
                    "issues": [
                        {
                            "severity": "HIGH",
                            "category": "security",
                            "title": "SQL Injection",
                            "description": "String interpolation in SQL queries allows arbitrary query execution.",
                            "suggestion": "Use parameterized queries or an ORM.",
                            "confidence": 0.99
                        }
                    ]
                }
            else:
                target_json = {
                    "summary": "Inefficient loop iteration.",
                    "issues": [
                        {
                            "severity": "LOW",
                            "category": "maintainability",
                            "title": "Anti-pattern Loop",
                            "description": "Iterating over indices rather than the iterable itself.",
                            "suggestion": "Use 'for user in users:' instead.",
                            "confidence": 0.95
                        }
                    ]
                }

            # Construct the Alpaca/ChatML format
            formatted_example = {
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert AI code reviewer. Analyze the following Git diff and output a structured JSON review evaluating security, architecture, and bugs."
                    },
                    {
                        "role": "user",
                        "content": f"[GIT DIFF]\n{item['diff']}"
                    },
                    {
                        "role": "assistant",
                        "content": json.dumps(target_json)
                    }
                ]
            }
            self.formatted_data.append(formatted_example)

    def save_dataset(self):
        """Saves the formatted dataset to a JSONL file for QLoRA training."""
        logging.info(f"Saving {len(self.formatted_data)} examples to {self.output_file}...")
        with open(self.output_file, 'w') as f:
            for record in self.formatted_data:
                f.write(json.dumps(record) + '\n')
        logging.info("Dataset engineering complete.")

if __name__ == "__main__":
    pipeline = DatasetPipeline()
    pipeline.load_raw_data()
    pipeline.format_to_json_schema()
    pipeline.save_dataset()
