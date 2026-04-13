import logging
from flask import Flask
from flask_cors import CORS
from app.settings import Config


logger = logging.getLogger(__name__)


def create_app(config: Config) -> Flask:
    """
    Create and configure the Flask application.
    """

    app = Flask(__name__)
    app.config.from_object(config)

    # CORS for API routes only; origins from config (default "*" in settings)
    CORS(
        app,
        resources={
            r"/api/*": {"origins": config.ALLOWED_ORIGINS},
        },
        supports_credentials=False,
        methods=["GET", "POST", "OPTIONS", "PUT", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
    )

    logger.info("Quantum Circuit Builder Flask app created successfully.")
    return app
