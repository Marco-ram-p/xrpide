var fileArray = [];
var cambios = true;
var open_program_control = false;
var xml_from_device = "";
var ini = false;
var mns = false;
var msg_mns = "";
var msg_ini = "";
var show = true;
var antiblock = false;
var lib_r = false;
var msg_lib = "";
var libs = [];

let port, reader, inputStream, outputStream;
    let keepReading = true;

    async function connect() {
      try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });

        port.addEventListener('disconnect', () => {
            logToTerminal('🔌 Cable desconectado');
            disconnect();
            btn_disconected();
            refreshFiles();
        });

        inputStream = port.readable;
        outputStream = port.writable;
        reader = inputStream.getReader();
        keepReading = true;
        readLoop();

        logToTerminal('🟢 Conectado al puerto serial');
      } catch (e) {
        logToTerminal('❌ Error al conectar: ' + e);
        btn_disconected();
      }
    }

    async function reconnect() {
      try {
        await port.open({ baudRate: 115200 });

        port.addEventListener('disconnect', () => {
            logToTerminal('🔌 Cable desconectado');
            disconnect();
            btn_disconected();
            refreshFiles();
        });

        inputStream = port.readable;
        outputStream = port.writable;
        reader = inputStream.getReader();
        keepReading = true;
        readLoop();

        logToTerminal('🟢 Conectado al puerto serial');
      } catch (e) {
        logToTerminal('❌ Error al conectar: ' + e);
        btn_disconected();
      }
    }

    async function disconnect() {
        keepReading = false;
        if (reader) {
          await reader.cancel();
          reader = null;
        }
        if (outputStream) {
          await outputStream.getWriter().close();
          outputStream = null;
        }
        if (port) {
          await port.close();
          port = null;
          logToTerminal('🔴 Desconectado');
        }
      }
  
async function sendMessage(text) {
  if (!text || !outputStream) return;

  const writer = outputStream.getWriter();
  const encoder = new TextEncoder();

  await writer.write(encoder.encode(text + '\n'));
  await new Promise(r => setTimeout(r, 50));
  writer.releaseLock();
}

  
      async function readLoop() {
        const decoder = new TextDecoder();
        while (keepReading && reader) {
          try {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              const text = decoder.decode(value);
              if(ini==true){
                msg_ini = msg_ini + text;
              }else if(mns==true){
                msg_mns = msg_mns + text;
              }else if(lib_r==true){
                msg_lib = msg_lib + text;
              }else if(show==false){

              }
              else{
                console.log("ejecuto print");
                logToTerminal('XRP: ' + text);
              }
              
            }
          } catch (e) {
            logToTerminal('❌ Error al leer: ' + e);
            break;
          }
        }
      }
  



const usbBtn = document.getElementById('connectUSBButton');
const btBtn = document.getElementById('connectBTButton');
const uploadBtn = document.querySelector('.button[onclick="uploadToDevice()"]');

function btn_conected(){
    usbBtn.textContent = 'Desconectar USB';
    btBtn.disabled = true;
    btBtn.style.opacity = '0.5';
    isConnected = true;
    uploadBtn.classList.remove('disabled');
    uploadBtn.disabled = false;
}
function btn_disconected(){
    usbBtn.classList.remove('disconnected');
    usbBtn.textContent = 'Conectar por USB';
    btBtn.disabled = false;
    btBtn.style.opacity = '1';
    isConnected = false;
    uploadBtn.classList.add('disabled');
    uploadBtn.disabled = true;
    if (isUploading) {
        isUploading = false;
        uploadBtn.textContent = 'Iniciar programa';
        uploadBtn.classList.remove('uploading');
    }
}

function esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function escapeAndChunkCodeSafe(code, chunkSize = 100) {
    const escaped = code
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');

    const chunks = [];
    let i = 0;
    while (i < escaped.length) {
        let end = i + chunkSize;
        while (end > i && escaped[end - 1] === '\\') {
            end--;
        }
        chunks.push(escaped.slice(i, end));
        i = end;
    }
    return chunks;
}
async function S_R(dat,nm) {
  const chunks = escapeAndChunkCodeSafe(dat);
  await sendMessage("f = open('" + nm + "', 'w')\r");
  await esperar(100);
  for (const chunk of chunks) {
      await sendMessage(`f.write("${chunk}")\r`);
      console.log(`f.write("${chunk}")\r`);
      await esperar(100);
  }
  await sendMessage("f.close()\r");
  await esperar(100);
}

