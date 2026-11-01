"""Classify customer tickets with Claude's structured JSON output."""
import argparse
import csv
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any

from anthropic import Anthropic

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / "data" / "tickets.csv"
PROMPT_PATH = ROOT / "prompts" / "classify_v3.md"
OUTPUT_FIELDS = [
    "ticket_id",
    "category",
    "sentiment",
    "urgency",
    "order_id_mentioned",
    "contains_pii",
    "input_tokens",
    "output_tokens",
    "elapsed_seconds",
]

CATEGORIES = [
    "ส่งช้า",
    "ขอคืนเงิน",
    "สินค้าชำรุด",
    "ได้รับสินค้าผิด",
    "เปลี่ยนแปลงคำสั่งซื้อ",
    "ชำระเงินและโปรโมชั่น",
    "สอบถามทั่วไป",
    "ชมเชย",
]

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": CATEGORIES},
        "sentiment": {"type": "string", "enum": ["บวก", "กลาง", "ลบ"]},
        "urgency": {"type": "string", "enum": ["ปกติ", "สูง"]},
        "order_id_mentioned": {"type": "string"},
        "contains_pii": {"type": "boolean"},
    },
    "required": [
        "category",
        "sentiment",
        "urgency",
        "order_id_mentioned",
        "contains_pii",
    ],
    "additionalProperties": False,
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("model", help="Claude model name to use")
    parser.add_argument(
        "--limit",
        type=int,
        default=5,
        help="Number of first tickets to classify (default: 5; use 0 for all)",
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT,
        help=f"Input CSV path (default: {DEFAULT_INPUT})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Output CSV path (default: out/pred_<model>.csv)",
    )
    args = parser.parse_args()
    if args.limit < 0:
        parser.error("--limit must be zero (all rows) or a positive integer")
    return args


def output_path(model: str) -> Path:
    safe_model = re.sub(r"[^A-Za-z0-9._-]+", "-", model).strip(".-")
    if not safe_model:
        raise ValueError("Model name does not contain any filename-safe characters")
    return ROOT / "out" / f"pred_{safe_model}.csv"


def classify_ticket(
    client: Anthropic, model: str, system_prompt: str, message: str
) -> tuple[dict[str, Any], int, int]:
    response = client.messages.create(
        model=model,
        max_tokens=512,
        system=system_prompt,
        messages=[{"role": "user", "content": message}],
        output_config={
            "format": {
                "type": "json_schema",
                "schema": OUTPUT_SCHEMA,
            }
        },
    )
    text_blocks = [block.text for block in response.content if block.type == "text"]
    if len(text_blocks) != 1:
        raise RuntimeError(
            f"Expected exactly one text block from Claude, received {len(text_blocks)}"
        )

    prediction = json.loads(text_blocks[0])
    return prediction, response.usage.input_tokens, response.usage.output_tokens


def main() -> int:
    args = parse_args()
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print(
            "ANTHROPIC_API_KEY is not set. Set it in your shell environment; "
            "do not put the key in this script or in chat.",
            file=sys.stderr,
        )
        return 2
    if not args.input.is_file():
        print(f"Input CSV not found: {args.input}", file=sys.stderr)
        return 2

    system_prompt = PROMPT_PATH.read_text(encoding="utf-8")
    with args.input.open(encoding="utf-8-sig", newline="") as source:
        tickets = list(csv.DictReader(source))
    if args.limit:
        tickets = tickets[: args.limit]

    destination = args.output or output_path(args.model)
    destination.parent.mkdir(parents=True, exist_ok=True)
    client = Anthropic(api_key=api_key)

    with destination.open("w", encoding="utf-8-sig", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        for index, ticket in enumerate(tickets, start=1):
            started = time.perf_counter()
            prediction, input_tokens, output_tokens = classify_ticket(
                client, args.model, system_prompt, ticket["message"]
            )
            elapsed = time.perf_counter() - started
            writer.writerow(
                {
                    "ticket_id": ticket["ticket_id"],
                    **prediction,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "elapsed_seconds": f"{elapsed:.6f}",
                }
            )
            output.flush()
            print(
                f"[{index}/{len(tickets)}] Classified ticket {ticket['ticket_id']} "
                f"in {elapsed:.2f}s"
            )

    print(f"Saved {len(tickets)} predictions to {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
