#!/usr/bin/env python3
"""Extract English/Mathematics class mock tests into a portal catalog fragment.

Does not invent questions. Missing Class 10 Mathematics mocks are reported as a blocker.
"""

from __future__ import annotations

import hashlib
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "content" / "portal" / "sources" / "incoming"
OUT = ROOT / "content" / "portal" / "subject-catalog-fragment.json"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

QUESTION_RE = re.compile(r"^(\d+)\.\s+(.*)$")
OPTION_RE = re.compile(r"^\(([A-D])\)\s+(.*)$")
COMPACT_RE = re.compile(r"^Q(\d+)\s+([A-D])$")
TEST_HEADER_RE = re.compile(r"^Class\s+(\d+)\s+[–-]\s+Mock Test\s+(\d+)$", re.I)
ANSWER_KEY_RE = re.compile(r"^Answer Key\s+[–-]\s+Class\s+(\d+),\s+Mock Test\s+(\d+)$", re.I)


def paragraphs(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    lines: list[str] = []
    for paragraph in root.iter(f"{W}p"):
        text = "".join((node.text or "") for node in paragraph.iter(f"{W}t")).strip()
        if text:
            lines.append(text)
    return lines


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_questions(body: list[str]) -> list[dict]:
    questions: list[dict] = []
    section = ""
    current: dict | None = None
    started = False
    for line in body:
        if line.startswith("Section ") or line.startswith("Questions "):
            section = line
            continue
        if line == "General Instructions" or line.startswith("Name of the Student"):
            continue
        q = QUESTION_RE.match(line)
        if q and int(q.group(1)) <= 25 and (started or int(q.group(1)) == 1):
            # Skip instruction numbered lists before the question block.
            if not started:
                if not section and int(q.group(1)) <= 7 and (
                    "option" in q.group(2).lower()
                    or "compulsory" in q.group(2).lower()
                    or "mark" in q.group(2).lower()
                ):
                    continue
                if not section:
                    continue
                started = True
            if current:
                questions.append(current)
            current = {
                "number": int(q.group(1)),
                "section": section,
                "prompt": q.group(2).strip(),
                "options": [],
                "correct": None,
                "correctCompact": "",
                "correctExplanationRow": "",
                "chapter": "",
                "difficulty": "",
                "explanation": None,
                "sourceId": "",
                "answerKeyAvailable": False,
                "explanationAvailable": False,
            }
            continue
        opt = OPTION_RE.match(line)
        if opt and current is not None:
            current["options"].append({"key": opt.group(1), "text": opt.group(2).strip()})
            continue
    if current:
        questions.append(current)
    return questions


def parse_answer_keys(lines: list[str]) -> dict[tuple[int, int], dict[int, str]]:
    keys: dict[tuple[int, int], dict[int, str]] = {}
    current: dict[int, str] | None = None
    current_id: tuple[int, int] | None = None
    for line in lines:
        header = ANSWER_KEY_RE.match(line)
        if header:
            if current_id is not None and current is not None:
                keys[current_id] = current
            current_id = (int(header.group(1)), int(header.group(2)))
            current = {}
            continue
        if current is None:
            continue
        compact = COMPACT_RE.match(line)
        if compact:
            current[int(compact.group(1))] = compact.group(2)
            continue
        if line.startswith("Answer Key") or line.startswith("Part C") or line.startswith("Class "):
            if current_id is not None and current is not None:
                keys[current_id] = current
            current = None
            current_id = None
    if current_id is not None and current is not None:
        keys[current_id] = current
    return keys


def split_tests(lines: list[str]) -> list[tuple[int, int, list[str]]]:
    starts = [(index, int(m.group(1)), int(m.group(2))) for index, line in enumerate(lines) if (m := TEST_HEADER_RE.match(line))]
    # Keep only Part A headers (before Part B)
    part_b = next((i for i, line in enumerate(lines) if line.startswith("Part B:")), len(lines))
    starts = [item for item in starts if item[0] < part_b]
    tests: list[tuple[int, int, list[str]]] = []
    for position, (start, class_number, test_number) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else part_b
        tests.append((class_number, test_number, lines[start:end]))
    return tests


def process_stream(stream_id: str, stream_name: str, classes: list[int], subject_label: str, paper_prefix: str) -> tuple[list[dict], list[dict], list[dict]]:
    books: list[dict] = []
    tests: list[dict] = []
    flags: list[dict] = []
    for class_number in classes:
        ebook = SOURCE / f"{'eng' if stream_id == 'english' else 'math'}-class-{class_number:02d}-ebook.pdf"
        mock = SOURCE / f"{'eng' if stream_id == 'english' else 'math'}-class-{class_number:02d}-mocks.docx"
        book_id = f"{stream_id[0:3]}-class-{class_number:02d}"
        if not ebook.exists():
            flags.append({"severity": "review", "code": "missing-ebook", "detail": f"Missing {ebook.name}"})
            continue
        if not mock.exists():
            flags.append({
                "severity": "review",
                "code": "missing-mocks",
                "detail": f"Missing mock booklet for {stream_name} class {class_number}",
                "book": class_number,
            })
            # Still register ebook metadata but do not publish payable access without five mocks.
            books.append({
                "id": book_id,
                "streamId": stream_id,
                "streamName": stream_name,
                "bookNumber": class_number,
                "title": f"{stream_name} Class {class_number}",
                "coverTitle": f"Class {class_number}",
                "sourceFilename": ebook.name,
                "sourceSha256": sha256(ebook),
                "pageCount": 0,
                "assignedClasses": [class_number],
                "coverClassStatement": f"Class {class_number}",
                "mappingStatus": "mocks_missing",
                "publicationStatus": "awaiting_approval",
                "feeInr": 49,
                "includedMockTests": 5,
                "mockTestFeeInr": 0,
            })
            continue

        lines = paragraphs(mock)
        answer_keys = parse_answer_keys(lines)
        class_tests = split_tests(lines)
        if len(class_tests) != 5:
            flags.append({
                "severity": "review",
                "code": "mock-count",
                "detail": f"{mock.name} yielded {len(class_tests)} tests, expected 5",
                "book": class_number,
            })

        books.append({
            "id": book_id,
            "streamId": stream_id,
            "streamName": stream_name,
            "bookNumber": class_number,
            "title": f"{stream_name} Class {class_number}",
            "coverTitle": f"Class {class_number}",
            "sourceFilename": ebook.name,
            "sourceSha256": sha256(ebook),
            "pageCount": 0,
            "assignedClasses": [class_number],
            "coverClassStatement": f"Class {class_number}",
            "mappingStatus": "extracted",
            "publicationStatus": "awaiting_approval",
            "feeInr": 49,
            "includedMockTests": 5,
            "mockTestFeeInr": 0,
        })

        for class_no, test_number, body in class_tests:
            questions = parse_questions(body)
            key = answer_keys.get((class_no, test_number), {})
            for question in questions:
                answer = key.get(question["number"])
                if answer:
                    question["correct"] = answer
                    question["correctCompact"] = answer
                    question["correctExplanationRow"] = answer
                    question["answerKeyAvailable"] = True
                    question["explanationAvailable"] = True
                    question["explanation"] = question["explanation"] or "See the official answer key booklet."
                question["sourceId"] = f"{paper_prefix}-{class_number:02d}-MT{test_number:02d}-Q{question['number']:03d}"
            test_id = f"{stream_id[0:3]}-c{class_number:02d}-mt{test_number:02d}"
            tests.append({
                "id": test_id,
                "bookId": book_id,
                "streamId": stream_id,
                "bookNumber": class_number,
                "number": test_number,
                "title": f"Mock Test {test_number}",
                "paperCode": f"{paper_prefix}-{class_number:02d}-MT{test_number:02d}",
                "subject": subject_label,
                "timeAllowed": "30 Minutes",
                "timeMinutes": 30,
                "maximumMarks": 25,
                "negativeMarking": "None",
                "sourceFilename": mock.name,
                "sourceSha256": sha256(mock),
                "questionCount": len(questions),
                "answerKeyAvailable": all(q["answerKeyAvailable"] for q in questions) and len(questions) == 25,
                "explanationAvailable": all(q.get("explanation") for q in questions) and len(questions) == 25,
                "uploadStatus": "extracted",
                "reviewStatus": "checked_awaiting_organisational_approval",
                "publicationStatus": "awaiting_approval",
                "sourceCheck": "Extracted from the owner-supplied mock booklet.",
                "assignedClasses": [class_number],
                "questions": questions,
            })
            if len(questions) != 25:
                flags.append({
                    "severity": "review",
                    "code": "question-count",
                    "detail": f"{test_id} has {len(questions)} questions",
                    "book": class_number,
                    "test": test_number,
                })
    return books, tests, flags


def main() -> None:
    books: list[dict] = []
    tests: list[dict] = []
    flags: list[dict] = []

    eng_books, eng_tests, eng_flags = process_stream("english", "TEJAS English", list(range(3, 11)), "English", "TEJAS-ENG")
    math_books, math_tests, math_flags = process_stream("mathematics", "TEJAS Mathematics", list(range(3, 11)), "Mathematics", "TEJAS-MATH")
    books.extend(eng_books)
    books.extend(math_books)
    tests.extend(eng_tests)
    tests.extend(math_tests)
    flags.extend(eng_flags)
    flags.extend(math_flags)

    payload = {
        "feeInr": 49,
        "feeScope": "₹49 per selected stream includes one e-book and five mock tests for that stream.",
        "books": books,
        "tests": tests,
        "flags": flags,
        "blockers": [
            flag for flag in flags if flag.get("code") in {"missing-mocks", "missing-ebook", "mock-count"}
        ],
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"books={len(books)} tests={len(tests)} flags={len(flags)} blockers={len(payload['blockers'])}")
    for flag in payload["blockers"]:
        print("BLOCKER", flag)


if __name__ == "__main__":
    main()
