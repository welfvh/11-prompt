"""
Prompt configuration management.
Handles loading, saving, and versioning of prompt configurations as JSON files.
"""
import json
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from .prompts_examples import EXAMPLE_PROMPTS


class PromptManager:
    """Manages prompt configurations stored as JSON files"""

    def __init__(self, prompts_dir: str = None):
        if prompts_dir is None:
            # Default to project's prompts directory
            base_dir = Path(__file__).parent.parent.parent
            prompts_dir = base_dir / "prompts"

        self.prompts_dir = Path(prompts_dir)
        self.prompts_dir.mkdir(parents=True, exist_ok=True)

        # Initialize with example prompts if none exist
        if not list(self.prompts_dir.glob("*.json")):
            self._create_example_prompts()

    def _create_example_prompts(self):
        """Create example prompt configurations for the team"""
        for prompt in EXAMPLE_PROMPTS:
            prompt["created_at"] = datetime.now().isoformat()
            prompt["updated_at"] = datetime.now().isoformat()
            self.save_prompt(prompt)

    def list_prompts(self) -> List[Dict[str, Any]]:
        """List all available prompt configurations"""
        prompts = []

        for prompt_file in self.prompts_dir.glob("*.json"):
            try:
                with open(prompt_file, 'r', encoding='utf-8') as f:
                    prompt = json.load(f)
                    prompts.append({
                        "id": prompt.get("id"),
                        "name": prompt.get("name"),
                        "version": prompt.get("version"),
                        "created_at": prompt.get("created_at"),
                        "updated_at": prompt.get("updated_at"),
                        "use_case": prompt.get("use_case"),
                    })
            except Exception as e:
                print(f"Error loading prompt {prompt_file}: {e}")

        return sorted(prompts, key=lambda x: x.get("updated_at", ""), reverse=True)

    def get_prompt(self, prompt_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific prompt configuration"""
        prompt_file = self.prompts_dir / f"{prompt_id}.json"

        if not prompt_file.exists():
            return None

        try:
            with open(prompt_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading prompt {prompt_id}: {e}")
            return None

    def save_prompt(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Save a prompt configuration"""
        prompt_id = config.get("id")
        if not prompt_id:
            raise ValueError("Prompt configuration must have an 'id' field")

        # Update timestamp
        existing = self.get_prompt(prompt_id)
        if existing:
            config["created_at"] = existing.get("created_at", datetime.now().isoformat())
        else:
            config["created_at"] = datetime.now().isoformat()

        config["updated_at"] = datetime.now().isoformat()

        # Save to file
        prompt_file = self.prompts_dir / f"{prompt_id}.json"

        try:
            with open(prompt_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)

            return {
                "status": "saved",
                "id": prompt_id,
                "file": str(prompt_file)
            }
        except Exception as e:
            raise Exception(f"Error saving prompt: {e}")

    def delete_prompt(self, prompt_id: str) -> bool:
        """Delete a prompt configuration"""
        prompt_file = self.prompts_dir / f"{prompt_id}.json"

        if not prompt_file.exists():
            return False

        try:
            prompt_file.unlink()
            return True
        except Exception as e:
            print(f"Error deleting prompt {prompt_id}: {e}")
            return False

    def duplicate_prompt(self, prompt_id: str, new_id: str) -> Optional[Dict[str, Any]]:
        """Duplicate an existing prompt with a new ID"""
        existing = self.get_prompt(prompt_id)

        if not existing:
            return None

        # Create new config
        new_config = existing.copy()
        new_config["id"] = new_id
        new_config["name"] = f"{existing.get('name', 'Unnamed')} (Copy)"

        return self.save_prompt(new_config)
