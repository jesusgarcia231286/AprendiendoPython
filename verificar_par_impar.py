# ============================================================
# Verificar si un número es par o impar usando if en Python
# ============================================================
#
# EXPLICACIÓN:
# La sentencia "if" permite ejecutar código solo cuando una
# condición se cumple (es verdadera). Su estructura básica es:
#
#   if condición:
#       # se ejecuta si la condición es True
#   else:
#       # se ejecuta si la condición es False
#
# Para saber si un número es par usamos el operador módulo (%).
# El módulo devuelve el residuo de una división:
#   - Si numero % 2 == 0 → el número es par (divisible entre 2)
#   - Si numero % 2 != 0 → el número es impar
# ============================================================


# --- Ejemplo 1: Verificación básica con if / else ---
print("=== Ejemplo 1: Verificación básica ===")

numero = 10

# Si el residuo de dividir entre 2 es cero, el número es par
if numero % 2 == 0:
    print(f"El número {numero} es PAR")
else:
    print(f"El número {numero} es IMPAR")

print()


# --- Ejemplo 2: Verificar varios números con un bucle ---
print("=== Ejemplo 2: Verificar una lista de números ===")

numeros = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

for n in numeros:
    if n % 2 == 0:
        print(f"  {n} → par")
    else:
        print(f"  {n} → impar")

print()


# --- Ejemplo 3: Uso de elif para múltiples condiciones ---
# "elif" (else if) permite evaluar condiciones adicionales.
print("=== Ejemplo 3: if / elif / else ===")

numero = 0

if numero > 0 and numero % 2 == 0:
    print(f"El número {numero} es positivo y par")
elif numero > 0 and numero % 2 != 0:
    print(f"El número {numero} es positivo e impar")
elif numero == 0:
    print(f"El número es cero (ni positivo ni negativo)")
else:
    print(f"El número {numero} es negativo")

print()


# --- Ejemplo 4: Crear una función reutilizable ---
# Encapsulamos la lógica en una función para poder usarla
# en cualquier parte del programa.
print("=== Ejemplo 4: Función reutilizable ===")


def es_par(n):
    """Devuelve True si el número es par, False si es impar."""
    return n % 2 == 0


# Probamos la función con varios valores
valores_prueba = [15, 22, -3, 0, 7, 100]

for valor in valores_prueba:
    if es_par(valor):
        print(f"  es_par({valor}) → True  (es par)")
    else:
        print(f"  es_par({valor}) → False (es impar)")

print()


# --- Resumen ---
print("=== Resumen de conceptos ===")
print("  • if / else     → evalúa una condición con dos caminos")
print("  • elif           → agrega condiciones intermedias")
print("  • numero % 2     → operador módulo, devuelve el residuo")
print("  • == 0           → compara si el residuo es cero (par)")
print("  • def funcion()  → encapsula lógica para reutilizarla")
