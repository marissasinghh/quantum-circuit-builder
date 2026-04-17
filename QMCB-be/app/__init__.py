import logging
from flask import Flask
from app.settings import Config


logger = logging.getLogger(__name__)


def create_app(config: Config) -> Flask:
    """
    Create and configure the Flask application.

    CORS is applied in ``app.main`` *after* ``api.init_app`` so OPTIONS preflight
    on RESTX routes always gets ``Access-Control-Allow-*`` headers.
    """

    app = Flask(__name__)
    app.config.from_object(config)

    logger.info("Quantum Circuit Builder Flask app created successfully.")
    return app
