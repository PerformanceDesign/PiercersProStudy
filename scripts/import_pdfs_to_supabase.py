import json
import os
import re
import sys
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

import pdfplumber

DEFAULT_FOLDERS = [
    Path(r"D:\Paul Subtirel\Body Piercing\curs"),
    Path(r"D:\Paul Subtirel\Body Piercing\wisdom-learning curs"),
    Path(r"D:\Paul Subtirel\Body Piercing\learnin materials"),
]


def required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"Missing environment variable: {name}")
    return value.rstrip("/")


SUPABASE_URL = required_env("VITE_SUPABASE_URL")
SERVICE_ROLE_KEY = required_env("SUPABASE_SERVICE_ROLE_KEY")


def request(method: str, path: str, body=None, prefer: str | None = None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    headers = {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer

    req = Request(f"{SUPABASE_URL}{path}", data=data, headers=headers, method=method)
    try:
        with urlopen(req) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except HTTPError as error:
        details = error.read().decode("utf-8")
        raise RuntimeError(f"{method} {path} failed: {error.code} {details}") from error


def title_from_filename(path: Path) -> str:
    stem = path.stem.replace("+", " ")
    stem = re.sub(r"-min$", "", stem, flags=re.I)
    return re.sub(r"\s+", " ", stem).strip()


def topic_tags_for(title: str) -> list[str]:
    lower = title.lower()
    rules = [
        ("skin", "Anatomy & Physiology"),
        ("tissue", "Anatomy & Physiology"),
        ("anatomy", "Anatomy & Physiology"),
        ("vascular", "Anatomy & Physiology"),
        ("nervous", "Anatomy & Physiology"),
        ("lymphatic", "Aftercare & Healing"),
        ("aftercare", "Aftercare & Healing"),
        ("immune", "Aftercare & Healing"),
        ("healing", "Aftercare & Healing"),
        ("allergic", "Complications"),
        ("sensitivities", "Complications"),
        ("complications", "Complications"),
        ("troubleshooting", "Complications"),
        ("first-aid", "Health & Safety"),
        ("first aid", "Health & Safety"),
        ("tools", "Tools & Equipment"),
        ("equipment", "Tools & Equipment"),
        ("genital", "Genital Piercing"),
        ("organisations", "Regulations"),
        ("governmental", "Regulations"),
        ("case studies", "Case Studies"),
    ]
    tags: list[str] = []
    for needle, tag in rules:
        if needle in lower and tag not in tags:
            tags.append(tag)
    return tags or ["General Piercing Education"]


def normalize_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_pages(path: Path) -> list[dict]:
    pages: list[dict] = []
    with pdfplumber.open(path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            content = normalize_text(page.extract_text() or "")
            if content:
                pages.append(
                    {
                        "page_number": page_number,
                        "chunk_index": page_number,
                        "content": content,
                    }
                )
    return pages


def local_storage_path(path: Path) -> str:
    return "local://" + str(path).replace("\\", "/")


def import_pdf(path: Path):
    title = title_from_filename(path)
    storage_path = local_storage_path(path)
    tags = topic_tags_for(title)
    pages = extract_pages(path)

    encoded_storage_path = quote(storage_path, safe="")
    request("DELETE", f"/rest/v1/documents?storage_path=eq.{encoded_storage_path}")

    document = request(
        "POST",
        "/rest/v1/documents",
        {
            "filename": path.name,
            "title": title,
            "description": f"Imported source PDF from {path.parent.name}.",
            "storage_path": storage_path,
            "topic_tags": tags,
            "status": "published",
        },
        prefer="return=representation",
    )[0]

    chunks = [
        {
            "document_id": document["id"],
            "topic_title": title,
            "heading": f"{title} - page {page['page_number']}",
            "page_number": page["page_number"],
            "chunk_index": page["chunk_index"],
            "content": page["content"],
        }
        for page in pages
    ]

    for start in range(0, len(chunks), 50):
        request("POST", "/rest/v1/document_chunks", chunks[start : start + 50])

    print(f"Imported {path.name}: {len(pages)} pages, tags={', '.join(tags)}")


def main():
    folders = [Path(arg) for arg in sys.argv[1:]] if len(sys.argv) > 1 else DEFAULT_FOLDERS
    pdfs = sorted(
        [path for folder in folders if folder.exists() for path in folder.rglob("*.pdf")],
        key=lambda item: str(item).lower(),
    )

    if not pdfs:
        print("No PDF files found.")
        return

    for path in pdfs:
        import_pdf(path)

    print(f"Done. Imported {len(pdfs)} PDF files.")


if __name__ == "__main__":
    main()
