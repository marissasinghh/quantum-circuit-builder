# Single-qubit gate on wire 0
Q0 = [0, 0]

# Single-qubit gate on wire 1
Q1 = [1, 1]

# Single-qubit gate on wire 2
Q2 = [2, 2]

# 2-qubit gate: control=0, target=1
C0_T1 = [0, 1]

# 2-qubit gate: control=1, target=0 (flipped)
C1_T0 = [1, 0]

# 3-qubit gate: control=0, control=1, target=2 (Toffoli / CCX)
C0_C1_T2 = [0, 1, 2]

# 3-qubit gate: control=0, swap-targets=1,2 (Fredkin / CSWAP)
C0_T1_T2 = [0, 1, 2]
