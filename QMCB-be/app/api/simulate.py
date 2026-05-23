from flask_restx import Namespace, Resource
from flask import request
from app.settings import Config
from app.controllers.simulate import simulate_unitaries
from app.utils.response_builder import ResponseBuilder
from app.utils.unitary_payload import parse_simulate_request_json
from app.dto.response_dto import ResponseDTO
import logging


simulate_ns = Namespace(
    "simulate", description="Quantum circuit simulation related operations."
)
logger = logging.getLogger(__name__)


@simulate_ns.route("")
class Simulate(Resource):
    def post(self):  # type: ignore
        """
        Simulates trial unitary and returns truth table.
        """
        unitary_info = None
        try:
            unitary_info = request.get_json(silent=True)
            if not isinstance(unitary_info, dict):
                return ResponseBuilder.fail(
                    "Request body must be a valid JSON object.",
                )

            logger.info(f"Trying to simulate trial unitary: {unitary_info}")

            try:
                simulate_request = parse_simulate_request_json(unitary_info)
            except ValueError as err:
                return ResponseBuilder.fail(str(err))

            logger.info("Processing unitary info into SimulateRequestDTO")

            response = simulate_unitaries(
                simulate_request, Config.VALIDATE_TARGET_CIRCUITS
            )

            return response

        except Exception as e:
            return ResponseBuilder.error(
                message=(
                    "Unexpected error occured when simulating circuit,"
                    f" Unitary Info: {unitary_info!r}"
                ),
                data=ResponseDTO(error=str(e)),
            )
