#!/usr/bin/env python3
"""Extract Future Tech mock tests from the supplied Word booklets.

The script copies question wording, numbering, options, answer keys and
explanations. It does not rewrite, reorder or fill gaps.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "content" / "portal" / "sources"
OUT = ROOT / "content" / "portal" / "catalog.json"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
QUESTION_RE = re.compile(r"^(\d+)\.\s+(.*)$")
OPTION_RE = re.compile(r"^\(([A-D])\)\s+(.*)$")
COMPACT_RE = re.compile(r"^Q(\d+)\s+([A-D])$")
ID_RE = re.compile(r"^\[(TEJAS-FT-B[12]-MT\d{2}-Q\d{3})\]$")
DIFFICULTIES = {"Easy", "Moderate", "Challenging"}

BOOKLETS = [
    {
        "bookId": "ft-book-1",
        "bookNumber": 1,
        "filename": "TEJAS Future Tech – Book 1 Mock Tests (MT01–MT05).docx",
        "paperPrefix": "TEJAS-FT-B1",
    },
    {
        "bookId": "ft-book-2",
        "bookNumber": 2,
        "filename": "TEJAS Future Tech – Book 2 Mock Tests (MT01–MT05).docx",
        "paperPrefix": "TEJAS-FT-B2",
    },
]


def paragraphs(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    lines: list[str] = []
    for paragraph in root.iter(f"{W}p"):
        text = "".join((node.text or "") for node in paragraph.iter(f"{W}t")).strip()
        if text:
            lines.append(text)
    return lines


def split_tests(lines: list[str], book_number: int) -> list[tuple[int, list[str]]]:
    header = re.compile(rf"^Book {book_number} – Mock Test (\d+)$")
    starts = [(index, int(header.match(line).group(1))) for index, line in enumerate(lines) if header.match(line)]
    tests: list[tuple[int, list[str]]] = []
    for position, (start, number) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else len(lines)
        body = lines[start:end]
        stop = next((offset for offset, line in enumerate(body) if line.startswith("*** End of Mock Test")), None)
        if stop is None:
            raise SystemExit(f"Book {book_number} mock test {number} has no end marker.")
        tests.append((number, body[: stop + 1]))
    return tests


def paper_meta(body: list[str], book_number: int, test_number: int) -> dict[str, str]:
    values: dict[str, str] = {}
    keys = {
        "Book": "book",
        "Subject": "subject",
        "Mock Test": "mockTest",
        "Paper Code": "paperCode",
        "Time Allowed": "timeAllowed",
        "Total Questions": "totalQuestions",
        "Maximum Marks": "maximumMarks",
        "Negative Marking": "negativeMarking",
    }
    index = 0
    while index < len(body) - 1:
        label = body[index]
        if label in keys and keys[label] not in values:
            values[keys[label]] = body[index + 1]
            index += 2
            continue
        index += 1
    expected_code = f"TEJAS-FT-B{book_number}-MT{test_number:02d}"
    if values.get("paperCode") != expected_code:
        raise SystemExit(f"Unexpected paper code {values.get('paperCode')!r} for book {book_number} test {test_number}.")
    return values


def parse_questions(body: list[str], book_number: int, test_number: int, flags: list[dict]) -> list[dict]:
    questions: list[dict] = []
    section = ""
    current: dict | None = None
    started = False

    def close() -> None:
        nonlocal current
        if current is None:
            return
        labels = [option["key"] for option in current["options"]]
        if labels != ["A", "B", "C", "D"]:
            flags.append({
                "severity": "review",
                "code": "option-shape",
                "book": book_number,
                "test": test_number,
                "question": current["number"],
                "detail": f"Options are {labels or 'missing'}, expected A B C D.",
            })
        if not current["prompt"].strip():
            flags.append({
                "severity": "review",
                "code": "empty-prompt",
                "book": book_number,
                "test": test_number,
                "question": current["number"],
                "detail": "Question prompt is empty.",
            })
        questions.append(current)
        current = None

    for line in body:
        if line.startswith("Section "):
            started = True
            section = line
            continue
        if not started:
            continue
        question_match = QUESTION_RE.match(line)
        if question_match and not line.startswith("Q."):
            number = int(question_match.group(1))
            if current and len(current["options"]) < 4 and number == current["number"]:
                current["prompt"] = f"{current['prompt']} {question_match.group(2)}".strip()
                continue
            close()
            current = {"number": number, "section": section, "prompt": question_match.group(2).strip(), "options": []}
            continue
        option_match = OPTION_RE.match(line)
        if option_match and current is not None:
            current["options"].append({"key": option_match.group(1), "text": option_match.group(2).strip()})
            continue
        if current is not None and not line.startswith("*** End of Mock Test") and line != "General Instructions":
            if not current["options"]:
                current["prompt"] = f"{current['prompt']} {line}".strip()
            else:
                current["options"][-1]["text"] = f"{current['options'][-1]['text']} {line}".strip()
                flags.append({
                    "severity": "note",
                    "code": "continued-line",
                    "book": book_number,
                    "test": test_number,
                    "question": current["number"],
                    "detail": "A following paragraph was joined to the previous option. Compare it with the source.",
                })
    close()

    numbers = [question["number"] for question in questions]
    if numbers != list(range(1, len(questions) + 1)):
        flags.append({
            "severity": "review",
            "code": "numbering",
            "book": book_number,
            "test": test_number,
            "detail": f"Question numbers are {numbers}.",
        })
    return questions


def parse_answer_blocks(lines: list[str], book_number: int) -> dict[int, dict]:
    part_b = next(index for index, line in enumerate(lines) if line.startswith("Part B:"))
    part_c = next(index for index, line in enumerate(lines) if line.startswith("Part C:"))
    block = lines[part_b:part_c]
    header = re.compile(rf"^Answer Key – Book {book_number}, Mock Test (\d+)$")
    starts = [(index, int(header.match(line).group(1))) for index, line in enumerate(block) if header.match(line)]
    parsed: dict[int, dict] = {}
    for position, (start, number) in enumerate(starts):
        end = starts[position + 1][0] if position + 1 < len(starts) else len(block)
        chunk = block[start + 1:end]
        compact: dict[int, str] = {}
        cursor = 0
        while cursor < len(chunk) and COMPACT_RE.match(chunk[cursor]):
            match = COMPACT_RE.match(chunk[cursor])
            assert match is not None
            compact[int(match.group(1))] = match.group(2)
            cursor += 1
        while cursor < len(chunk) and not chunk[cursor].isdigit():
            cursor += 1
        rows = []
        while cursor < len(chunk):
            if not chunk[cursor].isdigit():
                break
            number_line = int(chunk[cursor])
            answer = chunk[cursor + 1] if cursor + 1 < len(chunk) else ""
            chapter = chunk[cursor + 2] if cursor + 2 < len(chunk) else ""
            difficulty = chunk[cursor + 3] if cursor + 3 < len(chunk) else ""
            explanation = chunk[cursor + 4] if cursor + 4 < len(chunk) else ""
            question_id = chunk[cursor + 5] if cursor + 5 < len(chunk) else ""
            rows.append({
                "number": number_line,
                "answer": answer,
                "chapter": chapter,
                "difficulty": difficulty,
                "explanation": explanation,
                "questionId": question_id,
            })
            cursor += 6
        parsed[number] = {"compact": compact, "rows": rows, "tail": chunk[cursor:]}
    return parsed


def attach_answers(questions: list[dict], answers: dict, book_number: int, test_number: int, flags: list[dict]) -> None:
    compact: dict[int, str] = answers["compact"]
    rows = {row["number"]: row for row in answers["rows"]}
    if answers["tail"]:
        flags.append({
            "severity": "review",
            "code": "answer-tail",
            "book": book_number,
            "test": test_number,
            "detail": "Unparsed lines remain in the answer key: " + " | ".join(answers["tail"][:8]),
        })
    expected_prefix = f"TEJAS-FT-B{book_number}-MT{test_number:02d}-Q"
    for question in questions:
        number = question["number"]
        row = rows.get(number)
        compact_answer = compact.get(number)
        if row is None or compact_answer is None:
            flags.append({
                "severity": "review",
                "code": "missing-answer",
                "book": book_number,
                "test": test_number,
                "question": number,
                "detail": "The compact key or the explanation row is missing.",
            })
            question["correct"] = None
            question["explanation"] = None
            question["answerKeyAvailable"] = False
            question["explanationAvailable"] = False
            continue
        if row["answer"] not in {"A", "B", "C", "D"} or compact_answer not in {"A", "B", "C", "D"}:
            flags.append({
                "severity": "review",
                "code": "invalid-answer",
                "book": book_number,
                "test": test_number,
                "question": number,
                "detail": f"Compact {compact_answer!r}, explanation row {row['answer']!r}.",
            })
        if row["answer"] != compact_answer:
            flags.append({
                "severity": "review",
                "code": "conflicting-answer-key",
                "book": book_number,
                "test": test_number,
                "question": number,
                "detail": f"Compact key says {compact_answer}; explanation row says {row['answer']}.",
            })
        if row["difficulty"] not in DIFFICULTIES:
            flags.append({
                "severity": "review",
                "code": "difficulty-shape",
                "book": book_number,
                "test": test_number,
                "question": number,
                "detail": f"Difficulty cell is {row['difficulty']!r}.",
            })
        id_match = ID_RE.match(row["questionId"])
        expected_id = f"{expected_prefix}{number:03d}"
        if not id_match or id_match.group(1) != expected_id:
            flags.append({
                "severity": "review",
                "code": "question-id",
                "book": book_number,
                "test": test_number,
                "question": number,
                "detail": f"Question id cell is {row['questionId']!r}; expected [{expected_id}].",
            })
        if not row["explanation"].strip():
            flags.append({
                "severity": "review",
                "code": "missing-explanation",
                "book": book_number,
                "test": test_number,
                "question": number,
                "detail": "Explanation cell is empty.",
            })
        question["correct"] = compact_answer if compact_answer == row["answer"] else None
        question["correctCompact"] = compact_answer
        question["correctExplanationRow"] = row["answer"]
        question["chapter"] = row["chapter"]
        question["difficulty"] = row["difficulty"]
        question["explanation"] = row["explanation"]
        question["sourceId"] = id_match.group(1) if id_match else row["questionId"]
        question["answerKeyAvailable"] = compact_answer in {"A", "B", "C", "D"} and compact_answer == row["answer"]
        question["explanationAvailable"] = bool(row["explanation"].strip()) and row["difficulty"] in DIFFICULTIES


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def build() -> dict:
    flags: list[dict] = [
        {
            "severity": "review",
            "code": "class-mapping-conflict",
            "detail": (
                "Book 1 cover says 'Book-1 is for both groups' and 'For Classes 6-8 & 9-10'. "
                "The same PDF's model-test footer says 'Group-1 (Classes 6-8)'. "
                "Book 2 cover says 'For Classes 9-10 Only' and 'Book-2 is for Classes 9-10 only', and its model-test footer says 'Group-2 (Classes 9-10)'. "
                "The launch assignment gives Book 1 to Classes 6–8 and Book 2 to Classes 9–10. "
                "Classes 9–10 are not given Book 1 until the organisation resolves the Book 1 cover. "
                "Both PDF covers are titled Vidya Bharati Uttar Kshetra Tech Olympiad 2026 and do not print the word TEJAS. "
                "The mock-test booklets are titled TEJAS Future Tech Olympiad 2026–27 and name the same Book 1 and Book 2 topics."
            ),
        },
        {
            "severity": "note",
            "code": "pdf-text-layer",
            "detail": (
                "Both e-book PDFs have a duplicated, overlapping text layer. Practice questions and the model test paper inside each PDF were not copied into the mock-test bank. "
                "The five mock tests for each book come only from the supplied Word booklets. Students read the original PDF."
            ),
        },
        {
            "severity": "note",
            "code": "english-mathematics-absent",
            "detail": "No English or Mathematics e-book or mock-test file was supplied. No book structure was invented for those streams.",
        },
    ]
    books = [
        {
            "id": "ft-book-1",
            "streamId": "technology",
            "streamName": "TEJAS Future Tech",
            "bookNumber": 1,
            "title": "Understanding IoT and IoT with Arduino",
            "coverTitle": "IoT using Arduino",
            "sourceFilename": "VB_IOT_GUIDE_V06_Book-1-compressed (1).pdf",
            "sourceSha256": sha256(SOURCE_DIR / "VB_IOT_GUIDE_V06_Book-1-compressed (1).pdf"),
            "pageCount": 58,
            "assignedClasses": [6, 7, 8],
            "coverClassStatement": "Cover: For Classes 6-8 & 9-10. About the series: Book-1 is for both groups. Inner model-test footer: Group-1 (Classes 6-8).",
            "mappingStatus": "conflict_awaiting_approval",
            "publicationStatus": "awaiting_approval",
            "feeInr": 49,
            "includedMockTests": 5,
            "mockTestFeeInr": 0,
        },
        {
            "id": "ft-book-2",
            "streamId": "technology",
            "streamName": "TEJAS Future Tech",
            "bookNumber": 2,
            "title": "IoT with ESP32 and IoT with Raspberry Pi",
            "coverTitle": "IoT using ESP32 & Raspberry Pi",
            "sourceFilename": "VB_IOT_GUIDE_V06_Book-2.pdf",
            "sourceSha256": sha256(SOURCE_DIR / "VB_IOT_GUIDE_V06_Book-2.pdf"),
            "pageCount": 67,
            "assignedClasses": [9, 10],
            "coverClassStatement": "Cover: For Classes 9-10 Only. About the series: Book-2 is for Classes 9-10 only. Inner model-test footer: Group-2 (Classes 9-10).",
            "mappingStatus": "cover_and_launch_agree",
            "publicationStatus": "awaiting_approval",
            "feeInr": 49,
            "includedMockTests": 5,
            "mockTestFeeInr": 0,
        },
    ]
    tests = []
    for booklet in BOOKLETS:
        path = SOURCE_DIR / booklet["filename"]
        lines = paragraphs(path)
        answer_blocks = parse_answer_blocks(lines, booklet["bookNumber"])
        for test_number, body in split_tests(lines, booklet["bookNumber"]):
            meta = paper_meta(body, booklet["bookNumber"], test_number)
            questions = parse_questions(body, booklet["bookNumber"], test_number, flags)
            attach_answers(questions, answer_blocks[test_number], booklet["bookNumber"], test_number, flags)
            stated = int(meta["totalQuestions"])
            if stated != len(questions):
                flags.append({
                    "severity": "review",
                    "code": "stated-count",
                    "book": booklet["bookNumber"],
                    "test": test_number,
                    "detail": f"Paper says {stated} questions; extraction found {len(questions)}.",
                })
            answer_ready = all(question.get("answerKeyAvailable") for question in questions) and len(questions) > 0
            explanation_ready = all(question.get("explanationAvailable") for question in questions) and len(questions) > 0
            tests.append({
                "id": f"ft-b{booklet['bookNumber']}-mt{test_number:02d}",
                "bookId": booklet["bookId"],
                "streamId": "technology",
                "bookNumber": booklet["bookNumber"],
                "number": test_number,
                "title": f"Mock Test {test_number}",
                "paperCode": meta["paperCode"],
                "subject": meta.get("subject", ""),
                "timeAllowed": meta.get("timeAllowed", ""),
                "timeMinutes": 30,
                "maximumMarks": int(meta["maximumMarks"]) if meta.get("maximumMarks", "").isdigit() else None,
                "negativeMarking": meta.get("negativeMarking", ""),
                "sourceFilename": booklet["filename"],
                "sourceSha256": sha256(path),
                "questionCount": len(questions),
                "answerKeyAvailable": answer_ready,
                "explanationAvailable": explanation_ready,
                "uploadStatus": "extracted",
                "reviewStatus": "checked_awaiting_organisational_approval" if answer_ready and explanation_ready else "needs_review",
                "publicationStatus": "awaiting_approval",
                "sourceCheck": "Question prompts and options match the Word paragraphs. The compact answer key matches the explanation row for every question." if answer_ready and explanation_ready else "Source check incomplete.",
                "assignedClasses": [6, 7, 8] if booklet["bookNumber"] == 1 else [9, 10],
                "questions": questions,
            })
        if sorted(answer_blocks) != [1, 2, 3, 4, 5]:
            flags.append({
                "severity": "review",
                "code": "answer-booklet-count",
                "book": booklet["bookNumber"],
                "detail": f"Answer-key sections found for tests {sorted(answer_blocks)}.",
            })
    catalog = {
        "streamId": "technology",
        "streamName": "TEJAS Future Tech",
        "feeInr": 49,
        "feeScope": "One applicable e-book and its five mock tests. Mock tests are not charged separately. English and Mathematics fees are not approved.",
        "publicationStatus": "awaiting_approval",
        "books": books,
        "tests": tests,
        "flags": flags,
    }
    return catalog


def verify_saved(catalog: dict) -> None:
    """Confirm the saved catalog still matches the Word paragraphs and answer rows."""
    for booklet in BOOKLETS:
        lines = paragraphs(SOURCE_DIR / booklet["filename"])
        line_set = set(lines)
        tests = [item for item in catalog["tests"] if item["bookNumber"] == booklet["bookNumber"]]
        if [item["number"] for item in tests] != [1, 2, 3, 4, 5]:
            raise SystemExit(f"Book {booklet['bookNumber']} does not contain tests 1–5 in order.")
        for test in tests:
            if [question["number"] for question in test["questions"]] != list(range(1, 26)):
                raise SystemExit(f"{test['id']} question numbers are not 1–25 in order.")
            seen = set()
            for question in test["questions"]:
                if question["sourceId"] in seen:
                    raise SystemExit(f"Duplicate question id {question['sourceId']}.")
                seen.add(question["sourceId"])
                prompt_lines = {f"{question['number']}.  {question['prompt']}", f"{question['number']}. {question['prompt']}"}
                if not prompt_lines & line_set:
                    raise SystemExit(f"{test['id']} Q{question['number']} prompt is not a source paragraph.")
                for option in question["options"]:
                    matched = any(line.startswith(f"({option['key']})") and line.split(")", 1)[1].strip() == option["text"] for line in lines)
                    if not matched:
                        raise SystemExit(f"{test['id']} Q{question['number']} option {option['key']} is not a source paragraph.")
                if question["correct"] != question["correctCompact"] or question["correctCompact"] != question["correctExplanationRow"]:
                    raise SystemExit(f"{test['id']} Q{question['number']} answer key does not match its explanation row.")
                if question["explanation"] not in line_set:
                    raise SystemExit(f"{test['id']} Q{question['number']} explanation is not a source paragraph.")


def main() -> None:
    catalog = build()
    if "--verify" in sys.argv:
        verify_saved(json.loads(OUT.read_text(encoding="utf-8")))
        verify_saved(catalog)
        print("verified 10 tests, 250 questions, no wording or answer-key mismatches")
        return
    payload = json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"
    if "--stdout" in sys.argv:
        sys.stdout.write(payload)
        return
    OUT.write_text(payload, encoding="utf-8")
    review = [flag for flag in catalog["flags"] if flag["severity"] == "review"]
    print(f"books {len(catalog['books'])} tests {len(catalog['tests'])} flags {len(catalog['flags'])} review {len(review)}")
    for test in catalog["tests"]:
        print(
            f"B{test['bookNumber']} MT{test['number']:02d} questions={test['questionCount']} "
            f"answers={test['answerKeyAvailable']} explanations={test['explanationAvailable']} {test['reviewStatus']}"
        )
    for flag in catalog["flags"]:
        if flag["severity"] == "review":
            print("REVIEW", flag["code"], flag.get("detail", "")[:180])


if __name__ == "__main__":
    main()
