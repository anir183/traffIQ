import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

from config import ALLOWED_LENGTHS, INDIAN_STATE_CODES

DIGIT_FIX = {
    "O": "0", "Q": "0", "D": "0",
    "I": "1", "L": "1", "Z": "2", "S": "5",
    "G": "6", "T": "7", "B": "8"
}

LETTER_FIX = {
    "0": "O", "1": "I", "2": "Z", "3": "E", "4": "A",
    "5": "S", "6": "G", "7": "T", "8": "B", "9": "P"
}


def clean(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(s).upper())


def expected_types(n: int):
    # State letters + 2 digits + optional 0/1/2 letters + final 4 digits.
    if n == 8:
        return "LLDDDDDD"
    if n == 9:
        return "LLDDLDDDD"
    if n == 10:
        return "LLDDLLDDDD"
    return None


def apply_context_rules(text: str) -> str:
    text = clean(text)
    t = expected_types(len(text))
    if t is None:
        return text
    out = []
    for ch, kind in zip(text, t):
        if kind == "D":
            out.append(ch if ch.isdigit() else DIGIT_FIX.get(ch, ch))
        else:
            out.append(ch if ch.isalpha() else LETTER_FIX.get(ch, ch))
    return "".join(out)


def state_ok(text: str) -> bool:
    text = clean(text)
    return len(text) >= 2 and text[:2] in INDIAN_STATE_CODES


def grammar_ok(text: str) -> bool:
    text = apply_context_rules(text)
    if len(text) not in ALLOWED_LENGTHS:
        return False
    typ = expected_types(len(text))
    if any((kind == "L" and not ch.isalpha()) or (kind == "D" and not ch.isdigit())
           for ch, kind in zip(text, typ)):
        return False
    return state_ok(text)


def score_text(text: str, confidence: float = 0.0) -> Tuple[str, float, dict]:
    raw = clean(text)
    fixed = apply_context_rules(raw)
    score = float(confidence)
    info = {
        "length_ok": len(fixed) in ALLOWED_LENGTHS,
        "state_ok": state_ok(fixed),
        "grammar_ok": grammar_ok(fixed),
    }
    if info["length_ok"]:
        score += 3.0
    if info["state_ok"]:
        score += 4.0
    if info["grammar_ok"]:
        score += 8.0
    return fixed, score, info


def conservative_fix(text: str) -> str:
    """Never insert a character; only context-correct OCR confusions."""
    return apply_context_rules(text)
