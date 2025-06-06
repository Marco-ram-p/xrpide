var memory_max;
var memory;
var fileArray = [];
var cambios = false;
var open_program_control = false;
var xml_from_device = "";

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
              if(text.includes("[memory]]")){
                let variables = text.split(",");
                memory_max = Number(variables[1]);
                memory = Number(variables[2]);
              }else if(text.includes("[files]]")){
                let variables = text.split(",");
                fileArray = variables.slice(1);
                fileArray = fileArray.filter(file => file !== "main.py");
                fileArray = fileArray.filter(file => file !== "Running.py");
                fileArray = fileArray.filter(file => file !== "confi.txt");
              }else if(text.includes("[rpd]]")){
                open_program_control = false;
              }else if(open_program_control){
                xml_from_device = xml_from_device + text;
              }else{
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

async function esperar(tiempo) {
  setTimeout(() => {
  }, tiempo); // milisegundos
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

function updateMemoryBar() {
    usedMemory = memory;
    let TOTAL_MEMORY = memory_max;
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
  let lines = code.split('\n');

  const xmlDom = Blockly.Xml.workspaceToDom(workspace);
  const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
  const xmlGuardado = xmlText;
  let xml_file = xmlGuardado.split('\n');

  try {
    await sendMessage("[[Save1]]");
    await esperar(100);
    await sendMessage(file_name);
    await esperar(100);
    await sendMessage("[[Save2]]");
    await esperar(100);
    for (const line of lines) {
      let encodedCode = JSON.stringify(line);
      await sendMessage(encodedCode);
      await esperar(100);
    }
    await sendMessage("[[END]]");
    await esperar(100);
    await sendMessage("[[Save3]]");
    await esperar(100);
    for(const xml_lines of xml_file){
      let encodedCode = JSON.stringify(xml_lines);
      encodedCode = encodedCode.replace(/\\"/g, "\"");
      await sendMessage(encodedCode);
      await esperar(100);
    }
    await sendMessage("[[END]]");
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
  return true;
}

async function ejecutar() {
  if (cambios==true){
    await save_code();
  }
  await sendMessage("[[RUN]]");
  await esperar(100);
}

async function detener() {
  await sendMessage("[[STOP]]");
  await esperar(100);
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

async function subir_archivos(file,name) {
  let file_lines = file.split('\n');
  await sendMessage("[[RE]]");
  await esperar(100);
  await sendMessage("[[SA3]]," + name);
  await esperar(100);
  for (const line of file_lines) {
    let encodedCode = JSON.stringify(line);
    await sendMessage(encodedCode);
    await esperar(100);
  }
  await sendMessage("[[END]]");
  await esperar(100);
}
async function libs() {
  subir_archivos(bt_pestolink,"[[SA3]],lib/pestolink.py")
}