async function update_info() {
  msg_mns = "";
  mns = true;
  await sendMessage("print(F_ini_IDE)\r");
  await esperar(100);
  mns =false;
  if(msg_mns.includes("V1.0") || antiblock == true){
    console.log("carga disponible");
  }else{
    show = false;
    const main = `F_ini_IDE = "V1.0"
from machine import Timer
import machine
import os
led = machine.Pin("LED", machine.Pin.OUT)
led_state = False
timer = Timer()
contenido = '0'
run = False
try:
    from XRPLib.board import Board
    board = Board.get_default_board()
except Exception as e:
    print(f"Error: {e}")
if "lib" not in os.listdir():
    os.mkdir("lib")
for folder in ["FusalmoLib", "ble", "phew", "XRPLib"]:
    if folder not in os.listdir("/lib"):
        os.mkdir(f"/lib/{folder}")
if "versiones.txt" not in os.listdir("/lib"):
    with open("/lib/versiones.txt", "w") as f:
        f.write("0,0,0")
if "confi.txt" not in os.listdir():
    with open("/confi.txt", "w") as f:
        f.write("0")
with open('confi.txt', 'r') as f:
    contenido = f.read()
def blink(t):
    global led_state
    led.value(not led_state)
    led_state = not led_state
    if run:
        t.deinit()
        led.value(0)
    try:
        if contenido == '1' and board.is_button_pressed():
            start()
    except Exception as e:
        print(f"Error: {e}")
timer.init(freq=3, mode=Timer.PERIODIC, callback=blink)
def start():
    global run
    run = True
    import running
try:
    if contenido == '2' and (not board.is_button_pressed()):
        start()
except Exception as e:
        print(f"Error: {e}")


`
  try {
  await S_R(main,"main.py");
  console.log(msg_mns);
  await sendMessage("import machine\r");
  await esperar(100);
  await sendMessage("machine.reset()\r");
  msg_mns = "V1.0";
  show = true;
  return;
  } catch (error) {
    console.log(error);
  }
    show = true;
  }
  ini = true;
  msg_ini = "";
  await sendMessage("import os\r");
  await esperar(100);
  await sendMessage("fs = os.statvfs('/')\r");
  await esperar(100);
  await sendMessage("print(';', os.listdir(),';')\r");
  await esperar(100);
  await sendMessage("print(';', (fs[0] * fs[2]) // 1024,';')\r");
  await esperar(100);
  await sendMessage("used_blocks = fs[2] - fs[3]\r");
  await esperar(100);
  await sendMessage("print(';', (fs[0] * used_blocks)// 1024,';')\r");
  await esperar(100);
  let ini_array = msg_ini.split(";");
  ini = false;
  await esperar(100);

  let jsonString = ini_array[3].trim().replace(/'/g, '"');
  let items = JSON.parse(jsonString);
  items = items.filter(item => item !== "lib");
  items = items.filter(item => item !== "main.py");
  items = items.filter(item => item !== "running.py");
  fileArray = items;
  fileArray.forEach(file => {
    requiredFiles[file] = `# Archivo ${file}\n`;
  });
  refreshFiles();
  console.log(Number(ini_array[11].trim()));
  if (!ini_array[11] || ini_array[11].trim()=="") {
    alert("⚠️ Error: Es posible que ya se este ejecuando un programa por favor presione el boton Reset del xrp");
  }
  updateMemoryBar(Number(ini_array[11].trim()),Number(ini_array[7].trim()));
}
async function toggleUSBConnection() {     
  showLoadingOverlay();   
    if (usbBtn.classList.contains('disconnected')) {
        disconnect();
        btn_disconected();
        refreshFiles();
    } else {
        usbBtn.classList.add('disconnected');
        refreshFiles();
        try{
            await connect();
            btn_conected();
            if(keepReading==true){
              await update_info();
            }
        }catch{
          read_memory = false;
            disconnect();
            btn_disconected();
            logToTerminal("error al conectar");
        }
            
        }
        hideLoadingOverlay();
    }

function updateMemoryBar(usedMemory,TOTAL_MEMORY) {
    const percentage = usedMemory / TOTAL_MEMORY * 100;
    const memoryFill = document.getElementById('memoryFill');
    const memoryText = document.getElementById('memoryText');
    memoryFill.style.width = percentage + '%';
    memoryText.textContent = `${usedMemory} KB / ${TOTAL_MEMORY} KB`;
    if (percentage > 90) {
      memoryFill.style.backgroundColor = '#ff4444';
    } else if (percentage > 70) {
      memoryFill.style.backgroundColor = '#ffaa33';
    } else {
      memoryFill.style.backgroundColor = '#1880bf';
    }
}

workspace.addChangeListener(function(event) {
    if (
        event.type === Blockly.Events.BLOCK_CREATE ||   // Cuando se crea un bloque
        event.type === Blockly.Events.BLOCK_DELETE ||   // Cuando se elimina un bloque
        event.type === Blockly.Events.BLOCK_CHANGE ||   // Cuando se cambia un bloque
        event.type === Blockly.Events.BLOCK_MOVE        // Cuando se mueve un bloque
    ) {
        console.log("El código ha cambiado.");
        cambios = true;
    }
});

async function save_code() {

  let file_name = document.getElementById('fileName').value;
  let code = Blockly.Python.workspaceToCode(workspace);

  const xmlDom = Blockly.Xml.workspaceToDom(workspace);
  const xmlText = Blockly.Xml.domToPrettyText(xmlDom);

  try {
    show = false;
    await S_R(code,"running.py");
    await S_R(xmlText,file_name + ".Fblocks");
    show = true
    await update_info();
  } catch (error) {
    logToTerminal(error);
    return false;
  }
  return true;
}

async function ejecutar() {
  if (cambios==true){
    antiblock = true;
    await save_code();
    antiblock = false;
  }
  show = false;
  await sendMessage("start()\r");
  await esperar(10);
  show = true;
  console.log("iniciando programa");
  await esperar(100);
}

async function detener() {
  console.log("detenendo");
  await sendMessage("import machine\r");
  await esperar(10);
  await sendMessage("machine.reset()\r");
  await esperar(10);
  toggleUSBConnection()
  logToTerminal("Por favor reinicie el xrp con el boton reset")
  alert("presione el boton reset del xrp antes de volver a conectarse")
}
function esperarHastaOTimeout(condicion, timeout = 5000, intervalo = 100) {
  return new Promise((resolve) => {
      const inicio = Date.now();

      const revisar = () => {
          if (condicion()) {
              resolve(true); // Condición cumplida
          } else if (Date.now() - inicio >= timeout) {
              resolve(false); // Tiempo agotado
          } else {
              setTimeout(revisar, intervalo);
          }
      };

      revisar();
  });
}

async function openLibraryManager() {
    if (isUploading) {
        logToTerminal('Error: No se pueden actualizar las librerías mientras un programa está en ejecución.');
        alert('No se pueden actualizar las librerías mientras un programa está en ejecución.');
        return;
    }
    if (!isConnected) {
        logToTerminal('Error: Debe conectarse a un dispositivo para actualizar las librerías');
        alert('Debe conectarse a un dispositivo para actualizar las librerías');
        return;
    }
    showLoadingOverlay();  
    msg_lib = "";
    lib_r = true;
    await sendMessage("import os\r");
    await esperar(10);
    await sendMessage("f = open('/lib/versiones.txt','r')\r");
    await esperar(10);
    await sendMessage("print(';', f.read(),';')\r");
    await esperar(10);
    await sendMessage("f.close()\r");
    await esperar(100);
    lib_r = false;
    let lib_array = msg_lib.split(";");
    libs = lib_array[3].split(",").map(item => item.trim());
    if(libs[0]==0){
      libraries[0].status = "not-installed";
      libraries[0].installedVersion = null;
    }
    if(libs[1]==0){
      libraries[1].status = "not-installed";
      libraries[1].installedVersion = null;
    }
    if(libs[2]==0){
      libraries[2].status = "not-installed";
      libraries[2].installedVersion = null;
    }
    const modal = document.querySelector('.library-modal');
    modal.style.display = 'flex';
    await loadLibraries();
    hideLoadingOverlay();
  }
async function leerArchivo(url) {
    const response = await fetch(url);
    return response.ok ? await response.text() : "Error al leer el archivo.";
}
  async function installLibrary(name) {
    showLoadingOverlay();  
    const selectEl = document.getElementById(`version-select-${name}`);
    const version = selectEl.value;
    showLoadingOverlay();
    logToTerminal(`Instalando biblioteca ${name} v${version}...`);
    try {
      /*
        if(name=="Fusalmo gamepad wifi"){
          let file = await leerArchivo("libreriaspy/FusalmoLib/Wifi_" + version + ".py");
          await S_R(file,"/lib/FusalmoLib/Wifi.py");
          await esperar(100);
          await sendMessage("import os\r");
          await esperar(10);
          await sendMessage("f = open('/lib/versiones.txt','w')\r");
          await esperar(10);
          await sendMessage("f.write('" + libs[0] + "," + version + "," + libs[2] +"')\r");
          await esperar(10);
          await sendMessage("f.close()\r");
          await esperar(100);
        }*/
        logToTerminal(`Biblioteca ${name} v${version} instalada exitosamente`);
        loadLibraries(); // Refresh the list
    } catch (error) {
        logToTerminal(`Error al instalar la biblioteca ${name}: ${error.message}`);
    } finally {
        hideLoadingOverlay();
    }
    hideLoadingOverlay();
  }
  async function openRobotConfig() {
    if (isUploading) {
        logToTerminal('Error: No se puede configurar el robot mientras un programa está en ejecución.');
        alert('No se puede configurar el robot mientras un programa está en ejecución.');
        return;
    }
    if (!isConnected) {
        logToTerminal('Error: Debe conectarse a un dispositivo primero');
        alert('Debe conectarse a un dispositivo primero');
        return;
    }
    showLoadingOverlay();  
    msg_lib = "";
    lib_r = true;
    await sendMessage("import os\r");
    await esperar(10);
    await sendMessage("f = open('/confi.txt','r')\r");
    await esperar(10);
    await sendMessage("print(';', f.read(),';')\r");
    await esperar(10);
    await sendMessage("f.close()\r");
    await esperar(100);
    lib_r = false;
    let lib_array = msg_lib.split(";");
    lib_array[3] = lib_array[3].trim();
    console.log(lib_array[3]);
    const opciones = {
    "0": "pc",
    "1": "button",
    "2": "auto"
    };

    document.querySelector(`input[name="startup"][value="${opciones[String(lib_array[3])]}"]`).checked = true;
    document.querySelector('.robot-config-modal').style.display = 'flex';
    logToTerminal('Abriendo configuración del robot');
    hideLoadingOverlay();
  }

async function guardar_confi(option) {
  show = false;
  await sendMessage("import os\r");
  await esperar(10);
  await sendMessage("f = open('/confi.txt','w')\r");
  await esperar(10);
  await sendMessage("f.write('" + option + "')\r");
  await esperar(10);
  await sendMessage("f.close()\r");
  await esperar(100);
  show = true;
}
 async function open_program(name) {
  showLoadingOverlay();
  if (confirm("⚠️ Se borrarán los cambios no guardados.\n¿Deseas continuar?")) {
    // El usuario hizo clic en "Aceptar"
    console.log("Continuando... cambios no guardados se perderán.");
    // Aquí va el código que borra o reinicia

  try {
    xml_from_device = "";
    open_program_control = true;
    await sendMessage("[[read]]," + name);
    await esperar(100);
    await esperarHastaOTimeout(() => open_program_control == false);
    const index = xml_from_device.indexOf('</xml>');
    if (index !== -1) {
        xml_from_device = xml_from_device.substring(0, index + 6); // incluye "</xml>"
    }
    workspace.clear();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml_from_device, 'text/xml');
    Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);
    //console.log(xml_from_device)
  } catch (error) {
    logToTerminal(error);
    return false;
  }
  }
  hideLoadingOverlay();
 }
