from os import getenv
from dotenv import load_dotenv

load_dotenv()


def _parse_cors_origins() -> str | list[str]:
    """ALLOWED_ORIGINS: '*', empty/unset → wildcard; else comma-separated list."""
    raw = getenv("ALLOWED_ORIGINS", "*").strip()
    if not raw or raw == "*":
        return "*"
    origins = [o.strip() for o in raw.split(",") if o.strip()]
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
