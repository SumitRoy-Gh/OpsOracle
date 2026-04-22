"""
cli.py
OpsOracle CLI — run scans, analyze logs, chat, and check history
directly from the terminal. Works in two modes:

  LOCAL mode  — runs scanner + Gemini directly (no server needed)
  SERVER mode — talks to a running FastAPI backend via HTTP

Usage:
  python cli.py --help
  python cli.py scan main.tf
  python cli.py scan ./infra/
  python cli.py logs app.log
  python cli.py logs --paste
  python cli.py chat
  python cli.py history
  python cli.py report <scan-id>
  python cli.py risk owner/repo
  python cli.py health
"""

from __future__ import annotations

import json
import os
import sys
import textwrap
from pathlib import Path

# Force UTF-8 output on Windows to support emojis in terminal
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import click
import httpx
from dotenv import load_dotenv
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
from rich import box

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

console = Console()

# Default backend URL — can be overridden with --server flag
DEFAULT_SERVER = os.environ.get("OPSORACLE_SERVER", "http://localhost:8000")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _severity_color(severity: str) -> str:
    return {
        "CRITICAL": "bold red",
        "HIGH":     "bold yellow",
        "MEDIUM":   "yellow",
        "LOW":      "blue",
        "INFO":     "dim",
        "Clean":    "bold green",
    }.get(severity.upper(), "white")


def _severity_icon(severity: str) -> str:
    return {
        "CRITICAL": "🔴",
        "HIGH":     "🟠",
        "MEDIUM":   "🟡",
        "LOW":      "🔵",
        "INFO":     "⚪",
        "CLEAN":    "✅",
    }.get(severity.upper(), "⚪")


def _print_banner():
    console.print(Panel.fit(
        "[bold white]🛡️  OPSORACLE[/bold white]\n"
        "[dim]AI DevSecOps Review System[/dim]",
        border_style="yellow",
    ))


def _print_findings_table(findings: list[dict]):
    if not findings:
        console.print("\n[bold green]✅ No issues found.[/bold green]\n")
        return

    table = Table(
        box=box.ROUNDED,
        show_header=True,
        header_style="bold white on dark_blue",
        border_style="dim",
        expand=True,
    )
    table.add_column("ID",         style="dim",        width=10)
    table.add_column("Severity",   width=10)
    table.add_column("File",       style="cyan",       width=20)
    table.add_column("Line",       style="dim",        width=6)
    table.add_column("Title",      width=30)
    table.add_column("Fix",        width=40)

    for f in findings:
        sev   = f.get("severity", "INFO")
        color = _severity_color(sev)
        icon  = _severity_icon(sev)
        table.add_row(
            str(f.get("id", "")),
            f"[{color}]{icon} {sev}[/{color}]",
            str(f.get("file", "")),
            str(f.get("line", "")),
            str(f.get("title", f.get("message", "")))[:50],
            str(f.get("fix_suggestion", f.get("suggestion", "")))[:60],
        )

    console.print(table)


def _print_summary(result: dict):
    sev   = result.get("overall_severity", "Unknown")
    score = result.get("risk_score", result.get("overall_score", "N/A"))
    total = len(result.get("findings", result.get("file_results", [])))
    color = _severity_color(sev)

    console.print(
        f"\n[bold]Summary:[/bold] "
        f"[{color}]{_severity_icon(sev)} {sev}[/{color}]  |  "
        f"Score: [bold]{score}[/bold]/100  |  "
        f"Findings: [bold]{total}[/bold]"
    )

    actions = result.get("recommended_actions", [])
    if actions:
        console.print("\n[bold underline]Recommended Actions:[/bold underline]")
        for action in actions:
            console.print(f"  [yellow]▸[/yellow] {action}")
    console.print()


def _check_server(server: str) -> bool:
    """Return True if backend is reachable."""
    try:
        r = httpx.get(f"{server}/health", timeout=3)
        return r.status_code == 200
    except Exception:
        return False


# ── CLI group ──────────────────────────────────────────────────────────────────

@click.group()
@click.option(
    "--server", "-s",
    default=DEFAULT_SERVER,
    help="OpsOracle backend URL (default: http://localhost:8000)",
    envvar="OPSORACLE_SERVER",
)
@click.pass_context
def cli(ctx, server):
    """
    🛡️  OpsOracle CLI — AI DevSecOps Review System

    Scan infrastructure files, analyze logs, and chat with the AI
    assistant directly from your terminal.
    """
    ctx.ensure_object(dict)
    ctx.obj["server"] = server