async function delete_program(file_to_delete) {
  showLoadingOverlay();
  try {
    await sendMessage("[[delete]]," + file_to_delete);
    await esperar(100);
    await sendMessage("[[memory]]");
    await esperar(100);
    //logToTerminal(memory_max + "," + memory);
    requiredFiles = {};
    await sendMessage("[[files]]");
    await esperar(100);
              
    //let fileArray = ['num.py','num2.py'];
    fileArray.forEach(file => {
      requiredFiles[file] = `# Archivo ${file}\n`;
    });
    refreshFiles();
  } catch (error) {
    logToTerminal(error);
    return false;
  }
  hideLoadingOverlay();
}

async function renombrar(oldname,newname) {
  showLoadingOverlay();
  try {
    await sendMessage("[[rename]]," + oldname + "," + newname);
    await esperar(100);
    await sendMessage("[[memory]]");
    await esperar(100);
    //logToTerminal(memory_max + "," + memory);
    requiredFiles = {};
    await sendMessage("[[files]]");
    await esperar(100);
              
    //let fileArray = ['num.py','num2.py'];
    fileArray.forEach(file => {
      requiredFiles[file] = `# Archivo ${file}\n`;
    });
    refreshFiles();
  } catch (error) {
    logToTerminal(error);
    return false;
  }
  hideLoadingOverlay();
}
async function autoini() {
  showLoadingOverlay();
  await sendMessage("[[AI]]");
  await esperar(100);
  hideLoadingOverlay();
}
async function buttonini(params) {
  showLoadingOverlay();
  await sendMessage("[[BI]]");
  await esperar(100);
  hideLoadingOverlay();
}
async function noini(params) {
  showLoadingOverlay();
  await sendMessage("[[NI]]");
  await esperar(100);
  hideLoadingOverlay();
}

