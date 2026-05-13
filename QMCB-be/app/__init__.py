import logging
from flask import Flask
from flask_cors import CORS
from app.settings import Config
from app.api import api

logger = logging.getLogger(__name__)


def create_app(config=None) -> Flask:
    if config is None:
        config = Config()

    app = Flask(__name__)
    app.config.from_object(config)

    app.url_map.strict_slashes = False

    api.init_app(app)

    CORS(
        app,
        origins=config.ALLOWED_ORIGINS,
        supports_credentials=False,
        methods=["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
    )

    logger.info("Quantum Circuit Builder Flask app created successfully.")
    return app