# ── health ─────────────────────────────────────────────────────────────────────

@cli.command()
@click.pass_context
def health(ctx):
    """Check if the OpsOracle backend is running."""
    _print_banner()
    server = ctx.obj["server"]

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        progress.add_task(f"Checking {server}...", total=None)
        alive = _check_server(server)

    if alive:
        console.print(f"[bold green]✅ Backend is running at {server}[/bold green]")
    else:
        console.print(
            f"[bold red]❌ Backend not reachable at {server}[/bold red]\n"
            f"[dim]Start it with: docker-compose up[/dim]"
        )
        sys.exit(1)


# ── scan ───────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("path", type=click.Path(exists=True))
@click.option("--local", "-l", is_flag=True,
              help="Run scanner locally without backend (no Gemini enrichment)")
@click.option("--json-out", "-j", is_flag=True,
              help="Output raw JSON instead of formatted table")
@click.option("--patch", "-p", is_flag=True,
              help="Apply AI patches to fixable findings")
@click.pass_context
def scan(ctx, path, local, json_out, patch):
    """
    Scan an infrastructure file or directory for security and cost issues.

    Examples:\n
      python cli.py scan main.tf\n
      python cli.py scan ./infra/\n
      python cli.py scan k8s/deployment.yaml --local\n
    """
    _print_banner()
    server    = ctx.obj["server"]
    path_obj  = Path(path)

    # ── Collect files ──────────────────────────────────────────────────────────
    if path_obj.is_file():
        files = [path_obj]
    else:
        # Recursively find all files in the directory
        files = [
            p for p in path_obj.rglob("*")
            if p.is_file()
        ]

    if not files:
        console.print("[yellow]No files found.[/yellow]")
        return

    # ── LOCAL mode — run scanner directly, no Gemini ──────────────────────────
    if local:
        console.print("[dim]Running in LOCAL mode (scanner only, no AI enrichment)[/dim]\n")
        _run_local_scan(files, json_out)
        return

    # ── SERVER mode — send to backend ─────────────────────────────────────────
    if not _check_server(server):
        console.print(
            f"[yellow]⚠ Backend not running at {server}. "
            f"Falling back to LOCAL mode.[/yellow]\n"
        )
        _run_local_scan(files, json_out)
        return

    _run_server_scan(files, server, json_out, patch)


def _run_local_scan(files: list[Path], json_out: bool):
    """Run scanner directly without backend."""
    # Import here to avoid issues if scanner is not available
    from scanner.engine import scan_file
    from scanner.detector import is_infra_file

    all_results = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        task = progress.add_task("Scanning files...", total=len(files))
        for f in files:
            if is_infra_file(str(f)):
                result = scan_file(str(f), f.read_text(errors="replace"))
                if result:
                    all_results.append(result)
            progress.advance(task)

    if not all_results:
        console.print("[yellow]No supported infrastructure files found.[/yellow]")
        console.print(
            "[dim]Supported: .tf, .tfvars, Dockerfile, "
            "docker-compose.yml, k8s/*.yaml, .github/workflows/*.yml, template.yaml[/dim]"
        )
        return

    if json_out:
        console.print_json(json.dumps(all_results, indent=2))
        return

    total_findings = sum(len(r.get("findings", [])) for r in all_results)
    console.print(
        f"[bold]Scanned {len(all_results)} file(s) — "
        f"{total_findings} finding(s)[/bold]\n"
    )

    for result in all_results:
        findings = result.get("findings", [])
        score    = result.get("score", 100)
        grade    = result.get("grade", "A")
        fname    = result.get("file", "")

        grade_color = "green" if grade in ("A", "B") else "yellow" if grade == "C" else "red"
        console.print(
            f"[bold cyan]{fname}[/bold cyan]  "
            f"Grade: [{grade_color}]{grade}[/{grade_color}]  "
            f"Score: {score}/100  "
            f"Findings: {len(findings)}"
        )

        if findings:
            _print_findings_table(findings)
        else:
            console.print("  [green]✅ Clean[/green]\n")


