# ============================================================
# SISTEMA DE CONTROL Y MONITOREO DE AIRES ACONDICIONADOS
# Planta de Generación de Oxígeno Líquido
# 9 Salas Eléctricas Críticas
# ============================================================
#
# Este programa permite:
#   1. Monitorear temperaturas de 9 salas eléctricas críticas
#   2. Encender/apagar aires acondicionados automática o manualmente
#   3. Generar alertas cuando la temperatura excede el umbral
#   4. Registrar todos los eventos en un archivo de logs
#
# Conceptos de Python utilizados:
#   - Diccionarios y listas (estructuras de datos)
#   - Funciones (def)
#   - Condicionales (if / elif / else)
#   - Bucles (for / while)
#   - Manejo de archivos (open, write)
#   - Módulos estándar (random, datetime)
# ============================================================

import random          # Para generar temperaturas aleatorias
from datetime import datetime  # Para obtener fecha y hora actual


# ============================================================
# DATOS DE LAS SALAS
# ============================================================
# Usamos un diccionario donde cada clave es el nombre de la sala
# y el valor es otro diccionario con los datos de esa sala.
#
# Campos de cada sala:
#   - "descripcion": qué equipo protege esa sala
#   - "temperatura": temperatura actual en °C (se simula al inicio)
#   - "ac_encendido": True si el AC está encendido, False si está apagado
#   - "umbral": temperatura máxima permitida antes de activar alerta (°C)
# ============================================================

salas = {
    "sala1": {
        "descripcion": "Tablero principal de distribución",
        "temperatura": 0.0,
        "ac_encendido": False,
        "umbral": 25.0
    },
    "sala2": {
        "descripcion": "Variadores de frecuencia - Compresor 1",
        "temperatura": 0.0,
        "ac_encendido": False,
        "umbral": 25.0
    },
    "sala3": {
        "descripcion": "Variadores de frecuencia - Compresor 2",
        "temperatura": 0.0,
        "ac_encendido": False,
        "umbral": 25.0
    },
    "sala4": {
        "descripcion": "Centro de control de motores (CCM)",
        "temperatura": 0.0,
        "ac_encendido": False,
        "umbral": 24.0
    },
    "sala5": {
        "descripcion": "PLC y sistemas de automatización",
        "temperatura": 0.0,
        "ac_encendido": False,
        "umbral": 23.0
    },
    "sala6": {
        "descripcion": "UPS y banco de baterías",
        "temperatura": 0.0,
        "ac_encendido": False,
        "umbral": 24.0
    },
    "sala7": {
        "descripcion": "Transformadores de instrumentación",
        "temperatura": 0.0,
        "ac_encendido": False,
        "umbral": 25.0
    },
    "sala8": {
        "descripcion": "Sala de servidores y SCADA",
        "temperatura": 0.0,
        "ac_encendido": False,
        "umbral": 22.0
    },
    "sala9": {
        "descripcion": "Gabinetes de fibra óptica y comunicaciones",
        "temperatura": 0.0,
        "ac_encendido": False,
        "umbral": 24.0
    }
}

# Nombre del archivo donde se guardan los registros de eventos
ARCHIVO_LOGS = "logs.txt"


# ============================================================
# FUNCIONES DEL SISTEMA
# ============================================================


def obtener_timestamp():
    """
    Devuelve la fecha y hora actual como texto formateado.
    Ejemplo: "2026-02-14 10:30:45"
    """
    ahora = datetime.now()
    return ahora.strftime("%Y-%m-%d %H:%M:%S")


def registrar_log(sala, accion):
    """
    Escribe un evento en el archivo de logs con timestamp.

    Parámetros:
        sala   (str): Nombre de la sala (ej. "sala1")
        accion (str): Descripción de lo que ocurrió

    Cómo funciona:
        - Abre el archivo en modo "a" (append/agregar) para no borrar
          los registros anteriores.
        - Escribe una línea con formato: [FECHA] | SALA | ACCIÓN
    """
    timestamp = obtener_timestamp()
    linea = f"[{timestamp}] | {sala:<6} | {accion}\n"

    # Abrimos el archivo en modo append ("a") y escribimos la línea
    archivo = open(ARCHIVO_LOGS, "a", encoding="utf-8")
    archivo.write(linea)
    archivo.close()


