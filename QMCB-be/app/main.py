from app.api import api
from app import create_app
from app.settings import Config
from flask_cors import CORS
import logging

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

config = Config()
app = create_app(config)

# Accept both /simulate and /simulate/
app.url_map.strict_slashes = False

# Initialize RESTX after CORS wraps the app
api.init_app(app)

if __name__ == "__main__":
    app.run(debug=True)
