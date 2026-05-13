from flask_restx import Api
from app.api.simulate import simulate_ns
from app.api.levels import levels_ns

api = Api(
    title="Quantum Circuit Builder API",
    version="1.0",
    prefix="/api",
    doc="/api/docs",
    description="API for simulating quantum circuits",
)

# Add the simulate namespace
api.add_namespace(simulate_ns, path="/simulate")
# Add the levels namespace (level config, random unitary generation)
api.add_namespace(levels_ns, path="/levels")