def generar_temperaturas():
    """
    Genera temperaturas aleatorias entre 15°C y 30°C para cada sala.
    Simula las condiciones iniciales al arrancar el sistema.

    Usa un bucle FOR para recorrer todas las salas del diccionario
    y asigna un valor aleatorio a cada una.
    """
    print("\n  Generando temperaturas iniciales aleatorias...")
    print("  " + "-" * 50)

    # Recorremos cada sala del diccionario
    for nombre_sala in salas:
        # random.randint(15, 30) genera un entero entre 15 y 30
        # Le sumamos un decimal aleatorio para más realismo
        temp = random.randint(15, 30) + round(random.random(), 1)
        salas[nombre_sala]["temperatura"] = round(temp, 1)

        print(f"  {nombre_sala}: {salas[nombre_sala]['temperatura']}°C")

        # Registramos en el log la temperatura inicial
        registrar_log(nombre_sala, f"Temperatura inicial: {temp}°C")

    print("  " + "-" * 50)
    print("  Temperaturas generadas exitosamente.\n")
    registrar_log("SYSTEM", "Simulación de temperaturas iniciales completada")


def mostrar_estado_salas():
    """
    Muestra una tabla con el estado actual de todas las salas.

    Usa un bucle FOR para recorrer el diccionario e imprime
    los datos formateados en columnas alineadas.
    """
    print("\n" + "=" * 78)
    print("  ESTADO ACTUAL DE LAS 9 SALAS ELÉCTRICAS")
    print("=" * 78)

    # Encabezado de la tabla
    print(f"  {'SALA':<8} {'DESCRIPCIÓN':<40} {'TEMP':>6} {'UMBRAL':>7} {'AC':>8}")
    print("  " + "-" * 73)

    # Recorremos cada sala con un bucle for
    for nombre_sala, datos in salas.items():
        # Determinamos el texto del estado del AC
        if datos["ac_encendido"]:
            estado_ac = "ON ✓"
        else:
            estado_ac = "OFF"

        # Determinamos si hay alerta de temperatura
        if datos["temperatura"] > datos["umbral"]:
            indicador = " ⚠ ALERTA"
        elif datos["temperatura"] > datos["umbral"] - 2:
            indicador = " ~ Precaución"
        else:
            indicador = ""

        print(f"  {nombre_sala:<8} {datos['descripcion']:<40} "
              f"{datos['temperatura']:>5.1f}° {datos['umbral']:>5.1f}° "
              f"{estado_ac:>8}{indicador}")

    print("=" * 78 + "\n")


def monitorear_temperaturas():
    """
    Recorre todas las salas y verifica si la temperatura excede el umbral.

    Lógica con condicionales (if / elif / else):
        - Si temperatura > umbral → ALERTA CRÍTICA, enciende AC automáticamente
        - Si temperatura > umbral - 2 → PRECAUCIÓN (se acerca al límite)
        - Si no → temperatura normal

    Esta función es el corazón del sistema de protección. En una planta
    de oxígeno líquido, el sobrecalentamiento de equipos eléctricos puede
    causar fallos en compresores, pérdida de control del proceso y riesgos
    de seguridad.
    """
    print("\n" + "=" * 78)
    print("  MONITOREO DE TEMPERATURAS")
    print("=" * 78)

    alertas_encontradas = 0  # Contador de alertas

    # Bucle FOR: recorremos cada sala para verificar su temperatura
    for nombre_sala, datos in salas.items():
        temperatura = datos["temperatura"]
        umbral = datos["umbral"]
        descripcion = datos["descripcion"]

        # --- CONDICIONAL if / elif / else ---
        if temperatura > umbral:
            # CASO 1: Temperatura excede el umbral → ALERTA CRÍTICA
            alertas_encontradas = alertas_encontradas + 1

            print(f"\n  ⚠⚠⚠  ALERTA CRÍTICA en {nombre_sala} ⚠⚠⚠")
            print(f"        Equipo: {descripcion}")
            print(f"        Temperatura: {temperatura}°C (umbral: {umbral}°C)")
            print(f"        Exceso: +{round(temperatura - umbral, 1)}°C")

            # Si el AC no está encendido, lo encendemos automáticamente
            if not datos["ac_encendido"]:
                datos["ac_encendido"] = True
                print(f"        → AC ENCENDIDO AUTOMÁTICAMENTE")
                registrar_log(nombre_sala,
                              f"ALERTA: {temperatura}°C > umbral {umbral}°C. "
                              f"AC encendido automáticamente.")
            else:
                print(f"        → AC ya estaba encendido. Verificar equipo.")
                registrar_log(nombre_sala,
                              f"ALERTA: {temperatura}°C > umbral {umbral}°C. "
                              f"AC ya encendido - posible fallo en refrigeración.")

            print(f"        → RIESGO: Posible fallo en componentes de "
                  f"{descripcion}")

        elif temperatura > umbral - 2:
            # CASO 2: Temperatura cercana al umbral → PRECAUCIÓN
            print(f"\n  ~  Precaución en {nombre_sala}: {temperatura}°C "
                  f"(umbral: {umbral}°C) - {descripcion}")
            registrar_log(nombre_sala,
                          f"Precaución: {temperatura}°C se acerca al "
                          f"umbral de {umbral}°C")

        else:
            # CASO 3: Temperatura normal → todo bien
            print(f"  ✓  {nombre_sala}: {temperatura}°C OK - {descripcion}")

    # Resumen final del monitoreo
    print("\n  " + "-" * 50)
    if alertas_encontradas > 0:
        print(f"  RESULTADO: {alertas_encontradas} alerta(s) detectada(s).")
        print(f"  Se recomienda inspección física de las salas afectadas.")
    else:
        print(f"  RESULTADO: Todas las salas dentro de parámetros normales.")

    registrar_log("SYSTEM",
                  f"Monitoreo completado. Alertas: {alertas_encontradas}")
    print("=" * 78 + "\n")


