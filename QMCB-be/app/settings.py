import re
from os import getenv
from dotenv import load_dotenv

load_dotenv()


def _parse_cors_origins() -> str | list:
    """
    ALLOWED_ORIGINS: '*', empty/unset → wildcard; else comma-separated list.
    Entries prefixed with 'r:' are compiled as regex patterns, which flask-cors
    accepts natively. Use this for Vercel preview URLs that change each deploy.
    Example: r:https://my-app-[^.]+\\.vercel\\.app
    """
    raw = getenv("ALLOWED_ORIGINS", "*").strip()
    if not raw or raw == "*":
        return "*"
    origins = []
    for entry in raw.split(","):
        entry = entry.strip()
        if not entry:
            continue
        if entry.startswith("r:"):
            origins.append(re.compile(entry[2:]))
        else:
            origins.append(entry)
    return origins if origins else "*"


class Config:
    """
    Base configuration for Quantum Circuit Builder (QMC) Flask app.
    """

    ALLOWED_ORIGINS: str | list[str] = _parse_cors_origins()

    # API versioning
    API_VERSION = getenv("API_VERSION", "v1")

    # Flask secret key (required for sessions/security)
    SECRET_KEY = getenv("SECRET_KEY", "dev_secret_key")

    # MongoDB URI – not currently used
    MONGO_URI = getenv("MONGO_URI", "")

    # Optional: Validate target circuits by computing them
    # Set to False in development for faster iteration
    VALIDATE_TARGET_CIRCUITS = (
        getenv("VALIDATE_TARGET_CIRCUITS", "false").lower() == "true"
    )
