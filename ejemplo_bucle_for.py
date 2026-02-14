# Ejemplos de bucles for en Python

# Ejemplo 1: Iterar sobre una lista
print("=== Ejemplo 1: Iterar sobre una lista ===")
frutas = ["manzana", "banana", "naranja", "uva"]
for fruta in frutas:
    print(f"Me gusta la {fruta}")

print()

# Ejemplo 2: Usar range() para iterar un número específico de veces
print("=== Ejemplo 2: Usar range() ===")
for i in range(5):
    print(f"Número: {i}")

print()

# Ejemplo 3: Iterar con range() especificando inicio y fin
print("=== Ejemplo 3: Range con inicio y fin ===")
for numero in range(1, 6):
    print(f"Contando: {numero}")

print()

# Ejemplo 4: Iterar sobre un string
print("=== Ejemplo 4: Iterar sobre un string ===")
palabra = "Python"
for letra in palabra:
    print(f"Letra: {letra}")

print()

# Ejemplo 5: Iterar sobre un diccionario
print("=== Ejemplo 5: Iterar sobre un diccionario ===")
estudiante = {"nombre": "Juan", "edad": 20, "curso": "Python"}
for clave, valor in estudiante.items():
    print(f"{clave}: {valor}")

print()

# Ejemplo 6: Bucle for con enumerate() para obtener índice y valor
print("=== Ejemplo 6: Usar enumerate() ===")
colores = ["rojo", "verde", "azul"]
for indice, color in enumerate(colores):
    print(f"Índice {indice}: {color}")

print()

# Ejemplo 7: Bucle for anidado
print("=== Ejemplo 7: Bucle for anidado ===")
for i in range(1, 4):
    for j in range(1, 4):
        print(f"{i} x {j} = {i * j}")
    print()
