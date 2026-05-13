import logging

from app import create_app
from app.api import api
from app.settings import Config

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

config = Config()
app = create_app(config)

app.url_map.strict_slashes = False

api.init_app(app)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)