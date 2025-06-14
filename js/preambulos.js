

  // ----------- codigos preambulo-------------------------------------------

/*
  // preanbulos sin prioridad
  // Crear una lista global para almacenar el código preámbulo
python.pythonGenerator.imports_ = python.pythonGenerator.imports_ || new Set();

// Crear una nueva función para agregar el código preámbulo
python.pythonGenerator.generateCodeWithImports = function(workspace) {
  // Obtener el código generado por los bloques
  const blocksCode = Blockly.Python.workspaceToCode(workspace);

  // Combinar los imports únicos al inicio con el código de los bloques
  const importsCode = Array.from(this.imports_).join('\n');
  return `${importsCode}\n\n${blocksCode}`;
};

*/

// Crear una lista global para almacenar las importaciones con prioridad
python.pythonGenerator.importsWithPriority = python.pythonGenerator.importsWithPriority || [];

// Función para agregar una importación con prioridad
python.pythonGenerator.addImportWithPriority = function(importCode, priority) {
  // Verificar si ya existe el código de importación
  const exists = this.importsWithPriority.some(
    (item) => item.importCode === importCode
  );

  // Agregarlo si no existe
  if (!exists) {
    this.importsWithPriority.push({ importCode, priority });
  }
};

// Función para reiniciar las importaciones antes de generar código
python.pythonGenerator.resetImports = function() {
  this.importsWithPriority = [];
};

// Función para generar el código con las importaciones ordenadas por prioridad
python.pythonGenerator.generateCodeWithImports = function(workspace) {
  // Reiniciar las importaciones antes de generar código
  this.resetImports();

  // Obtener el código de los bloques sin recursión
  const blocksCode = Blockly.Python.blocklyWorkspaceToCode(workspace);

  // Ordenar las importaciones por prioridad (menor número = más alta prioridad)
  this.importsWithPriority.sort((a, b) => a.priority - b.priority);

  // Combinar las importaciones únicas en el orden correcto
  const importsCode = this.importsWithPriority
    .map((item) => item.importCode)
    .join('\n');

  // Retornar las importaciones seguidas del código generado
  return `${importsCode}\n\n${blocksCode}`;
};

// Guardar la función original para evitar recursión
Blockly.Python.blocklyWorkspaceToCode = Blockly.Python.workspaceToCode;

// Sobrescribir `workspaceToCode` para llamar a la nueva función
Blockly.Python.workspaceToCode = function(workspace) {
  return python.pythonGenerator.generateCodeWithImports(workspace);
};

//--------------------------codigos para importar librerias--------------------------
const lib = {
  "board":"from XRPLib.board import Board",
  "servo":"from XRPLib.servo import Servo",
  "distance":"from XRPLib.rangefinder import Rangefinder",
  "siguelinea":"from XRPLib.reflectance import Reflectance",
  "tiempo":"import time",
  "gyro":"from XRPLib.imu import IMU",
  "motor":"from XRPLib.encoded_motor import EncodedMotor",
  "pulsadores_shield":"from FusalmoLib import ExternalI2C",
  "avanzar":"from XRPLib.differential_drive import DifferentialDrive",
  "server":"from XRPLib.webserver import Webserver",
  "pin":"from machine import Pin",
  "adc":"from machine import ADC",
  "bt":"import bluetooth",
  "math":"import math",
  "wifi_gamepad":"from FusalmoLib.Wifi import wifi_gamepad" 
}

// codigos para definiciones y variables

const def = {
  "onboard":"board = Board.get_default_board()",
  "distance":"rangefinder = Rangefinder.get_default_rangefinder()",
  "siguelineas":"reflectance = Reflectance.get_default_reflectance()",
  "gyro":"imu = IMU.get_default_imu()\nimu.calibrate(1)",
  "i2c_shield":"i2c_shield = ExternalI2C()",
  "avanzar":"differentialDrive = DifferentialDrive.get_default_differential_drive()",
  "server":"webserver = Webserver.get_default_webserver()",
  "pestolink":"from XRPLib.defaults import *\nfrom pestolink import PestoLinkAgent",
  "wifi_gamepad":"w_gamepad = wifi_gamepad()"
}

// funciones utiles
const fun = {
  "Formato_orden":
`
def num_formato(texto: str, valor: float, digitos: int) -> str:
  str_valor = str(valor)  # Convertimos el número en cadena
  if len(str_valor) > digitos:
    str_valor = str_valor[:digitos]  # Truncar si excede los dígitos permitidos
  else:
    str_valor = "0" * (digitos - len(str_valor)) + str_valor  # Rellenar con ceros a la izquierda
  return texto + str_valor`
}

/* gerarquia 

  librerias -> 1
  Definiciones -> 2
  set_devise ->3
*/