def _run_server_scan(files: list[Path], server: str, json_out: bool, patch: bool):
    """Send files to backend for full AI-enriched scan."""
    from scanner.detector import is_infra_file

    infra_files = [f for f in files if is_infra_file(str(f))]

    if not infra_files:
        console.print("[yellow]No supported infrastructure files found.[/yellow]")
        return

    console.print(
        f"[dim]Sending {len(infra_files)} file(s) to backend for AI analysis...[/dim]\n"
    )

    all_results = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        for f in infra_files:
            task = progress.add_task(f"Analyzing {f.name}...", total=None)
            try:
                content = f.read_text(errors="replace")
                response = httpx.post(
                    f"{server}/analyze",
                    json={
                        "terraform_content":   content,
                        "terraform_file_name": str(f),
                    },
                    timeout=60,
                )
                response.raise_for_status()
                result = response.json()
                result["_filename"] = str(f)
                all_results.append(result)
            except Exception as e:
                console.print(f"[red]Failed to analyze {f.name}: {e}[/red]")
            progress.remove_task(task)

    if not all_results:
        return

    if json_out:
        console.print_json(json.dumps(all_results, indent=2))
        return

    for result in all_results:
        fname    = result.get("_filename", "")
        findings = result.get("findings", [])
        sev      = result.get("overall_severity", "Clean")
        score    = result.get("risk_score", 100)
        color    = _severity_color(sev)

        console.print(
            f"\n[bold cyan]{fname}[/bold cyan]  "
            f"[{color}]{_severity_icon(sev)} {sev}[/{color}]  "
            f"Score: {score}/100"
        )

        if findings:
            _print_findings_table(findings)
            # Show Gemini explanations for each finding
            console.print("[bold underline]AI Explanations:[/bold underline]")
            for f_item in findings:
                sev_color = _severity_color(f_item.get("severity", "INFO"))
                console.print(
                    f"\n  [{sev_color}]{_severity_icon(f_item.get('severity','INFO'))} "
                    f"[{f_item.get('severity','')}] {f_item.get('title','')}[/{sev_color}]"
                )
                explanation = f_item.get("explanation", "")
                if explanation:
                    for line in textwrap.wrap(explanation, width=70):
                        console.print(f"  [dim]{line}[/dim]")
                fix = f_item.get("fix_suggestion", "")
                if fix:
                    console.print(f"  [green]Fix:[/green] {fix}")
                if f_item.get("patch"):
                    console.print(
                        f"  [yellow]Patch:[/yellow]\n"
                        f"  [code]{f_item['patch']}[/code]"
                    )
                compliance = f_item.get("compliance", [])
                if compliance:
                    console.print(f"  [dim]Compliance: {', '.join(compliance)}[/dim]")
        else:
            console.print("  [green]✅ Clean[/green]")

        _print_summary(result)

        # ── NEW: Apply patches if --patch flag was used ──────────────────
        if patch:
            from core.patch_agent import PatchAgent
            from pathlib import Path
            findings = result.get("findings", [])
            patchable = [f for f in findings if f.get("safe_auto_fix")]
            if patchable:
                console.print(f"\n[bold yellow]Found {len(patchable)} auto-patchable finding(s)[/bold yellow]")
                console.print("[yellow]Creating git checkpoint...[/yellow]")
                file_contents = {str(f): Path(str(f)).read_text() for f in files if Path(str(f)).exists()}
                from schemas import Finding as FindingSchema
                finding_objects = [FindingSchema(**fdict) for fdict in patchable]
                agent = PatchAgent(dry_run=False)
                patch_results = agent.patch_findings(finding_objects, file_contents)
                for pr in patch_results:
                    if pr["status"] == "applied":
                        console.print(f"  [green]✅ Patched: {pr['file']} (finding {pr['finding_id']})[/green]")
                    elif pr["status"] == "dry_run":
                        console.print(f"  [yellow]DRY RUN: {pr['file']}[/yellow]")
                    elif pr["status"] == "skipped":
                        console.print(f"  [dim]Skipped: {pr['reason']}[/dim]")
                    else:
                        console.print(f"  [red]Failed: {pr.get('reason', 'unknown error')}[/red]")
            else:
                console.print("[dim]No auto-patchable findings in this scan.[/dim]")
        # ── END NEW CODE ──────────────────────────────────────────────────


# ── logs ───────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("logfile", type=click.Path(exists=True), required=False)
@click.option("--paste", "-p", is_flag=True,
              help="Paste log text interactively instead of providing a file")
@click.option("--json-out", "-j", is_flag=True,
              help="Output raw JSON")
