"""
Levels namespace — level configuration endpoints.

Routes:
  GET /api/levels/random-unitary      Generate (or reproduce) a random
                                      single-qubit unitary for Level 1.6.
  GET /api/levels/controlled-unitary  Generate (or reproduce) a random
                                      controlled-U for Level 2.5.
"""

from flask_restx import Namespace, Resource
from flask import request
from app.controllers.random_unitary import generate_random_unitary_response
from app.controllers.controlled_unitary import generate_controlled_unitary_response
from app.utils.response_builder import ResponseBuilder
import logging


levels_ns = Namespace("levels", description="Level configuration operations.")
logger = logging.getLogger(__name__)


@levels_ns.route("/random-unitary")
class RandomUnitary(Resource):
    def get(self):  # type: ignore
        """
        Generate (or reproduce) a random single-qubit unitary for Level 1.6.

        Query params:
            seed (int, optional): When provided, reproduces the same unitary
                                  that was generated for that seed value.
        """
        try:
            seed_param = request.args.get("seed")
            seed = int(seed_param) if seed_param is not None else None

            logger.info(f"Random unitary requested with seed={seed}")
            data = generate_random_unitary_response(seed)

            return {"message": "Random unitary generated.", **data}, 200

        except Exception as e:
            return ResponseBuilder.error(
                message="Unexpected error generating random unitary.",
                data={"error": str(e)},
            )


@levels_ns.route("/controlled-unitary")
class ControlledUnitary(Resource):
    def get(self):  # type: ignore
        """
        Generate (or reproduce) a random controlled-U for Level 2.5.

        Query params:
            seed (int, optional): When provided, reproduces the same controlled-U
                                  that was generated for that seed value.
        """
        try:
            seed_param = request.args.get("seed")
            seed = int(seed_param) if seed_param is not None else None

            logger.info(f"Controlled unitary requested with seed={seed}")
            data = generate_controlled_unitary_response(seed)

            return {"message": "Controlled unitary generated.", **data}, 200

        except Exception as e:
            return ResponseBuilder.error(
                message="Unexpected error generating controlled unitary.",
                data={"error": str(e)},
            )
