from flask_restx import Api
from app.api.simulate import simulate_ns
from app.api.levels import levels_ns
from app.api.debug import debug_ns
from app.api.feedback import feedback_ns
from app.api.metrics import metrics_ns

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
# Temporary: ZXZ extraction formula diagnostic — remove after verification
api.add_namespace(debug_ns, path="/debug")
# Feedback page solution submissions → GitHub Issues
api.add_namespace(feedback_ns, path="/feedback")
# Frontend instrumentation events (level start/complete, submission attempt, skip)
api.add_namespace(metrics_ns, path="/metrics")
