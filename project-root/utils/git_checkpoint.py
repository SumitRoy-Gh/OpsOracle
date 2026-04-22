"""
utils/git_checkpoint.py
Creates a git commit as a safety checkpoint before applying AI patches.
If a patch causes problems, run: git revert HEAD   to undo it.
"""


from __future__ import annotations
import subprocess
import os
from datetime import datetime




def create_checkpoint(message: str = "") -> dict:
    """
    Stage all changes and create a git commit.


    Returns:
      {"success": True,  "sha": "abc123", "message": "..."}
      {"success": False, "error": "reason"}
    """
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    commit_msg = message or f"AUTO CHECKPOINT before AI patch — {timestamp}"


    try:
        # Check if we are even in a git repo
        result = subprocess.run(
            ["git", "rev-parse", "--is-inside-work-tree"],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            return {"success": False, "error": "Not a git repository"}


        # Stage all changes
        subprocess.run(["git", "add", "."], check=True, capture_output=True)


        # Create the checkpoint commit
        commit_result = subprocess.run(
            ["git", "commit", "-m", commit_msg, "--allow-empty"],
            capture_output=True, text=True
        )


        if commit_result.returncode != 0:
            # If nothing to commit, that is fine
            if "nothing to commit" in commit_result.stdout:
                return {"success": True, "sha": "no-changes", "message": "Nothing to commit"}
            return {"success": False, "error": commit_result.stderr}


        # Get the commit SHA
        sha_result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True
        )
        sha = sha_result.stdout.strip()


        print(f"[GitCheckpoint] Created checkpoint: {sha} — {commit_msg}")
        return {"success": True, "sha": sha, "message": commit_msg}


    except subprocess.CalledProcessError as e:
        print(f"[GitCheckpoint] Git command failed: {e}")
        return {"success": False, "error": str(e)}
    except FileNotFoundError:
        # git is not installed
        return {"success": False, "error": "git not found — is it installed?"}




def backup_file(filepath: str) -> str | None:
    """
    Creates a .backup copy of a file before patching it.
    Returns the backup path, or None if backup failed.
    """
    import shutil
    backup_path = filepath + ".backup"
    try:
        shutil.copy2(filepath, backup_path)
        print(f"[GitCheckpoint] Backed up: {filepath} → {backup_path}")
        return backup_path
    except Exception as e:
        print(f"[GitCheckpoint] Backup failed for {filepath}: {e}")
        return None
