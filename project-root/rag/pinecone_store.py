"""
rag/pinecone_store.py
All Pinecone operations: connect, store findings, retrieve similar findings.
"""


from __future__ import annotations
import os
import uuid
from datetime import datetime, timezone


from rag.embedder import get_embedding




def _get_index():
    """Connect to Pinecone and return the index object."""
    from pinecone import Pinecone
    api_key    = os.environ.get("PINECONE_API_KEY", "")
    index_name = os.environ.get("PINECONE_INDEX", "opsoracle-findings")


    if not api_key:
        raise ValueError("PINECONE_API_KEY not set in .env file")


    pc = Pinecone(api_key=api_key)
    return pc.Index(index_name)




def ingest_findings(findings: list[dict], repo: str, pr_number: int) -> int:
    """
    Store a list of findings in Pinecone.
    Each finding becomes one vector with its metadata attached.
    Returns the number of findings successfully stored.
    """
    if not findings:
        return 0


    vectors = []
    for finding in findings:
        # Build a text description of this finding for embedding
        text = (
            f"Severity: {finding.get('severity', '')} | "
            f"Title: {finding.get('title', '')} | "
            f"File: {finding.get('file', '')} | "
            f"Explanation: {finding.get('explanation', '')[:200]}"
        )


        embedding = get_embedding(text)
        if not embedding:
            continue  # Skip if embedding failed


        vectors.append({
            "id": str(uuid.uuid4()),
            "values": embedding,
            "metadata": {
                "repo":       repo,
                "pr_number":  pr_number,
                "severity":   finding.get("severity", ""),
                "title":      finding.get("title", ""),
                "file":       finding.get("file", ""),
                "category":   finding.get("category", ""),
                "explanation": finding.get("explanation", "")[:300],
                "timestamp":  datetime.now(timezone.utc).isoformat(),
            }
        })


    if not vectors:
        return 0


    try:
        index = _get_index()
        index.upsert(vectors=vectors)
        print(f"[Pinecone] Stored {len(vectors)} findings for {repo} PR #{pr_number}")
        return len(vectors)
    except Exception as e:
        print(f"[Pinecone] Error storing findings: {e}")
        return 0




def retrieve_similar_findings(query_text: str, repo: str, top_k: int = 5) -> list[dict]:
    """
    Search Pinecone for past findings similar to the query text.
    Returns the top_k most similar findings.


    Example query: "IAM wildcard permission security risk"
    """
    embedding = get_embedding(query_text)
    if not embedding:
        return []


    try:
        index = _get_index()
        results = index.query(
            vector=embedding,
            top_k=top_k,
            include_metadata=True,
            filter={"repo": {"$eq": repo}},  # Only retrieve from SAME repo
        )
        matches = results.get("matches", [])
        return [m["metadata"] for m in matches if m.get("score", 0) > 0.6]
    except Exception as e:
        print(f"[Pinecone] Error retrieving findings: {e}")
        return []




def get_repo_history_summary(repo: str) -> dict:
    """
    Build a summary of historical findings for a repo.
    Used to give Gemini context about recurring problems.
    """
    similar = retrieve_similar_findings("security vulnerability", repo, top_k=20)


    if not similar:
        return {"repo": repo, "total_historical": 0, "recurring_issues": []}


    # Count severity distribution
    severities: dict[str, int] = {}
    titles:     dict[str, int] = {}


    for item in similar:
        sev = item.get("severity", "UNKNOWN")
        title = item.get("title", "Unknown")
        severities[sev]   = severities.get(sev, 0) + 1
        titles[title]     = titles.get(title, 0) + 1


    # Find issues that appear more than once (recurring)
    recurring = [t for t, count in titles.items() if count > 1]


    return {
        "repo":               repo,
        "total_historical":   len(similar),
        "severity_counts":    severities,
        "recurring_issues":   recurring[:5],  # Top 5 recurring
    }
