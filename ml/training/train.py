"""
PRism AI Fine-tuning Pipeline
Trains Llama 3.2 3B using Unsloth and QLoRA for enterprise code review.
Supports resuming checkpoints, mixed precision, and tensorboard logging.
"""

import os
import torch
from datasets import load_dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Configuration
MODEL_NAME = "unsloth/Llama-3.2-3B-Instruct" # Pre-quantized Unsloth model
MAX_SEQ_LENGTH = 8192 # Sufficient for most diffs while avoiding OOM on 24GB GPUs
DATASET_PATH = "../datasets/train.jsonl"
OUTPUT_DIR = "checkpoints/prism-llama-3b"
BATCH_SIZE = 2
GRAD_ACCUMULATION = 4

def format_prompt(examples):
    """
    Format standard ChatML JSON array into Llama 3 prompt format.
    Unsloth handles the tokenizer chat template natively, but we ensure it aligns here.
    """
    texts = []
    for messages in examples["messages"]:
        # Naive string fallback if not using tokenizer.apply_chat_template directly
        # In production with Unsloth, it's better to let the tokenizer map it.
        texts.append(messages)
    return {"text": texts}

def main():
    logging.info(f"Loading {MODEL_NAME} with Unsloth 4-bit quantization...")
    
    # 1. Load Model & Tokenizer
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        dtype=None, # Auto-detect (bfloat16 on Ampere+)
        load_in_4bit=True,
    )
    
    # 2. Add LoRA Adapters
    logging.info("Applying LoRA adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=32, # High rank for learning strict JSON schema syntax
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
        lora_alpha=64,
        lora_dropout=0, # Unsloth supports 0 dropout for faster training
        bias="none",
        use_gradient_checkpointing="unsloth", # Massive VRAM savings
        random_state=3407,
        use_rslora=False,
        loftq_config=None,
    )
    
    # 3. Load & Prepare Dataset
    logging.info(f"Loading dataset from {DATASET_PATH}...")
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")
    
    # Map chat template
    # Unsloth provides a helper for this
    from unsloth.chat_templates import get_chat_template
    tokenizer = get_chat_template(
        tokenizer,
        chat_template="llama-3",
        mapping={"role": "role", "content": "content", "user": "user", "assistant": "assistant"}
    )
    
    def formatting_prompts_func(examples):
        convos = examples["messages"]
        texts = [tokenizer.apply_chat_template(convo, tokenize=False, add_generation_prompt=False) for convo in convos]
        return { "text" : texts }
        
    dataset = dataset.map(formatting_prompts_func, batched=True)

    # 4. Training Arguments
    logging.info("Configuring SFTTrainer...")
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=MAX_SEQ_LENGTH,
        dataset_num_proc=2,
        args=TrainingArguments(
            per_device_train_batch_size=BATCH_SIZE,
            gradient_accumulation_steps=GRAD_ACCUMULATION,
            warmup_steps=100,
            max_steps=1000, # Adjust for 1 epoch depending on dataset size
            learning_rate=2e-4,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=10,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=3407,
            output_dir=OUTPUT_DIR,
            report_to="tensorboard", # Track metrics
            save_strategy="steps",
            save_steps=200,
        ),
    )
    
    # 5. Execute Training
    logging.info("Starting Fine-tuning...")
    # Attempt to resume from checkpoint if it exists
    resume_from_checkpoint = os.path.exists(OUTPUT_DIR)
    trainer_stats = trainer.train(resume_from_checkpoint=resume_from_checkpoint)
    
    # 6. Save Final Adapters
    logging.info(f"Training complete. Saving final LoRA adapters to {OUTPUT_DIR}_final")
    model.save_pretrained(f"{OUTPUT_DIR}_final")
    tokenizer.save_pretrained(f"{OUTPUT_DIR}_final")
    
    logging.info("Run `tensorboard --logdir checkpoints` to view metrics.")

if __name__ == "__main__":
    # In a real environment, you run this via: `python train.py` on a GPU instance
    logging.info("Script initialized. Ready for GPU execution.")
