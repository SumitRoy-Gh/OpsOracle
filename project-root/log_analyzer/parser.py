"""
log_analyzer/parser.py
Detects log source type and extracts error lines with surrounding context.
"""

from __future__ import annotations
import re


_SOURCE_PATTERNS = [
    ("kubernetes", r"pod/|kubectl|OOMKilled|CrashLoopBackOff|BackOff|Evicted|imagePullBackOff"),
    ("docker",     r"container_name|DOCKER|docker\s"),
    ("aws",        r"AWS|Lambda|CloudWatch|ECS|Fargate|RequestId|Task timed out"),
    ("app",        r"ERROR|FATAL|Exception|Traceback|stack trace|panic:"),
]

_ERROR_PATTERNS = [
    (r"ERROR|FATAL|CRITICAL",                            "error"),
    (r"Exception|Traceback|stack trace|panic:",          "exception"),
    (r"OOMKilled|Out of memory|Cannot allocate",         "oom"),
    (r"CrashLoopBackOff|Back-off|restarting failed",     "crash_loop"),
    (r"connection refused|timeout|ETIMEDOUT|ECONNRESET", "connectivity"),
    (r"permission denied|unauthorized|403|401|Forbidden","auth"),
    (r"No such file|FileNotFoundError|ENOENT",           "missing_file"),
    (r"imagePullBackOff|ErrImagePull",                   "image_pull"),
]


def detect_log_source(log_text: str) -> str:
    for source, pattern in _SOURCE_PATTERNS:
        if re.search(pattern, log_text, re.IGNORECASE):
            return source
    return "unknown"


def extract_error_lines(log_text: str) -> list[dict]:
    lines = log_text.splitlines()
    results: list[dict] = []

    for i, line in enumerate(lines, 1):
        for pattern, error_type in _ERROR_PATTERNS:
            if re.search(pattern, line, re.IGNORECASE):
                # 3 lines before + 3 lines after for context
                start   = max(0, i - 4)
                end     = min(len(lines), i + 3)
                context = "\n".join(lines[start:end])
                results.append({
                    "line_number": i,
                    "content":    line.strip(),
                    "error_type": error_type,
                    "context":    context,
                })
                break   # one type per line

    return results