@click.pass_context
def logs(ctx, logfile, paste, json_out):
    """
    Analyze log files for root cause and fix suggestions.

    Examples:\n
      python cli.py logs app.log\n
      python cli.py logs kubernetes-pod.log\n
      python cli.py logs --paste\n
    """
    _print_banner()
    server = ctx.obj["server"]

    # ── Get log text ───────────────────────────────────────────────────────────
    if paste:
        console.print(
            "[bold]Paste your logs below.[/bold] "
            "[dim]Press Ctrl+D (Mac/Linux) or Ctrl+Z then Enter (Windows) when done.[/dim]\n"
        )
        try:
            log_text = sys.stdin.read()
        except KeyboardInterrupt:
            console.print("\n[yellow]Cancelled.[/yellow]")
            return
    elif logfile:
        log_text = Path(logfile).read_text(errors="replace")
    else:
        console.print("[red]Provide a log file path or use --paste flag.[/red]")
        console.print("[dim]Example: python cli.py logs app.log[/dim]")
        sys.exit(1)

    if not log_text.strip():
        console.print("[yellow]Log text is empty.[/yellow]")
        return

    # ── Send to backend ────────────────────────────────────────────────────────
    if not _check_server(server):
        console.print(
            f"[red]❌ Backend not running at {server}. "
            f"Start it with: docker-compose up[/red]"
        )
        sys.exit(1)

    source_hint = "unknown"
    import re
    if re.search(r"CrashLoopBackOff|OOMKilled|kubectl|pod/", log_text):
        source_hint = "kubernetes"
    elif re.search(r"container_name|DOCKER", log_text, re.IGNORECASE):
        source_hint = "docker"
    elif re.search(r"AWS|Lambda|CloudWatch", log_text):
        source_hint = "aws"

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        progress.add_task("Analyzing logs with Gemini...", total=None)
        try:
            response = httpx.post(
                f"{server}/analyze/logs",
                json={"log_text": log_text, "source_hint": source_hint},
                timeout=60,
            )
            response.raise_for_status()
            result = response.json()
        except Exception as e:
            console.print(f"[red]Log analysis failed: {e}[/red]")
            sys.exit(1)

    if json_out:
        console.print_json(json.dumps(result, indent=2))
        return

    # ── Print results ──────────────────────────────────────────────────────────
    sev   = result.get("overall_severity", "Unknown")
    score = result.get("risk_score", 0)
    color = _severity_color(sev)

    console.print(Panel(
        f"[bold]{result.get('summary', '')}[/bold]\n"
        f"Severity: [{color}]{_severity_icon(sev)} {sev}[/{color}]  |  "
        f"Risk Score: [bold]{score}[/bold]/100",
        title="[bold]Log Analysis Result[/bold]",
        border_style="yellow",
    ))

    for finding in result.get("findings", []):
        sev_color = _severity_color(finding.get("severity", "INFO"))
        console.print(
            f"\n[{sev_color}]{_severity_icon(finding.get('severity','INFO'))} "
            f"[{finding.get('severity','')}] {finding.get('title','')}[/{sev_color}]"
        )
        explanation = finding.get("explanation", "")
        if explanation:
            for line in textwrap.wrap(explanation, width=72):
                console.print(f"  {line}")

        console.print(
            f"\n  [bold green]Immediate Fix:[/bold green] "
            f"{finding.get('fix_suggestion', '')}"
        )

        cost = finding.get("cost_impact", "None")
        if cost and cost != "None":
            console.print(f"  [yellow]Cost Impact:[/yellow] {cost}")

        conf = finding.get("confidence", 0)
        console.print(f"  [dim]Confidence: {int(conf * 100)}%[/dim]")

    actions = result.get("recommended_actions", [])
    if actions:
        console.print("\n[bold underline]Recommended Actions:[/bold underline]")
        for action in actions:
            console.print(f"  [yellow]▸[/yellow] {action}")

    console.print()


# ── chat ───────────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--context", "-c", default="",
              help="Initial context (e.g. paste a finding or scan summary)")