def simular_cambio_temperatura():
    """
    Simula un cambio aleatorio de temperatura en todas las salas.
    Útil para probar el sistema sin esperar cambios reales.

    Cada sala puede subir o bajar entre -2°C y +3°C.
    (Sube más de lo que baja para simular carga térmica de equipos)
    """
    print("\n  Simulando cambios de temperatura...")

    for nombre_sala in salas:
        # Generamos un cambio aleatorio entre -2.0 y +3.0
        cambio = round(random.uniform(-2.0, 3.0), 1)
        temperatura_anterior = salas[nombre_sala]["temperatura"]
        nueva_temp = round(temperatura_anterior + cambio, 1)

        # Limitamos la temperatura a un rango realista (10°C - 40°C)
        if nueva_temp < 10.0:
            nueva_temp = 10.0
        elif nueva_temp > 40.0:
            nueva_temp = 40.0

        salas[nombre_sala]["temperatura"] = nueva_temp

        # Mostramos el cambio
        if cambio >= 0:
            signo = "+"
        else:
            signo = ""
        print(f"  {nombre_sala}: {temperatura_anterior}°C → "
              f"{nueva_temp}°C ({signo}{cambio}°C)")

    registrar_log("SYSTEM", "Simulación de cambio de temperaturas ejecutada")
    print("  Cambios aplicados.\n")


def control_manual():
    """
    Permite al usuario encender o apagar el AC de una sala específica
    o de todas las salas a la vez.

    Menú interactivo con condicionales para procesar la opción elegida.
    """
    print("\n" + "=" * 78)
    print("  CONTROL MANUAL DE AIRES ACONDICIONADOS")
    print("=" * 78)
    print("  Opciones:")
    print("    1. Encender AC en una sala específica")
    print("    2. Apagar AC en una sala específica")
    print("    3. Encender AC en TODAS las salas")
    print("    4. Apagar AC en TODAS las salas")
    print("    0. Volver al menú principal")
    print("=" * 78)

    opcion = input("  Seleccione una opción: ").strip()

    # --- Condicional para procesar la opción ---
    if opcion == "1":
        # Encender AC en una sala específica
        sala = input("  Ingrese el nombre de la sala (ej. sala1): ").strip().lower()

        # Verificamos que la sala exista en nuestro diccionario
        if sala in salas:
            if salas[sala]["ac_encendido"]:
                print(f"  El AC de {sala} ya está encendido.")
            else:
                salas[sala]["ac_encendido"] = True
                print(f"  ✓ AC de {sala} ENCENDIDO exitosamente.")
                registrar_log(sala, "AC encendido manualmente por el operador")
        else:
            print(f"  Error: '{sala}' no es una sala válida.")
            print(f"  Salas disponibles: {', '.join(salas.keys())}")

    elif opcion == "2":
        # Apagar AC en una sala específica
        sala = input("  Ingrese el nombre de la sala (ej. sala1): ").strip().lower()

        if sala in salas:
            if not salas[sala]["ac_encendido"]:
                print(f"  El AC de {sala} ya está apagado.")
            else:
                salas[sala]["ac_encendido"] = False
                print(f"  ✓ AC de {sala} APAGADO exitosamente.")
                registrar_log(sala, "AC apagado manualmente por el operador")
        else:
            print(f"  Error: '{sala}' no es una sala válida.")

    elif opcion == "3":
        # Encender AC en TODAS las salas usando un bucle for
        print("  Encendiendo AC en todas las salas...")
        for nombre_sala in salas:
            salas[nombre_sala]["ac_encendido"] = True
            print(f"    ✓ {nombre_sala}: AC ENCENDIDO")
        registrar_log("TODAS", "AC encendido en todas las salas (manual)")
        print("  Todos los AC han sido encendidos.")

    elif opcion == "4":
        # Apagar AC en TODAS las salas usando un bucle for
        print("  Apagando AC en todas las salas...")
        for nombre_sala in salas:
            salas[nombre_sala]["ac_encendido"] = False
            print(f"    ✓ {nombre_sala}: AC APAGADO")
        registrar_log("TODAS", "AC apagado en todas las salas (manual)")
        print("  Todos los AC han sido apagados.")

    elif opcion == "0":
        # Volver al menú principal
        print("  Volviendo al menú principal...")

    else:
        # Opción no válida
        print(f"  Error: '{opcion}' no es una opción válida.")

    print()


