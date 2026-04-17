import logging

from flask_cors import CORS

from app import create_app
from app.api import api
from app.settings import Config

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

config = Config()
app = create_app(config)

# Accept both /simulate and /simulate/
app.url_map.strict_slashes = False

# RESTX first, then CORS — registering CORS before namespaces can miss OPTIONS
# on /api/simulate in some Flask + flask-restx combinations.
api.init_app(app)

CORS(
    app,
    origins=config.ALLOWED_ORIGINS,
    supports_credentials=False,
    methods=["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

if __name__ == "__main__":
    app.run(debug=True)