@click.pass_context
def chat(ctx, context):
    """
    Start an interactive DevOps chat session with OpsOracle AI.

    Examples:\n
      python cli.py chat\n
      python cli.py chat --context "CrashLoopBackOff in pod/my-app"\n
    """
    _print_banner()
    server = ctx.obj["server"]

    if not _check_server(server):
        console.print(
            f"[red]❌ Backend not running at {server}. "
            f"Start it with: docker-compose up[/red]"
        )
        sys.exit(1)

    console.print(Panel(
        "[bold]OpsOracle AI DevOps Chat[/bold]\n"
        "[dim]Ask anything about infrastructure, security, or logs.\n"
        "Type [bold]exit[/bold] or press Ctrl+C to quit.[/dim]",
        border_style="yellow",
    ))

    if context:
        console.print(f"[dim]Context loaded: {context[:100]}...[/dim]\n")

    history: list[dict] = []

    while True:
        try:
            # Get user input
            console.print("[bold yellow]You:[/bold yellow] ", end="")
            user_input = input().strip()
        except (KeyboardInterrupt, EOFError):
            console.print("\n[dim]Chat ended.[/dim]")
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit", "q", ":q"):
            console.print("[dim]Chat ended.[/dim]")
            break

        history.append({"role": "user", "text": user_input})

        # Send to backend
        with Progress(
            SpinnerColumn(),
            TextColumn("[dim]Thinking...[/dim]"),
            transient=True,
        ) as progress:
            progress.add_task("", total=None)
            try:
                response = httpx.post(
                    f"{server}/chat",
                    json={
                        "message": user_input,
                        "context": context,
                        "history": history[-6:],
                    },
                    timeout=60,
                )
                response.raise_for_status()
                data     = response.json()
                answer   = data.get("response", "No response")
            except Exception as e:
                answer = f"Error: {e}"

        history.append({"role": "assistant", "text": answer})

        console.print("\n[bold green]OpsOracle:[/bold green]")
        # Render markdown if it looks like it has markdown
        if any(c in answer for c in ("**", "##", "- ", "```", "`")):
            console.print(Markdown(answer))
        else:
            for line in answer.splitlines():
                console.print(f"  {line}")
        console.print()


# ── history ────────────────────────────────────────────────────────────────────

@cli.command()
@click.option("--repo", "-r", default=None,
              help="Filter by repo name (e.g. myorg/myrepo)")
@click.option("--limit", "-n", default=10,
              help="Number of scans to show (default: 10)")
@click.option("--json-out", "-j", is_flag=True,
              help="Output raw JSON")
@click.pass_context
def history(ctx, repo, limit, json_out):
    """
    Show recent PR scan history from the database.

    Examples:\n
      python cli.py history\n
      python cli.py history --repo myorg/myrepo\n
      python cli.py history --limit 20\n
    """
    _print_banner()
    server = ctx.obj["server"]

    if not _check_server(server):
        console.print(f"[red]❌ Backend not running at {server}[/red]")
        sys.exit(1)

    params = {"limit": limit}
    if repo:
        params["repo"] = repo

    try:
        response = httpx.get(f"{server}/api/scans", params=params, timeout=15)
        response.raise_for_status()
        data  = response.json()
        scans = data.get("scans", [])
    except Exception as e:
        console.print(f"[red]Failed to fetch history: {e}[/red]")
        sys.exit(1)

    if json_out:
        console.print_json(json.dumps(scans, indent=2))
        return

    if not scans:
        console.print("[yellow]No scans found.[/yellow]")
        return

    table = Table(
        title=f"Recent Scans ({len(scans)})",
        box=box.ROUNDED,
        header_style="bold white on dark_blue",
        border_style="dim",
        expand=True,
    )
    table.add_column("Repo",         style="cyan",   width=25)
    table.add_column("PR #",         width=8)
    table.add_column("Score",        width=8)
    table.add_column("Grade",        width=7)
    table.add_column("Findings",     width=10)
    table.add_column("Critical",     width=10)
    table.add_column("High",         width=8)
    table.add_column("Date",         width=20)
    table.add_column("Scan ID",      style="dim",    width=10)

    for s in scans:
        counts   = s.get("severity_counts", {})
        score    = s.get("overall_score", "N/A")
        grade    = s.get("overall_grade", "?")
        g_color  = "green" if grade in ("A","B") else "yellow" if grade == "C" else "red"
        critical = counts.get("CRITICAL", 0)
        high     = counts.get("HIGH", 0)
        c_color  = "red" if critical > 0 else "dim"

        table.add_row(
            s.get("repo", ""),
            str(s.get("pr_number", "—")),
            str(score),
            f"[{g_color}]{grade}[/{g_color}]",
            str(s.get("total_findings", 0)),
            f"[{c_color}]{critical}[/{c_color}]",
            str(high),
            str(s.get("created_at", ""))[:19],
            str(s.get("id", ""))[:8],
        )

    console.print(table)


# ── report ─────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("scan_id")
@click.option("--json-out", "-j", is_flag=True,
              help="Output raw JSON")