def mostrar_logs():
    """
    Lee y muestra el contenido del archivo de logs.

    Usa manejo de archivos con open() en modo lectura ("r").
    Si el archivo no existe, muestra un mensaje informativo.
    """
    print("\n" + "=" * 78)
    print("  REGISTRO DE EVENTOS (LOGS)")
    print("=" * 78)

    try:
        # Intentamos abrir el archivo de logs
        archivo = open(ARCHIVO_LOGS, "r", encoding="utf-8")
        lineas = archivo.readlines()
        archivo.close()

        if len(lineas) == 0:
            print("  El archivo de logs está vacío.")
        else:
            # Mostramos las últimas 20 líneas (las más recientes)
            print(f"  Mostrando últimos {min(20, len(lineas))} de "
                  f"{len(lineas)} registros:\n")

            # Calculamos desde dónde empezar a mostrar
            inicio = len(lineas) - 20
            if inicio < 0:
                inicio = 0

            # Bucle for para imprimir cada línea
            for i in range(inicio, len(lineas)):
                print(f"  {lineas[i]}", end="")

    except FileNotFoundError:
        # Si el archivo no existe todavía
        print("  No se encontró el archivo de logs.")
        print("  Se creará automáticamente al registrar el primer evento.")

    print("\n" + "=" * 78 + "\n")


def mostrar_menu_principal():
    """
    Muestra el menú principal del sistema.
    Retorna la opción seleccionada por el usuario.
    """
    print("╔" + "═" * 56 + "╗")
    print("║  SISTEMA DE CONTROL AC - PLANTA OXÍGENO LÍQUIDO       ║")
    print("╠" + "═" * 56 + "╣")
    print("║                                                        ║")
    print("║   1. Monitorear temperaturas                           ║")
    print("║   2. Ver estado de todas las salas                     ║")
    print("║   3. Control manual de AC                              ║")
    print("║   4. Simular cambio de temperaturas                    ║")
    print("║   5. Ver registro de eventos (logs)                    ║")
    print("║   q. Salir del sistema                                 ║")
    print("║                                                        ║")
    print("╚" + "═" * 56 + "╝")

    opcion = input("  Seleccione una opción: ").strip().lower()
    return opcion


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================
# Aquí comienza la ejecución del programa.
# Usa un bucle WHILE que se repite hasta que el usuario
# ingrese 'q' para salir.
# ============================================================

def main():
    """
    Función principal que ejecuta el bucle del programa.
    """
    print("\n" + "=" * 58)
    print("  BIENVENIDO AL SISTEMA DE CONTROL DE AIRES ACONDICIONADOS")
    print("  Planta de Generación de Oxígeno Líquido")
    print("  Monitoreo de 9 Salas Eléctricas Críticas")
    print("=" * 58)

    # Registramos el inicio del sistema en los logs
    registrar_log("SYSTEM", "=== SISTEMA INICIADO ===")

    # Paso 1: Generar temperaturas iniciales aleatorias
    generar_temperaturas()

    # Paso 2: Ejecutar monitoreo inicial automático
    print("  Ejecutando monitoreo inicial automático...")
    monitorear_temperaturas()

    # Paso 3: Bucle principal WHILE
    # El programa se repite hasta que el usuario ingrese 'q'
    ejecutando = True  # Variable de control del bucle

    while ejecutando:
        # Mostramos el menú y obtenemos la opción del usuario
        opcion = mostrar_menu_principal()

        # --- Condicionales para procesar cada opción ---
        if opcion == "1":
            monitorear_temperaturas()

        elif opcion == "2":
            mostrar_estado_salas()

        elif opcion == "3":
            control_manual()

        elif opcion == "4":
            simular_cambio_temperatura()
            # Después de cambiar temperaturas, monitoreamos automáticamente
            monitorear_temperaturas()

        elif opcion == "5":
            mostrar_logs()

        elif opcion == "q":
            # El usuario quiere salir → cambiamos la variable de control
            ejecutando = False
            registrar_log("SYSTEM", "=== SISTEMA DETENIDO POR EL OPERADOR ===")
            print("\n  Sistema detenido. Todos los eventos fueron registrados")
            print(f"  en el archivo '{ARCHIVO_LOGS}'.")
            print("  ¡Hasta pronto!\n")

        else:
            print(f"\n  Opción '{opcion}' no válida. Intente de nuevo.\n")


# Esta línea asegura que main() solo se ejecute cuando corremos
# este archivo directamente (no cuando se importa como módulo)
if __name__ == "__main__":
    main()
