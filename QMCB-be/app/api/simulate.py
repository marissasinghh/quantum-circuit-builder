from flask_restx import Namespace, Resource
from flask import request
from app.settings import Config
from app.controllers.simulate import simulate_unitaries
from app.utils.response_builder import ResponseBuilder
from app.utils.unitary_payload import validate_simulate_unitary_json
from app.dto.response_dto import ResponseDTO
from app.dto.unitary import UnitaryDTO
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
        try:
            unitary_info = request.get_json()
            logger.info(f"Trying to simulate trial unitary: {unitary_info}")

            if not unitary_info:
                return ResponseBuilder.error("No JSON body provided", 400)

            try:
                validate_simulate_unitary_json(unitary_info)
            except ValueError as err:
                return ResponseBuilder.fail(str(err))

            logger.info("Processing unitary info into trial and target DTOs")
            trial_dto = UnitaryDTO(
                unitary_info["number_of_qubits"],
                unitary_info["gates"],
                unitary_info["qubit_order"],
            )
            target_name = unitary_info["target_unitary"]

            response = simulate_unitaries(
                trial_dto, target_name, Config.VALIDATE_TARGET_CIRCUITS
            )

            return response

        except Exception as e:
            return ResponseBuilder.error(
                message=(
                    f"Unexpected error occured when simulating circuit,"
                    f" Unitary Info: {unitary_info}"
                ),
                data=ResponseDTO(error=str(e)),
            )
