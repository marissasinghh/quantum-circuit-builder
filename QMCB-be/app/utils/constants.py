from enum import Enum


class Basis(Enum):
    STATE_0 = "|0⟩"
    STATE_1 = "|1⟩"
    STATE_00 = "|00⟩"
    STATE_01 = "|01⟩"
    STATE_10 = "|10⟩"
    STATE_11 = "|11⟩"
    STATE_000 = "|000⟩"
    STATE_001 = "|001⟩"
    STATE_010 = "|010⟩"
    STATE_011 = "|011⟩"
    STATE_100 = "|100⟩"
    STATE_101 = "|101⟩"
    STATE_110 = "|110⟩"
    STATE_111 = "|111⟩"


LEVEL1_QUBITS = 1
LEVEL2_QUBITS = 2
LEVEL3_QUBITS = 3


class Gate(Enum):
    X = "X"
    H = "H"
    S = "S"
    T = "T"
    RX = "RX"
    RY = "RY"
    RZ = "RZ"
    U = "U"
    CNOT = "CNOT"
    CNOT_FLIPPED = "CNOT_FLIPPED"
    CONTROLLED_Z = "CONTROLLED_Z"
    SWAP = "SWAP"


class TargetLibraryField(Enum):
    NUM_QUBITS = "num_qubits"
    STEPS = "steps"
    GATE = "gate"
    ORDER = "order"
    EXPECTED_OUTPUTS = "expected_outputs"


class HttpStatus(Enum):
    SUCCESS = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    CONFLICT = 409
    INTERNAL_SERVER_ERROR = 500
    NOT_IMPLEMENTED = 501
    BAD_GATEWAY = 502
    SERVICE_UNAVAILABLE = 503


class RequestKey(Enum):
    METHOD = "method"
    URL = "url"
    HEADERS = "headers"
    PARAMS = "params"
    DATA = "data"
    JSON = "json"
    TIMEOUT = "timeout"
    AUTH = "auth"
    COOKIES = "cookies"
    STATUS = "status"
    MESSAGE = "message"
    CODE = "code"
