# # QMCB-BE — Quantum Circuit Builder (Backend)
This project is the **prototype backend** for a web application that allows users to build quantum circuits from scratch, test output results, and compare the results via a truth table with the target circuit output results.

## Prerequisites

- Python 3.x
- Make

## Getting Started

### First Time Setup

1. Clone the repository:
```bash
git clone https://github.com/marissasinghh/qmcb.git
cd qmcb/qmcb-be
```
Only clone if you haven't already for frontend setup.

2. Initialize the project (creates virtual environment, installs dependencies, and sets up your environment variables):
```bash
make init
```

3. Run the Flask application:
```bash
make run
```

### Development Workflow

For daily development, you need to:

1. Activate the virtual environment:
```bash
source venv/bin/activate   # macOS/Linux
venv\Scripts\activate      # Windows
```

2. Run the Flask application:
```bash
make run
```


### Environment Variables

The application uses the following environment variables:
- `SECRET_KEY`=dev_secret_key
- `ALLOWED_ORIGINS`=http://localhost:3000
- `API_VERSION`=v1
- `MONGO_URI`=mongodb://localhost:27017/qmc_project


### API Endpoints

1. POST /api/simulate: Simulates a quantum circuit built from gates provided by the frontend and returns a truth table

## Example Request: 
{
  "target_unitary": "SWAP",
  "number_of_qubits": 2,
  "gates": ["CNOT", "CNOT", "CNOT"],
  "qubit_order": [[0, 1], [1, 0], [0, 1]]
}

## Example Response: 
{
    "message": "Successfully simulated trial and target unitaries.",
    "trial_truth_table": {
        "input": [
            "00",
            "01",
            "10",
            "11"
        ],
        "output": [
            "00",
            "10",
            "01",
            "11"
        ]
    },
    "target_truth_table": {
        "input": [
            "00",
            "01",
            "10",
            "11"
        ],
        "output": [
            "00",
            "10",
            "01",
            "11"
        ]
    }
}


### Makefile Commands

- make init → Creates virtual environment, installs dependencies
- make run → Runs Flask application


### Project Structure

```bash
qmcb-be/
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── main.py
│   ├── api/
│   │   └── simulate.py
│   ├── controllers/
│   │   └── simulate.py
│   ├── dto/
│   │   ├── response_dto.py
│   │   ├── truth_table.py
│   │   └── unitary.py
│   ├── repositories/
│   │   ├── construct_circuit.py
│   │   ├── quantum_gates.py
│   │   ├── simulate_circuit.py
│   │   └── target_unitaries.py
│   └── utils/
│       ├── constants.py
│       ├── helpers.py
│       ├── response_builder.py
│       ├── target_library.py
│       └── types.py
├── venv/
├── .env
├── .gitignore
├── Makefile
└── requirements.txt
```


### Notes
- The backend and frontend communicate via REST at /api/simulate.
- Be sure ALLOWED_ORIGINS matches your frontend dev/prod URLs.
- For production deployment, use a WSGI server (Gunicorn, uWSGI) behind Nginx.