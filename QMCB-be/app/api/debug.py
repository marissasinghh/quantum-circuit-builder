"""
Temporary diagnostic routes — remove after ZXZ formula verification.
"""

from __future__ import annotations

import cirq
import numpy as np
from flask import request
from flask_restx import Namespace, Resource

from app.utils.euler_angles import angles_from_seed

debug_ns = Namespace("debug", description="Temporary diagnostic endpoints.")


@debug_ns.route("/zxz-check")
class ZxzCheck(Resource):
    def get(self):  # type: ignore
        seed = int(request.args.get("seed", 1862458735))
        alpha, beta, gamma = angles_from_seed(seed)

        qubit = cirq.LineQubit(0)
        circuit = cirq.Circuit([
            cirq.rz(alpha)(qubit),
            cirq.rx(beta)(qubit),
            cirq.rz(gamma)(qubit),
        ])
        result = cirq.Simulator().simulate(circuit, initial_state=0)
        sv = result.final_state_vector
        a, b = complex(sv[0]), complex(sv[1])

        return {
            "seed": seed,
            "alpha": alpha,
            "beta": beta,
            "gamma": gamma,
            "u00": {"re": a.real, "im": a.imag},
            "u10": {"re": b.real, "im": b.imag},
            "abs_u00": abs(a),
            "arg_u00": float(np.angle(a)),
            "arg_u10": float(np.angle(b)),
            "beta_from_formula": 2 * float(np.arccos(abs(a))),
            "alpha_plus_gamma_from_formula": -2 * float(np.angle(a)),
            "alpha_minus_gamma_actual": alpha - gamma,
            "alpha_minus_gamma_from_old_formula": 2 * float(np.angle(b)) - np.pi / 2,
            "alpha_minus_gamma_from_new_formula": -2 * float(np.angle(b)) - np.pi,
        }, 200