@click.pass_context
def report(ctx, scan_id, json_out):
    """
    Fetch and display a specific scan report by ID.

    Examples:\n
      python cli.py report abc12345\n
    """
    _print_banner()
    server = ctx.obj["server"]

    if not _check_server(server):
        console.print(f"[red]❌ Backend not running at {server}[/red]")
        sys.exit(1)

    try:
        response = httpx.get(f"{server}/api/scans/{scan_id}", timeout=15)
        if response.status_code == 404:
            console.print(f"[red]Scan '{scan_id}' not found.[/red]")
            sys.exit(1)
        response.raise_for_status()
        scan = response.json()
    except Exception as e:
        console.print(f"[red]Failed to fetch report: {e}[/red]")
        sys.exit(1)

    if json_out:
        console.print_json(json.dumps(scan, indent=2))
        return

    # Header
    console.print(Panel(
        f"[bold]Repo:[/bold] {scan.get('repo', '')}\n"
        f"[bold]PR:[/bold] #{scan.get('pr_number', 'N/A')}  |  "
        f"[bold]Commit:[/bold] {str(scan.get('commit_sha', ''))[:7]}\n"
        f"[bold]Score:[/bold] {scan.get('overall_score', 'N/A')}/100  |  "
        f"[bold]Grade:[/bold] {scan.get('overall_grade', 'N/A')}\n"
        f"[bold]Date:[/bold] {str(scan.get('created_at', ''))[:19]}",
        title=f"[bold]Scan Report — {scan_id[:8]}[/bold]",
        border_style="yellow",
    ))

    # Findings from nested results
    results = scan.get("results", {})
    file_results = results.get("file_results", [])

    if file_results:
        for file_result in file_results:
            fname    = file_result.get("file", "")
            findings = file_result.get("findings", [])
            grade    = file_result.get("grade", "?")
            score    = file_result.get("score", 0)

            g_color = "green" if grade in ("A","B") else "yellow" if grade == "C" else "red"
            console.print(
                f"\n[bold cyan]{fname}[/bold cyan]  "
                f"Grade: [{g_color}]{grade}[/{g_color}]  "
                f"Score: {score}/100  Findings: {len(findings)}"
            )

            if findings:
                _print_findings_table(findings)
    else:
        # Flat findings if no file_results
        findings = results.get("findings", scan.get("findings", []))
        if findings:
            _print_findings_table(findings)

    counts = scan.get("severity_counts", {})
    if counts:
        console.print("\n[bold]Severity Breakdown:[/bold]")
        for sev in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
            count = counts.get(sev, 0)
            if count:
                color = _severity_color(sev)
                console.print(
                    f"  [{color}]{_severity_icon(sev)} {sev}[/{color}]: {count}"
                )
    console.print()


# ── risk ───────────────────────────────────────────────────────────────────────

@cli.command()
@click.argument("repo")
@click.pass_context
def risk(ctx, repo):
    """
    Show historical risk trend for a repository.

    Examples:\n
      python cli.py risk myorg/myrepo\n
    """
    _print_banner()
    server = ctx.obj["server"]

    if not _check_server(server):
        console.print(f"[red]❌ Backend not running at {server}[/red]")
        sys.exit(1)

    try:
        response = httpx.get(f"{server}/risk/repo/{repo}", timeout=15)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        console.print(f"[red]Failed to fetch risk data: {e}[/red]")
        sys.exit(1)

    score  = data.get("risk_score", 0)
    total  = data.get("total_findings", 0)
    counts = data.get("severity_counts", {})

    color = "green" if score < 30 else "yellow" if score < 60 else "red"

    console.print(Panel(
        f"[bold]Repo:[/bold] {repo}\n"
        f"[bold]Risk Score:[/bold] [{color}]{score}[/{color}]/100\n"
        f"[bold]Total Historical Findings:[/bold] {total}\n"
        f"[bold]Last Seen:[/bold] {data.get('most_recent', 'Never')[:19] if data.get('most_recent') else 'Never'}",
        title="[bold]Repo Risk Trend[/bold]",
        border_style="yellow",
    ))

    if any(counts.values()):
        table = Table(box=box.SIMPLE, show_header=False)
        table.add_column("Severity", style="bold", width=12)
        table.add_column("Count", width=8)
        table.add_column("Bar", width=30)

        for sev in ("CRITICAL", "HIGH", "MEDIUM", "LOW"):
            count = counts.get(sev, 0)
            if count:
                color  = _severity_color(sev)
                bar    = "█" * min(count, 30)
                table.add_row(
                    f"[{color}]{sev}[/{color}]",
                    str(count),
                    f"[{color}]{bar}[/{color}]",
                )
        console.print(table)

    console.print()


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    cli(obj={})