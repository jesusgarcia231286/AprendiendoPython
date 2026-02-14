# AprendiendoPython

Repositorio de aprendizaje de Python con ejemplos prácticos y progresivos.

---

## Sistema de Control de Aires Acondicionados - Planta de Oxígeno Líquido

### ¿Qué es este programa?

`control_ac.py` es un sistema de monitoreo y control de aires acondicionados
para **9 salas eléctricas críticas** en una planta que genera oxígeno líquido.

El programa simula el monitoreo de temperaturas y permite controlar los equipos
de refrigeración de forma automática y manual, registrando todos los eventos
en un archivo de logs.

### ¿Por qué es importante en una planta de oxígeno líquido?

En una planta de generación de oxígeno líquido, los equipos eléctricos
(variadores de frecuencia, PLCs, servidores SCADA, centros de control de
motores) operan en salas cerradas que generan calor constante. Si la
temperatura sube demasiado:

- **Variadores de frecuencia** pueden dispararse, deteniendo compresores
  y parando la producción.
- **PLCs y sistemas de automatización** pueden fallar, perdiendo el control
  del proceso criogénico.
- **UPS y baterías** se degradan aceleradamente con el calor, arriesgando
  la alimentación de respaldo.
- **Servidores SCADA** pueden apagarse, dejando a los operadores sin
  visibilidad del proceso.

**Este programa previene esos fallos** al:
1. Monitorear continuamente la temperatura de cada sala.
2. Activar automáticamente el aire acondicionado cuando se excede el umbral.
3. Alertar al operador sobre condiciones críticas.
4. Registrar todos los eventos para análisis posterior y auditorías.

### Las 9 Salas Eléctricas

| Sala  | Equipo Protegido                        | Umbral |
|-------|----------------------------------------|--------|
| sala1 | Tablero principal de distribución       | 25°C   |
| sala2 | Variadores de frecuencia - Compresor 1  | 25°C   |
| sala3 | Variadores de frecuencia - Compresor 2  | 25°C   |
| sala4 | Centro de control de motores (CCM)      | 24°C   |
| sala5 | PLC y sistemas de automatización        | 23°C   |
| sala6 | UPS y banco de baterías                 | 24°C   |
| sala7 | Transformadores de instrumentación      | 25°C   |
| sala8 | Sala de servidores y SCADA              | 22°C   |
| sala9 | Gabinetes de fibra óptica               | 24°C   |

### Cómo ejecutar el programa

```bash
python3 control_ac.py
```

### Menú de opciones

Al ejecutar el programa, verás un menú interactivo:

```
  1. Monitorear temperaturas      → Revisa todas las salas y activa alertas
  2. Ver estado de todas las salas → Muestra tabla con temperaturas y estado AC
  3. Control manual de AC          → Encender/apagar AC en salas específicas
  4. Simular cambio de temperaturas → Genera variaciones para probar el sistema
  5. Ver registro de eventos (logs) → Muestra los últimos eventos registrados
  q. Salir del sistema             → Detiene el programa
```

### Flujo de uso recomendado

1. Al iniciar, el sistema genera temperaturas aleatorias y ejecuta un monitoreo
   automático.
2. Usa la opción **4** para simular cambios de temperatura (sube/baja).
3. Usa la opción **1** para monitorear y ver si hay alertas.
4. Usa la opción **3** para controlar manualmente los AC.
5. Usa la opción **5** para revisar el historial de eventos.
6. Ingresa **q** para salir.

### Archivo de logs

Todos los eventos se registran en `logs.txt` con el formato:

```
[2026-02-14 10:30:45] | sala1  | ALERTA: 27.3°C > umbral 25.0°C. AC encendido automáticamente.
[2026-02-14 10:30:45] | SYSTEM | Monitoreo completado. Alertas: 3
```

### Conceptos de Python utilizados

Este programa es un ejemplo práctico de **programación estructurada** que usa:

- **Diccionarios**: Para almacenar los datos de cada sala.
- **Funciones (`def`)**: Para organizar el código en bloques reutilizables.
- **Condicionales (`if/elif/else`)**: Para tomar decisiones según la temperatura.
- **Bucles `for`**: Para recorrer las 9 salas.
- **Bucle `while`**: Para mantener el programa corriendo hasta que el usuario salga.
- **Manejo de archivos**: Para leer y escribir el registro de logs.
- **Módulos estándar**: `random` para simulación, `datetime` para timestamps.

---

## Otros archivos del repositorio

| Archivo                    | Descripción                                    |
|---------------------------|------------------------------------------------|
| `hola.py`                 | Primer programa: imprimir un mensaje            |
| `ejemplo_bucle_for.py`    | 7 ejemplos de bucles for en Python              |
| `verificar_par_impar.py`  | Ejemplos de condicionales if/elif/else          |
| `control_ac.py`           | Sistema de control AC (este programa)           |

---

## Requisitos

- Python 3.6 o superior
- No requiere librerías externas (solo módulos estándar)
