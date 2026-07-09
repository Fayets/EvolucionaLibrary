from urllib.parse import urlparse

FALLBACK = ("other", "/icons/link.svg")


def detect_resource_type(url: str) -> tuple[str, str]:
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower().removeprefix("www.")
    except Exception:
        return FALLBACK

    if "loom.com" in hostname:
        return ("loom", "/icons/loom.png")
    if "docs.google.com" in hostname:
        if "/spreadsheets/" in url:
            return ("google_sheet", "/icons/gsheets.png")
        if "/presentation/" in url:
            return ("google_doc", "/icons/gslides.png")
        return ("google_doc", "/icons/gdocs.png")
    if "miro.com" in hostname:
        return ("miro", "/icons/miro.png")
    if "notion.so" in hostname or "notion.site" in hostname:
        return ("notion", "/icons/notion.png")
    if "fathom.video" in hostname:
        return ("fathom", "/icons/fathom.png")

    return FALLBACK
