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

function _0x2da4(_0xea148f,_0x47b8c1){const _0x32ff42=_0x32ff();return _0x2da4=function(_0x2da496,_0x5431be){_0x2da496=_0x2da496-0x1df;let _0x869029=_0x32ff42[_0x2da496];return _0x869029;},_0x2da4(_0xea148f,_0x47b8c1);}const _0x92896e=_0x2da4;(function(_0x3b680a,_0x39ed42){const _0x2a9efd=_0x2da4,_0x293a1e=_0x3b680a();while(!![]){try{const _0x20fea7=-parseInt(_0x2a9efd(0x22c))/0x1*(-parseInt(_0x2a9efd(0x20e))/0x2)+-parseInt(_0x2a9efd(0x24c))/0x3+-parseInt(_0x2a9efd(0x22e))/0x4*(-parseInt(_0x2a9efd(0x1fd))/0x5)+parseInt(_0x2a9efd(0x236))/0x6+parseInt(_0x2a9efd(0x25b))/0x7+-parseInt(_0x2a9efd(0x224))/0x8+parseInt(_0x2a9efd(0x1ed))/0x9*(-parseInt(_0x2a9efd(0x258))/0xa);if(_0x20fea7===_0x39ed42)break;else _0x293a1e['push'](_0x293a1e['shift']());}catch(_0x2d94e6){_0x293a1e['push'](_0x293a1e['shift']());}}}(_0x32ff,0xd5785));var fileArray=[],cambios=!![],open_program_control=![],xml_from_device='',ini=![],mns=![],msg_mns='',msg_ini='',show=!![],antiblock=![],lib_r=![],msg_lib='',libs=[];let port,reader,inputStream,outputStream,keepReading=!![];async function connect(){const _0x3a6636=_0x2da4;try{port=await navigator[_0x3a6636(0x265)]['requestPort'](),await port[_0x3a6636(0x1df)]({'baudRate':0x1c200}),port[_0x3a6636(0x24f)](_0x3a6636(0x264),()=>{const _0x1fab95=_0x3a6636;logToTerminal(_0x1fab95(0x269)),disconnect(),btn_disconected(),refreshFiles();}),inputStream=port[_0x3a6636(0x1f8)],outputStream=port['writable'],reader=inputStream[_0x3a6636(0x229)](),keepReading=!![],readLoop(),logToTerminal('🟢\x20Conectado\x20al\x20puerto\x20serial');}catch(_0x4de126){logToTerminal(_0x3a6636(0x20b)+_0x4de126),btn_disconected();}}async function reconnect(){const _0x27dbca=_0x2da4;try{await port[_0x27dbca(0x1df)]({'baudRate':0x1c200}),port[_0x27dbca(0x24f)](_0x27dbca(0x264),()=>{const _0x455411=_0x27dbca;logToTerminal(_0x455411(0x269)),disconnect(),btn_disconected(),refreshFiles();}),inputStream=port[_0x27dbca(0x1f8)],outputStream=port['writable'],reader=inputStream[_0x27dbca(0x229)](),keepReading=!![],readLoop(),logToTerminal('🟢\x20Conectado\x20al\x20puerto\x20serial');}catch(_0x47daf3){logToTerminal('❌\x20Error\x20al\x20conectar:\x20'+_0x47daf3),btn_disconected();}}function _0x32ff(){const _0x25a01e=['BLOCK_CREATE','uploading','not-installed','getWriter','message','[[read]],','readable','clear','opacity','disabled','f.write(\x22','15325fYptWv','f\x20=\x20open(\x27/confi.txt\x27,\x27r\x27)\x0d','Error:\x20No\x20se\x20pueden\x20actualizar\x20las\x20librerías\x20mientras\x20un\x20programa\x20está\x20en\x20ejecución.','value','type','textContent','f.close()\x0d','fs\x20=\x20os.statvfs(\x27/\x27)\x0d','now','El\x20código\x20ha\x20cambiado.','print(\x27;\x27,\x20os.listdir(),\x27;\x27)\x0d','indexOf','Biblioteca\x20','F_ini_IDE\x20=\x20\x22V1.0\x22\x0afrom\x20machine\x20import\x20Timer\x0aimport\x20machine\x0aimport\x20os\x0aled\x20=\x20machine.Pin(\x22LED\x22,\x20machine.Pin.OUT)\x0aled_state\x20=\x20False\x0atimer\x20=\x20Timer()\x0acontenido\x20=\x20\x270\x27\x0arun\x20=\x20False\x0atry:\x0a\x20\x20\x20\x20from\x20XRPLib.board\x20import\x20Board\x0a\x20\x20\x20\x20board\x20=\x20Board.get_default_board()\x0aexcept\x20Exception\x20as\x20e:\x0a\x20\x20\x20\x20print(f\x22Error:\x20{e}\x22)\x0aif\x20\x22lib\x22\x20not\x20in\x20os.listdir():\x0a\x20\x20\x20\x20os.mkdir(\x22lib\x22)\x0afor\x20folder\x20in\x20[\x22FusalmoLib\x22,\x20\x22ble\x22,\x20\x22phew\x22,\x20\x22XRPLib\x22]:\x0a\x20\x20\x20\x20if\x20folder\x20not\x20in\x20os.listdir(\x22/lib\x22):\x0a\x20\x20\x20\x20\x20\x20\x20\x20os.mkdir(f\x22/lib/{folder}\x22)\x0aif\x20\x22versiones.txt\x22\x20not\x20in\x20os.listdir(\x22/lib\x22):\x0a\x20\x20\x20\x20with\x20open(\x22/lib/versiones.txt\x22,\x20\x22w\x22)\x20as\x20f:\x0a\x20\x20\x20\x20\x20\x20\x20\x20f.write(\x220,0,0\x22)\x0aif\x20\x22confi.txt\x22\x20not\x20in\x20os.listdir():\x0a\x20\x20\x20\x20with\x20open(\x22/confi.txt\x22,\x20\x22w\x22)\x20as\x20f:\x0a\x20\x20\x20\x20\x20\x20\x20\x20f.write(\x220\x22)\x0awith\x20open(\x27confi.txt\x27,\x20\x27r\x27)\x20as\x20f:\x0a\x20\x20\x20\x20contenido\x20=\x20f.read()\x0adef\x20blink(t):\x0a\x20\x20\x20\x20global\x20led_state\x0a\x20\x20\x20\x20led.value(not\x20led_state)\x0a\x20\x20\x20\x20led_state\x20=\x20not\x20led_state\x0a\x20\x20\x20\x20if\x20run:\x0a\x20\x20\x20\x20\x20\x20\x20\x20t.deinit()\x0a\x20\x20\x20\x20\x20\x20\x20\x20led.value(0)\x0a\x20\x20\x20\x20try:\x0a\x20\x20\x20\x20\x20\x20\x20\x20if\x20contenido\x20==\x20\x271\x27\x20and\x20board.is_button_pressed():\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20start()\x0a\x20\x20\x20\x20except\x20Exception\x20as\x20e:\x0a\x20\x20\x20\x20\x20\x20\x20\x20print(f\x22Error:\x20{e}\x22)\x0atimer.init(freq=3,\x20mode=Timer.PERIODIC,\x20callback=blink)\x0adef\x20start():\x0a\x20\x20\x20\x20global\x20run\x0a\x20\x20\x20\x20run\x20=\x20True\x0a\x20\x20\x20\x20import\x20running\x0atry:\x0a\x20\x20\x20\x20if\x20contenido\x20==\x20\x272\x27\x20and\x20(not\x20board.is_button_pressed()):\x0a\x20\x20\x20\x20\x20\x20\x20\x20start()\x0aexcept\x20Exception\x20as\x20e:\x0a\x20\x20\x20\x20\x20\x20\x20\x20print(f\x22Error:\x20{e}\x22)\x0a\x0a\x0a','❌\x20Error\x20al\x20conectar:\x20','\x20instalada\x20exitosamente','detenendo','2923706OAQWFv','getElementById','Error:\x20Debe\x20conectarse\x20a\x20un\x20dispositivo\x20primero','input[name=\x22startup\x22][value=\x22','print(\x27;\x27,\x20(fs[0]\x20*\x20fs[2])\x20//\x201024,\x27;\x27)\x0d','Debe\x20conectarse\x20a\x20un\x20dispositivo\x20primero','carga\x20disponible','parse','length','No\x20se\x20pueden\x20actualizar\x20las\x20librerías\x20mientras\x20un\x20programa\x20está\x20en\x20ejecución.','contains','BLOCK_CHANGE','Continuando...\x20cambios\x20no\x20guardados\x20se\x20perderán.','...','releaseLock','iniciando\x20programa','[[NI]]','\x27,\x20\x27w\x27)\x0d','Events','version-select-','ejecuto\x20print','[[files]]','13002064rTYvEP','disconnected','split','map','status','getReader','slice','machine.reset()\x0d','1cwzGPA','.library-modal','1820QAjHCH','remove','Por\x20favor\x20reinicie\x20el\x20xrp\x20con\x20el\x20boton\x20reset','XRP:\x20','backgroundColor','Python','main.py','\x20KB\x20/\x20','3288666UEEkVh','print(\x27;\x27,\x20f.read(),\x27;\x27)\x0d','documentElement','Conectar\x20por\x20USB','running.py','close','f\x20=\x20open(\x27/lib/versiones.txt\x27,\x27r\x27)\x0d','style','trim','flex','parseFromString','installedVersion','domToPrettyText','replace','[[rename]],','🔴\x20Desconectado','V1.0','checked','[[delete]],','forEach','BLOCK_MOVE','button','972618SsopGt','width','Iniciar\x20programa','addEventListener','f.write(\x27','#1880bf','display','0.5','#ffaa33','memoryText','#\x20Archivo\x20','workspaceToCode','6759430AtelTs','decode','.Fblocks','666687vqaATl','log','connectUSBButton','import\x20os\x0d','write','#ff4444','No\x20se\x20puede\x20configurar\x20el\x20robot\x20mientras\x20un\x20programa\x20está\x20en\x20ejecución.','filter','\x22)\x0d','disconnect','serial','push','error\x20al\x20conectar','used_blocks\x20=\x20fs[2]\x20-\x20fs[3]\x0d','🔌\x20Cable\x20desconectado','[[memory]]','text/xml','open','lib','⚠️\x20Error:\x20Es\x20posible\x20que\x20ya\x20se\x20este\x20ejecuando\x20un\x20programa\x20por\x20favor\x20presione\x20el\x20boton\x20Reset\x20del\x20xrp','auto','fileName','connectBTButton','memoryFill','Xml','import\x20machine\x0d','print(F_ini_IDE)\x0d','querySelector','classList','add','Error\x20al\x20leer\x20el\x20archivo.','9HgjQoA','f\x20=\x20open(\x27','</xml>','cancel','Desconectar\x20USB'];_0x32ff=function(){return _0x25a01e;};return _0x32ff();}async function disconnect(){const _0x4f9dbe=_0x2da4;keepReading=![],reader&&(await reader[_0x4f9dbe(0x1f0)](),reader=null),outputStream&&(await outputStream[_0x4f9dbe(0x1f5)]()[_0x4f9dbe(0x23b)](),outputStream=null),port&&(await port[_0x4f9dbe(0x23b)](),port=null,logToTerminal(_0x4f9dbe(0x245)));}async function sendMessage(_0xc86743){const _0x3826fe=_0x2da4;if(!_0xc86743||!outputStream)return;const _0x418574=outputStream[_0x3826fe(0x1f5)](),_0x29faae=new TextEncoder();await _0x418574[_0x3826fe(0x25f)](_0x29faae['encode'](_0xc86743+'\x0a')),await new Promise(_0x4d79b8=>setTimeout(_0x4d79b8,0x32)),_0x418574[_0x3826fe(0x21c)]();}async function readLoop(){const _0x74ba44=_0x2da4,_0x292d06=new TextDecoder();while(keepReading&&reader){try{const {value:_0x151826,done:_0x991a93}=await reader['read']();if(_0x991a93)break;if(_0x151826){const _0x485fe7=_0x292d06[_0x74ba44(0x259)](_0x151826);if(ini==!![])msg_ini=msg_ini+_0x485fe7;else{if(mns==!![])msg_mns=msg_mns+_0x485fe7;else{if(lib_r==!![])msg_lib=msg_lib+_0x485fe7;else{if(show==![]){}else console[_0x74ba44(0x25c)](_0x74ba44(0x222)),logToTerminal(_0x74ba44(0x231)+_0x485fe7);}}}}}catch(_0x530e0e){logToTerminal('❌\x20Error\x20al\x20leer:\x20'+_0x530e0e);break;}}}const usbBtn=document[_0x92896e(0x20f)](_0x92896e(0x25d)),btBtn=document[_0x92896e(0x20f)](_0x92896e(0x1e4)),uploadBtn=document[_0x92896e(0x1e9)]('.button[onclick=\x22uploadToDevice()\x22]');function btn_conected(){const _0x33be34=_0x92896e;usbBtn[_0x33be34(0x202)]=_0x33be34(0x1f1),btBtn[_0x33be34(0x1fb)]=!![],btBtn[_0x33be34(0x23d)][_0x33be34(0x1fa)]=_0x33be34(0x253),isConnected=!![],uploadBtn[_0x33be34(0x1ea)][_0x33be34(0x22f)](_0x33be34(0x1fb)),uploadBtn[_0x33be34(0x1fb)]=![];}function btn_disconected(){const _0x459500=_0x92896e;usbBtn['classList']['remove'](_0x459500(0x225)),usbBtn[_0x459500(0x202)]=_0x459500(0x239),btBtn[_0x459500(0x1fb)]=![],btBtn[_0x459500(0x23d)][_0x459500(0x1fa)]='1',isConnected=![],uploadBtn['classList'][_0x459500(0x1eb)](_0x459500(0x1fb)),uploadBtn['disabled']=!![],isUploading&&(isUploading=![],uploadBtn[_0x459500(0x202)]=_0x459500(0x24e),uploadBtn[_0x459500(0x1ea)][_0x459500(0x22f)](_0x459500(0x1f3)));}function esperar(_0x4466b){return new Promise(_0x3443b4=>setTimeout(_0x3443b4,_0x4466b));}function escapeAndChunkCodeSafe(_0x22ecca,_0x471a97=0x64){const _0x3a31e3=_0x92896e,_0x5e66e8=_0x22ecca['replace'](/\\/g,'\x5c\x5c')[_0x3a31e3(0x243)](/"/g,'\x5c\x22')[_0x3a31e3(0x243)](/\n/g,'\x5cn'),_0x414d6e=[];let _0x139d6e=0x0;while(_0x139d6e<_0x5e66e8[_0x3a31e3(0x216)]){let _0x56b18e=_0x139d6e+_0x471a97;while(_0x56b18e>_0x139d6e&&_0x5e66e8[_0x56b18e-0x1]==='\x5c'){_0x56b18e--;}_0x414d6e[_0x3a31e3(0x266)](_0x5e66e8[_0x3a31e3(0x22a)](_0x139d6e,_0x56b18e)),_0x139d6e=_0x56b18e;}return _0x414d6e;}async function S_R(_0x217a2f,_0x229188){const _0x4ab09b=_0x92896e,_0x23a2a8=escapeAndChunkCodeSafe(_0x217a2f);await sendMessage(_0x4ab09b(0x1ee)+_0x229188+_0x4ab09b(0x21f)),await esperar(0x64);for(const _0xe6a283 of _0x23a2a8){await sendMessage(_0x4ab09b(0x1fc)+_0xe6a283+_0x4ab09b(0x263)),console[_0x4ab09b(0x25c)]('f.write(\x22'+_0xe6a283+'\x22)\x0d'),await esperar(0x64);}await sendMessage('f.close()\x0d'),await esperar(0x64);}async function update_info(){const _0x35621e=_0x92896e;msg_mns='',mns=!![],await sendMessage(_0x35621e(0x1e8)),await esperar(0x64),mns=![];if(msg_mns['includes'](_0x35621e(0x246))||antiblock==!![])console[_0x35621e(0x25c)](_0x35621e(0x214));else{show=![];const _0xf7552f=_0x35621e(0x20a);try{await S_R(_0xf7552f,_0x35621e(0x234)),console[_0x35621e(0x25c)](msg_mns),await sendMessage('import\x20machine\x0d'),await esperar(0x64),await sendMessage(_0x35621e(0x22b)),msg_mns=_0x35621e(0x246),show=!![];return;}catch(_0x3c31dd){console[_0x35621e(0x25c)](_0x3c31dd);}show=!![];}ini=!![],msg_ini='',await sendMessage(_0x35621e(0x25e)),await esperar(0x64),await sendMessage(_0x35621e(0x204)),await esperar(0x64),await sendMessage(_0x35621e(0x207)),await esperar(0x64),await sendMessage(_0x35621e(0x212)),await esperar(0x64),await sendMessage(_0x35621e(0x268)),await esperar(0x64),await sendMessage('print(\x27;\x27,\x20(fs[0]\x20*\x20used_blocks)//\x201024,\x27;\x27)\x0d'),await esperar(0x64);let _0x1d4160=msg_ini['split'](';');ini=![],await esperar(0x64);let _0x378596=_0x1d4160[0x3][_0x35621e(0x23e)]()[_0x35621e(0x243)](/'/g,'\x22'),_0x3c9999=JSON[_0x35621e(0x215)](_0x378596);_0x3c9999=_0x3c9999[_0x35621e(0x262)](_0x3c31df=>_0x3c31df!==_0x35621e(0x1e0)),_0x3c9999=_0x3c9999[_0x35621e(0x262)](_0x1d6a12=>_0x1d6a12!==_0x35621e(0x234)),_0x3c9999=_0x3c9999[_0x35621e(0x262)](_0x3f5442=>_0x3f5442!==_0x35621e(0x23a)),fileArray=_0x3c9999,fileArray[_0x35621e(0x249)](_0x2b41ac=>{const _0x22070a=_0x35621e;requiredFiles[_0x2b41ac]=_0x22070a(0x256)+_0x2b41ac+'\x0a';}),refreshFiles(),console[_0x35621e(0x25c)](Number(_0x1d4160[0xb]['trim']())),(!_0x1d4160[0xb]||_0x1d4160[0xb][_0x35621e(0x23e)]()=='')&&alert(_0x35621e(0x1e1)),updateMemoryBar(Number(_0x1d4160[0xb][_0x35621e(0x23e)]()),Number(_0x1d4160[0x7]['trim']()));}async function toggleUSBConnection(){const _0x4cf389=_0x92896e;showLoadingOverlay();if(usbBtn['classList'][_0x4cf389(0x218)](_0x4cf389(0x225)))disconnect(),btn_disconected(),refreshFiles();else{usbBtn['classList'][_0x4cf389(0x1eb)](_0x4cf389(0x225)),refreshFiles();try{await connect(),btn_conected(),keepReading==!![]&&await update_info();}catch{read_memory=![],disconnect(),btn_disconected(),logToTerminal(_0x4cf389(0x267));}}hideLoadingOverlay();}function updateMemoryBar(_0x493297,_0x3f0b9a){const _0xadefd0=_0x92896e,_0x4ab9c5=_0x493297/_0x3f0b9a*0x64,_0x31b4d8=document[_0xadefd0(0x20f)](_0xadefd0(0x1e5)),_0x5e25ba=document[_0xadefd0(0x20f)](_0xadefd0(0x255));_0x31b4d8[_0xadefd0(0x23d)][_0xadefd0(0x24d)]=_0x4ab9c5+'%',_0x5e25ba['textContent']=_0x493297+_0xadefd0(0x235)+_0x3f0b9a+'\x20KB';if(_0x4ab9c5>0x5a)_0x31b4d8[_0xadefd0(0x23d)][_0xadefd0(0x232)]=_0xadefd0(0x260);else _0x4ab9c5>0x46?_0x31b4d8['style'][_0xadefd0(0x232)]=_0xadefd0(0x254):_0x31b4d8[_0xadefd0(0x23d)][_0xadefd0(0x232)]=_0xadefd0(0x251);}workspace['addChangeListener'](function(_0x4f27e1){const _0x3d7e31=_0x92896e;(_0x4f27e1[_0x3d7e31(0x201)]===Blockly[_0x3d7e31(0x220)][_0x3d7e31(0x1f2)]||_0x4f27e1[_0x3d7e31(0x201)]===Blockly['Events']['BLOCK_DELETE']||_0x4f27e1[_0x3d7e31(0x201)]===Blockly[_0x3d7e31(0x220)][_0x3d7e31(0x219)]||_0x4f27e1[_0x3d7e31(0x201)]===Blockly['Events'][_0x3d7e31(0x24a)])&&(console[_0x3d7e31(0x25c)](_0x3d7e31(0x206)),cambios=!![]);});async function save_code(){const _0x5f3466=_0x92896e;let _0x311473=document[_0x5f3466(0x20f)](_0x5f3466(0x1e3))[_0x5f3466(0x200)],_0x524bc9=Blockly[_0x5f3466(0x233)][_0x5f3466(0x257)](workspace);const _0x1cdd54=Blockly['Xml']['workspaceToDom'](workspace),_0x410dfa=Blockly['Xml'][_0x5f3466(0x242)](_0x1cdd54);try{show=![],await S_R(_0x524bc9,_0x5f3466(0x23a)),await S_R(_0x410dfa,_0x311473+_0x5f3466(0x25a)),show=!![],await update_info();}catch(_0x5b2781){return logToTerminal(_0x5b2781),![];}return!![];}async function ejecutar(){const _0x6c4e9e=_0x92896e;cambios==!![]&&(antiblock=!![],await save_code(),antiblock=![]),show=![],await sendMessage('start()\x0d'),await esperar(0xa),show=!![],console['log'](_0x6c4e9e(0x21d)),await esperar(0x64);}async function detener(){const _0x3081e2=_0x92896e;console[_0x3081e2(0x25c)](_0x3081e2(0x20d)),await sendMessage(_0x3081e2(0x1e7)),await esperar(0xa),await sendMessage(_0x3081e2(0x22b)),await esperar(0xa),toggleUSBConnection(),logToTerminal(_0x3081e2(0x230)),alert('presione\x20el\x20boton\x20reset\x20del\x20xrp\x20antes\x20de\x20volver\x20a\x20conectarse');}function esperarHastaOTimeout(_0x3574b2,_0x4108cb=0x1388,_0x5cb96a=0x64){return new Promise(_0x2710de=>{const _0x10812a=_0x2da4,_0x5a01c6=Date[_0x10812a(0x205)](),_0x1aecf2=()=>{const _0x577867=_0x10812a;if(_0x3574b2())_0x2710de(!![]);else Date[_0x577867(0x205)]()-_0x5a01c6>=_0x4108cb?_0x2710de(![]):setTimeout(_0x1aecf2,_0x5cb96a);};_0x1aecf2();});}async function openLibraryManager(){const _0x50a8e8=_0x92896e;if(isUploading){logToTerminal(_0x50a8e8(0x1ff)),alert(_0x50a8e8(0x217));return;}if(!isConnected){logToTerminal('Error:\x20Debe\x20conectarse\x20a\x20un\x20dispositivo\x20para\x20actualizar\x20las\x20librerías'),alert('Debe\x20conectarse\x20a\x20un\x20dispositivo\x20para\x20actualizar\x20las\x20librerías');return;}showLoadingOverlay(),msg_lib='',lib_r=!![],await sendMessage(_0x50a8e8(0x25e)),await esperar(0xa),await sendMessage(_0x50a8e8(0x23c)),await esperar(0xa),await sendMessage(_0x50a8e8(0x237)),await esperar(0xa),await sendMessage(_0x50a8e8(0x203)),await esperar(0x64),lib_r=![];let _0x34403e=msg_lib[_0x50a8e8(0x226)](';');libs=_0x34403e[0x3][_0x50a8e8(0x226)](',')[_0x50a8e8(0x227)](_0x54f1d7=>_0x54f1d7[_0x50a8e8(0x23e)]());libs[0x0]==0x0&&(libraries[0x0][_0x50a8e8(0x228)]='not-installed',libraries[0x0][_0x50a8e8(0x241)]=null);libs[0x1]==0x0&&(libraries[0x1][_0x50a8e8(0x228)]=_0x50a8e8(0x1f4),libraries[0x1][_0x50a8e8(0x241)]=null);libs[0x2]==0x0&&(libraries[0x2][_0x50a8e8(0x228)]=_0x50a8e8(0x1f4),libraries[0x2][_0x50a8e8(0x241)]=null);const _0x35f566=document[_0x50a8e8(0x1e9)](_0x50a8e8(0x22d));_0x35f566['style'][_0x50a8e8(0x252)]=_0x50a8e8(0x23f),await loadLibraries(),hideLoadingOverlay();}async function leerArchivo(_0x2738f0){const _0x2c5abf=_0x92896e,_0x5aad7e=await fetch(_0x2738f0);return _0x5aad7e['ok']?await _0x5aad7e['text']():_0x2c5abf(0x1ec);}async function installLibrary(_0x2ee922){const _0xe2783d=_0x92896e;showLoadingOverlay();const _0x478a75=document[_0xe2783d(0x20f)](_0xe2783d(0x221)+_0x2ee922),_0x397274=_0x478a75[_0xe2783d(0x200)];showLoadingOverlay(),logToTerminal('Instalando\x20biblioteca\x20'+_0x2ee922+'\x20v'+_0x397274+_0xe2783d(0x21b));try{logToTerminal(_0xe2783d(0x209)+_0x2ee922+'\x20v'+_0x397274+_0xe2783d(0x20c)),loadLibraries();}catch(_0x18e7bd){logToTerminal('Error\x20al\x20instalar\x20la\x20biblioteca\x20'+_0x2ee922+':\x20'+_0x18e7bd[_0xe2783d(0x1f6)]);}finally{hideLoadingOverlay();}hideLoadingOverlay();}async function openRobotConfig(){const _0x31e3ae=_0x92896e;if(isUploading){logToTerminal('Error:\x20No\x20se\x20puede\x20configurar\x20el\x20robot\x20mientras\x20un\x20programa\x20está\x20en\x20ejecución.'),alert(_0x31e3ae(0x261));return;}if(!isConnected){logToTerminal(_0x31e3ae(0x210)),alert(_0x31e3ae(0x213));return;}showLoadingOverlay(),msg_lib='',lib_r=!![],await sendMessage(_0x31e3ae(0x25e)),await esperar(0xa),await sendMessage(_0x31e3ae(0x1fe)),await esperar(0xa),await sendMessage(_0x31e3ae(0x237)),await esperar(0xa),await sendMessage(_0x31e3ae(0x203)),await esperar(0x64),lib_r=![];let _0x16102d=msg_lib[_0x31e3ae(0x226)](';');_0x16102d[0x3]=_0x16102d[0x3][_0x31e3ae(0x23e)](),console[_0x31e3ae(0x25c)](_0x16102d[0x3]);const _0xbbc42c={'0':'pc','1':_0x31e3ae(0x24b),'2':_0x31e3ae(0x1e2)};document[_0x31e3ae(0x1e9)](_0x31e3ae(0x211)+_0xbbc42c[String(_0x16102d[0x3])]+'\x22]')[_0x31e3ae(0x247)]=!![],document['querySelector']('.robot-config-modal')[_0x31e3ae(0x23d)][_0x31e3ae(0x252)]=_0x31e3ae(0x23f),logToTerminal('Abriendo\x20configuración\x20del\x20robot'),hideLoadingOverlay();}async function guardar_confi(_0x5d2d7f){const _0xa75145=_0x92896e;show=![],await sendMessage(_0xa75145(0x25e)),await esperar(0xa),await sendMessage('f\x20=\x20open(\x27/confi.txt\x27,\x27w\x27)\x0d'),await esperar(0xa),await sendMessage(_0xa75145(0x250)+_0x5d2d7f+'\x27)\x0d'),await esperar(0xa),await sendMessage('f.close()\x0d'),await esperar(0x64),show=!![];}async function open_program(_0x275e9e){const _0x1dca53=_0x92896e;showLoadingOverlay();if(confirm('⚠️\x20Se\x20borrarán\x20los\x20cambios\x20no\x20guardados.\x0a¿Deseas\x20continuar?')){console[_0x1dca53(0x25c)](_0x1dca53(0x21a));try{xml_from_device='',open_program_control=!![],await sendMessage(_0x1dca53(0x1f7)+_0x275e9e),await esperar(0x64),await esperarHastaOTimeout(()=>open_program_control==![]);const _0x3a5d42=xml_from_device[_0x1dca53(0x208)](_0x1dca53(0x1ef));_0x3a5d42!==-0x1&&(xml_from_device=xml_from_device['substring'](0x0,_0x3a5d42+0x6));workspace[_0x1dca53(0x1f9)]();const _0x4834b0=new DOMParser(),_0x1caf49=_0x4834b0[_0x1dca53(0x240)](xml_from_device,_0x1dca53(0x26b));Blockly[_0x1dca53(0x1e6)]['domToWorkspace'](_0x1caf49[_0x1dca53(0x238)],workspace);}catch(_0x3371ad){return logToTerminal(_0x3371ad),![];}}hideLoadingOverlay();}async function delete_program(_0x4419c8){const _0x521963=_0x92896e;showLoadingOverlay();try{await sendMessage(_0x521963(0x248)+_0x4419c8),await esperar(0x64),await sendMessage('[[memory]]'),await esperar(0x64),requiredFiles={},await sendMessage(_0x521963(0x223)),await esperar(0x64),fileArray[_0x521963(0x249)](_0x506121=>{requiredFiles[_0x506121]='#\x20Archivo\x20'+_0x506121+'\x0a';}),refreshFiles();}catch(_0x3fa23f){return logToTerminal(_0x3fa23f),![];}hideLoadingOverlay();}async function renombrar(_0x5a3a4f,_0x123669){const _0x472ac1=_0x92896e;showLoadingOverlay();try{await sendMessage(_0x472ac1(0x244)+_0x5a3a4f+','+_0x123669),await esperar(0x64),await sendMessage(_0x472ac1(0x26a)),await esperar(0x64),requiredFiles={},await sendMessage(_0x472ac1(0x223)),await esperar(0x64),fileArray[_0x472ac1(0x249)](_0x526d12=>{const _0x2e2737=_0x472ac1;requiredFiles[_0x526d12]=_0x2e2737(0x256)+_0x526d12+'\x0a';}),refreshFiles();}catch(_0x21bd90){return logToTerminal(_0x21bd90),![];}hideLoadingOverlay();}async function autoini(){showLoadingOverlay(),await sendMessage('[[AI]]'),await esperar(0x64),hideLoadingOverlay();}async function buttonini(_0x48b408){showLoadingOverlay(),await sendMessage('[[BI]]'),await esperar(0x64),hideLoadingOverlay();}async function noini(_0x58e847){const _0x362ad3=_0x92896e;showLoadingOverlay(),await sendMessage(_0x362ad3(0x21e)),await esperar(0x64),hideLoadingOverlay();}
