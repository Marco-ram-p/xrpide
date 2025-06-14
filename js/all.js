const workspace = Blockly.inject('blocklyDiv', {
    toolbox: document.getElementById('toolbox'),
    scrollbars: true,
    horizontalLayout: false,
    toolboxPosition: 'start',
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
      pinch: true
    }
  });
  var libraries = [
        {
            name: 'XRPLib',
            description: 'Biblioteca printcipal par el control de motores y sensores en placa XRP.',
            versions: ['_Beta06'],
            status: 'updated',
            installedVersion: '_Beta06'
        },
        {
            name: 'Fusalmo gamepad wifi',
            description: 'El xrp crea una red wifi para que al escribir una ip (por defecto 192.168.4.1) en el navegador se genere un gamepad virtual comunicado por esa red en el canal 1. Es nesesario apagar datos moviles para que funcione en un dispositivo movil',
            versions: ['1.0.0'],
            status: 'updated',
            installedVersion: '1.0.0'
        },
        {
            name: 'Pestolink',
            description: 'Biblioteca para controlar por bluetooth el xrp haciedo uso del gamepad. <a href="https://pestol.ink/" target="_blank">https://pestol.ink/</a>',
            versions: ['1.0.0'],
            status: 'updated',
            installedVersion: '1.0.0'
        }
        /*{
            name: 'motor_driver',
            description: 'Biblioteca para control de motores DC y paso a paso',
            versions: ['1.2.0', '1.1.0', '1.0.0'],
            status: 'updated',
            installedVersion: '1.2.0'
        },
        {
            name: 'sensor_utils',
            description: 'Utilidades para sensores analógicos y digitales',
            versions: ['2.1.0', '2.0.0', '1.9.5'],
            status: 'outdated',
            installedVersion: '1.9.5'
        },
        {
            name: 'display_lib',
            description: 'Control de pantallas LCD y OLED',
            versions: ['1.0.0', '0.9.0'],
            status: 'not-installed',
            installedVersion: null
        },
        {
            name: 'servo_control',
            description: 'Control avanzado de servomotores',
            versions: ['3.0.1', '3.0.0', '2.5.0'],
            status: 'updated',
            installedVersion: '3.0.1'
        },
        {
            name: 'wifi_manager',
            description: 'Gestor de conexiones WiFi',
            versions: ['1.5.0'],
            status: 'not-installed',
            installedVersion: null
        }*/
    ];
  const reservedNames = ['boot.py', 'main.py', 'lib.py', 'config.py', 'wifi.py'];
  const requiredFiles = {};

  const TOTAL_MEMORY = 2048;
  var usedMemory = 0;
  let selectedDevice = null;
  const mockDevices = [{
    id: 1,
    name: "Pico #1 (COM3)"
  }, {
    id: 2,
    name: "Pico #2 (COM4)"
  }, {
    id: 3,
    name: "Pico #3 (COM5)"
  }];
  let contextMenu = null;
  let isConnected = false;
  let isUploading = false;
  let editor;

  function toggleView(view) {
    const blocklyDiv = document.getElementById('blocklyDiv');
    const codeOutput = document.getElementById('codeOutput');
    if (view === 'blocks') {
      blocklyDiv.style.display = 'block';
      codeOutput.style.display = 'none';
    } else {
      if (!document.querySelector('.copy-btn')) {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copiar código';
        copyBtn.onclick = copyCodeToClipboard;
        codeOutput.appendChild(copyBtn);
      }
      editor = ace.edit("codeOutput");
      editor.setTheme("ace/theme/eclipse");
      editor.getSession().setMode("ace/mode/python");
      editor.setReadOnly(true);
      editor.setOptions({
        fontSize: "14px",
        showPrintMargin: false,
        highlightActiveLine: true,
        showGutter: true,
        highlightSelectedWord: true,
        showLineNumbers: true,
        displayIndentGuides: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        enableBasicAutocompletion: true
      });

      editor.container.style.fontFamily = "'Source Code Pro', 'Consolas', monospace";
      
      const customStyle = document.createElement('style');
      customStyle.textContent = `
        .ace-eclipse .ace_keyword { color: #7F0055 !important; font-weight: bold; }
        .ace-eclipse .ace_string { color: #2A00FF !important; }
        .ace-eclipse .ace_constant { color: #5500AA !important; }
        .ace-eclipse .ace_function { color: #2A7AB0 !important; }
        .ace-eclipse .ace_comment { color: #3F7F5F !important; font-style: italic; }
        .ace-eclipse .ace_numeric { color: #5500AA !important; }
        .ace-eclipse .ace_operator { color: #000000 !important; }
        .ace-eclipse .ace_identifier { color: #000000 !important; }
        .ace-eclipse { background-color: #FFFFFF !important; }
        .ace-eclipse .ace_gutter { background: #EEEEEE !important; color: #333333 !important; }
        .ace-eclipse .ace_print-margin { background: #EEEEEE !important; }
        .ace-eclipse .ace_cursor { color: #000000 !important; }
        .ace-eclipse .ace_marker-layer .ace_selection { background: #BAD6FD !important; }
        .ace-eclipse .ace_marker-layer .ace_bracket { border: 1px solid #000000 !important; }
      `;
      document.head.appendChild(customStyle);

      blocklyDiv.style.display = 'none';
      codeOutput.style.display = 'block';
      showCode();
    }
  }

  function showCode() {
    const code = Blockly.Python.workspaceToCode(workspace);
    if (editor) {
      editor.setValue(code);
      editor.clearSelection();
    }
  }

  function updateUIState() {
    const isRunning = isUploading;
    const isDevConnected = isConnected;

    // Menu items that depend on connection and running state
    const dependentItems = [
        document.getElementById('save-robot-btn'),
        document.getElementById('config-robot-btn'),
        document.getElementById('update-libraries-btn')
    ];
    dependentItems.forEach(item => {
        if (item) {
            if (item.id === 'config-robot-btn' || item.id === 'update-libraries-btn') {
                item.classList.toggle('disabled', isRunning);
            } else {
                item.classList.toggle('disabled', !isDevConnected || isRunning);
            }
        }
    });

    // File list, depends only on running state
    const fileList = document.getElementById('fileList');
    if (fileList) {
        fileList.classList.toggle('disabled', isRunning);
    }
  }

  function toggleUIForUpload(isUploading) {
    const saveRobotBtn = document.getElementById('save-robot-btn');
    const fileList = document.getElementById('fileList');

    const elements = [saveRobotBtn];

    elements.forEach(el => {
      if(el) el.classList.toggle('disabled', isUploading);
    });

    if (fileList) {
        fileList.classList.toggle('disabled', isUploading);
    }
  }

  async function uploadToDevice() {
    const fileName = document.getElementById('fileName').value;
    if (!fileName) {
      logToTerminal('Error: Por favor, ingresa un nombre para el archivo');
      alert('Por favor, ingresa un nombre para el archivo');
      return;
    }
    if (reservedNames.includes(fileName)) {
      logToTerminal('Error: Este nombre está reservado. Por favor, elige otro nombre.');
      return;
    }
    const uploadBtn = document.querySelector('.button[onclick="uploadToDevice()"]');
    if (isUploading) {
      isUploading = false;
      logToTerminal('Deteniendo el programa...');
      
      // Immediately reset UI to non-uploading state
      updateUIState();
      uploadBtn.textContent = 'Iniciar programa';
      uploadBtn.classList.remove('uploading');
      hideLoadingOverlay();
      detener();
      
      return;
    }

    isUploading = true;
    updateUIState();
    uploadBtn.textContent = 'Detener';
    uploadBtn.classList.add('uploading');
    const code = Blockly.Python.workspaceToCode(workspace);
    showLoadingOverlay();

    try {
      logToTerminal('Subiendo código al dispositivo...');
      await ejecutar();
      if (!isUploading) { // Check for cancellation that might have happened during the await
        logToTerminal('Ejecución interrumpida por el usuario.');
        // The UI reset is handled by the "stop" part of the function, which was already called.
        // So we just need to exit.
        return;
      }

      console.log(code);
      logToTerminal('Archivo cargado exitosamente. El programa está en ejecución.');
      hideLoadingOverlay();
      refreshFiles();
    } catch (error) {
      logToTerminal('Error al cargar el archivo: ' + error.message);
      // If an error occurs, reset the state.
      isUploading = false;
      updateUIState();
      uploadBtn.textContent = 'Iniciar programa';
      uploadBtn.classList.remove('uploading');
      hideLoadingOverlay();
    }
  }

  function showDeviceSelectionModal(callingFunction = 'uploadToDevice') {
    const modal = document.querySelector('.device-selection-modal');
    const deviceList = document.getElementById('deviceList');
    deviceList.innerHTML = '';
    deviceList.setAttribute('data-calling-function', callingFunction);
    mockDevices.forEach(device => {
      const deviceEl = document.createElement('div');
      deviceEl.className = 'device-item';
      deviceEl.textContent = device.name;
      deviceEl.onclick = () => selectDevice(device, deviceEl);
      deviceList.appendChild(deviceEl);
    });
    modal.style.display = 'flex';
  }

  function selectDevice(device, element) {
    document.querySelectorAll('.device-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    selectedDevice = device;
  }

  function cancelDeviceSelection() {
    const modal = document.querySelector('.device-selection-modal');
    modal.style.display = 'none';
    selectedDevice = null;
  }

  async function confirmDeviceSelection() {
    if (!selectedDevice) {
      logToTerminal('Error: Por favor seleccione un dispositivo');
      return;
    }
    const modal = document.querySelector('.device-selection-modal');
    modal.style.display = 'none';
    const callingFunctionEl = document.querySelector('[data-calling-function]');
    const callingFunction = callingFunctionEl ? callingFunctionEl.dataset.callingFunction : null;
    if (callingFunction === 'uploadToDevice') {
      const code = Blockly.Python.workspaceToCode(workspace);
      showLoadingOverlay();
      logToTerminal(`Subiendo al dispositivo ${selectedDevice.name}...`);
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(code);
        logToTerminal('Archivo cargado exitosamente');
        hideLoadingOverlay();
        refreshFiles();
      } catch (error) {
        logToTerminal('Error al cargar el archivo: ' + error.message);
        hideLoadingOverlay();
      }
    } else if (callingFunction === 'installAllLibraries') {
      await installAllLibraries();
    } else if (callingFunction === 'installUsedLibraries') {
      await installUsedLibraries();
    } else if (callingFunction === 'saveToRobot') {
      showLoadingOverlay();
      logToTerminal('Guardando programa en robot...');
      try {
          const xmlDom = Blockly.Xml.workspaceToDom(workspace);
          const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
          console.log("Saving to robot:", xmlText);
          logToTerminal('Programa guardado exitosamente en el robot');
      } catch (error) {
          logToTerminal('Error al guardar en el robot: ' + error.message);
      } finally {
          hideLoadingOverlay();
      }
    }
    selectedDevice = null;
  }

  function refreshFiles() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    if (!isConnected) {
      document.getElementById('fileList').classList.add('hideOnDisconnected');
      document.getElementById('memoryFill').parentElement.style.opacity = '0.5';
      document.getElementById('memoryText').style.opacity = '0.5';
      document.getElementById('memoryText').textContent = '0 KB / 0 KB';
      document.getElementById('memoryFill').style.width = '0%';
      return;
    } else {
      document.getElementById('fileList').classList.remove('hideOnDisconnected');
      document.getElementById('memoryFill').parentElement.style.opacity = '1';
      document.getElementById('memoryText').style.opacity = '1';
    }


    Object.keys(requiredFiles).forEach(file => {
      const div = document.createElement('div');
      div.className = 'file-item';
      div.innerHTML = `
        <span>${file}</span>
        <span class="delete-btn" onclick="deleteFile('${file}')">&times;</span>
      `;
      div.addEventListener('contextmenu', e => showContextMenu(e, file));
      div.addEventListener('dblclick', () => openFile(file));
      fileList.appendChild(div);
    });

  }

  function deleteFile(fileName) {
    if (isUploading) {
        logToTerminal('Error: No se puede eliminar un archivo mientras un programa está en ejecución.');
        alert('No se puede eliminar un archivo mientras un programa está en ejecución.');
        return;
    }
    if (contextMenu) contextMenu.style.display = 'none';
    
    if (reservedNames.includes(fileName)) {
      alert('No se pueden eliminar archivos del sistema');
      logToTerminal('Error: No se pueden eliminar archivos del sistema');
      return;
    }

    if (confirm(`¿Está seguro de eliminar ${fileName}?`)) {
      console.log(`Eliminando ${fileName}...`);
      refreshFiles();
    }
  }

  function openFile(fileName) {
    if (isUploading) {
      logToTerminal('Error: No se puede abrir un archivo mientras el programa está en ejecución.');
      alert('No se puede abrir un archivo mientras el programa está en ejecución.');
      return;
    }
    if (contextMenu) contextMenu.style.display = 'none';
    logToTerminal(`Abriendo archivo: ${fileName} (funcionalidad no implementada)`);
    // This is where you would load the file content into the workspace
  }

  function clearTerminal() {
    const terminal = document.getElementById('terminal');
    while(terminal.firstChild) {
      terminal.removeChild(terminal.firstChild);
    }
  }

  function logToTerminal(message) {
    const terminal = document.getElementById('terminal');
    const timestamp = new Date().toLocaleTimeString();
    
    // Create new message div
    const msgDiv = document.createElement('div');
    msgDiv.textContent = `> [${timestamp}] ${message}`;

    // Add the new message
    terminal.appendChild(msgDiv);

    // Check number of lines and remove excess from top
    while(terminal.children.length > 400) {
      terminal.removeChild(terminal.firstChild);
    }

    // Scroll to bottom
    terminal.scrollTop = terminal.scrollHeight;
  }

  function initializeTerminal() {
    clearTerminal();
    const msgDiv = document.createElement('div');
    msgDiv.textContent = '> Terminal lista para mostrar mensajes...';
    document.getElementById('terminal').appendChild(msgDiv);
    logToTerminal('Sistema iniciado');
  }

  function newBlockCode() {
    if (confirm('¿Desea crear un nuevo código? Se perderán los cambios no guardados.')) {
      workspace.clear();
      localStorage.removeItem('workspaceXml');
      localStorage.removeItem('programName');
      document.getElementById('fileName').value = 'Programa1';
      logToTerminal('Iniciando nuevo código de bloques...');
    }
  }

  function loadExample(exampleName) {
    if (isUploading) {
      logToTerminal('Error: No se puede cargar un ejemplo mientras un programa está en ejecución.');
      alert('No se puede cargar un ejemplo mientras un programa está en ejecución.');
      return;
    }
    if (confirm('¿Desea cargar el ejemplo? Se perderán los cambios no guardados.')) {
        let exampleXml = '';
        
        switch(exampleName) {
            case 'btpl':
                exampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
                  <block type="pestolink_start" id="ElwN{H?Z22)^9JS%1sy2" x="114" y="5">
                    <value name="NAME">
                      <shadow type="text" id="nJ5aKyJlmk+}DQ./0r0:">
                        <field name="TEXT">MiRobot</field>
                      </shadow>
                    </value>
                    <next>
                      <block type="controls_whileUntil" id="t-uq_o5?h?t7Kp_c)2}h">
                        <field name="MODE">WHILE</field>
                        <value name="BOOL">
                          <shadow type="logic_boolean" id="ws(/c.-BzCJ7aE:8xTJQ">
                            <field name="BOOL">TRUE</field>
                          </shadow>
                        </value>
                        <statement name="DO">
                          <block type="controls_if" id="u/b$ZkKcKO8.)Y1A,rw?">
                            <value name="IF0">
                              <block type="pl_conected" id="W$c-##L/fK_c0_SgRF\`:"></block>
                            </value>
                            <statement name="DO0">
                              <block type="comentario" id="V%TIojW!61s*uyi\`yt5u">
                                <field name="NAME">Controlar el xrp con el joystick</field>
                                <next>
                                  <block type="controls_if" id="2/{|nKThe[yi/}E,iM0N">
                                    <mutation else="1"></mutation>
                                    <value name="IF0">
                                      <block type="logic_compare" id="tQN!Ew}F\`z7pTkSJNZ3Z">
                                        <field name="OP">GTE</field>
                                        <value name="A">
                                          <block type="joy2" id="k]yy$4]rCF{1+zs7a^4v"></block>
                                        </value>
                                        <value name="B">
                                          <block type="math_number" id="%Ityhw9@^jnOQJ]P;J@6">
                                            <field name="NUM">0</field>
                                          </block>
                                        </value>
                                      </block>
                                    </value>
                                    <statement name="DO0">
                                      <block type="avanzar_giro" id="o8lyFty@9b_V1r|SK5J/">
                                        <value name="vel">
                                          <shadow type="math_number" id="G~Mee@S(#k}\`E{|GR{bh">
                                            <field name="NUM">0.5</field>
                                          </shadow>
                                          <block type="joy2" id="eXK3YAO?*!TG]!eHU|2H"></block>
                                        </value>
                                        <value name="dir">
                                          <shadow type="math_number" id="bqC?FM]Zdbscw5!980?X">
                                            <field name="NUM">0.5</field>
                                          </shadow>
                                          <block type="math_arithmetic" id="Uf6NH5AdK}F#5KNWKMkV">
                                            <field name="OP">MULTIPLY</field>
                                            <value name="A">
                                              <shadow type="math_number" id="V|X7C_8K)v5Wo)d:O=B0">
                                                <field name="NUM">0</field>
                                              </shadow>
                                              <block type="joy1" id="CFVhvE\`+11yenRc@!q-1"></block>
                                            </value>
                                            <value name="B">
                                              <shadow type="math_number" id="%SDSQU\`%|JZJ-*E]a);n">
                                                <field name="NUM">-1</field>
                                              </shadow>
                                            </value>
                                          </block>
                                        </value>
                                      </block>
                                    </statement>
                                    <statement name="ELSE">
                                      <block type="avanzar_giro" id="aQWRgxb\`@2c5WOcapIvp">
                                        <value name="vel">
                                          <shadow type="math_number" id="G~Mee@S(#k}\`E{|GR{bh">
                                            <field name="NUM">0.5</field>
                                          </shadow>
                                          <block type="joy2" id="aZ4c6;GVj22G!z0.^[,p"></block>
                                        </value>
                                        <value name="dir">
                                          <shadow type="math_number" id="bqC?FM]Zdbscw5!980?X">
                                            <field name="NUM">0.5</field>
                                          </shadow>
                                          <block type="joy1" id="ME[fj{|5Hj^U4R#1n*.x"></block>
                                        </value>
                                      </block>
                                    </statement>
                                    <next>
                                      <block type="controls_if" id=".VTK[*LG2b/|b#|pf{\`b">
                                        <mutation else="1"></mutation>
                                        <value name="IF0">
                                          <block type="B0" id="H*omVs/$DToEiJwA80mO"></block>
                                        </value>
                                        <statement name="DO0">
                                          <block type="comentario" id="K|Zp%2Lyh9Gd3HiTJ4mr">
                                            <field name="NAME">Que hacer cuando se presiona el botón 0 </field>
                                          </block>
                                        </statement>
                                        <statement name="ELSE">
                                          <block type="comentario" id="AnWFGEnOq1$!q4wuNB,E">
                                            <field name="NAME">Que hacer cuando se suelta el botón 0 </field>
                                          </block>
                                        </statement>
                                        <next>
                                          <block type="mostrar_link" id="9G1b-NKYF,e{@{5yG4kc">
                                            <value name="valor">
                                              <block type="Voltaje" id="8sFh/@wfZjd3BN0@Ta}C"></block>
                                            </value>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </statement>
                          </block>
                        </statement>
                      </block>
                    </next>
                  </block>
                </xml>`;
                break;
              case 'wgpad':
                exampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
                  <block type="wifi_confi" id="n^?/,Zv]bAcAuwKj}H=(" x="56" y="5">
                    <field name="name">XRP_Server</field>
                    <field name="pass">12345678</field>
                    <field name="dvs">1</field>
                    <next>
                      <block type="controls_whileUntil" id="#a1QUKBr8:DxPzpo2LnX">
                        <field name="MODE">WHILE</field>
                        <value name="BOOL">
                          <shadow type="logic_boolean" id="AKNTont%gGqtH9??y3sc">
                            <field name="BOOL">TRUE</field>
                          </shadow>
                        </value>
                        <statement name="DO">
                          <block type="leer" id="93JcgQGkPlt$.tFt%S(T">
                            <next>
                              <block type="hace" id="SqrrS!;LR4QH3I*nslV^">
                                <field name="btn">up</field>
                                <field name="action">P</field>
                                <statement name="NAME">
                                  <block type="set_effort" id="Uyez1}O5_[PvW?}m3fcO">
                                    <value name="izq">
                                      <shadow type="math_number" id="rd9sbj3yKWngIr-5z|nu">
                                        <field name="NUM">0.5</field>
                                      </shadow>
                                    </value>
                                    <value name="der">
                                      <shadow type="math_number" id="ApVv@4e-4-0kfg|)xjQ*">
                                        <field name="NUM">0.5</field>
                                      </shadow>
                                    </value>
                                  </block>
                                </statement>
                                <next>
                                  <block type="hace" id="JP,|h/JP#~W1+6uIH{^D">
                                    <field name="btn">up</field>
                                    <field name="action">R</field>
                                    <statement name="NAME">
                                      <block type="set_effort" id="CQs~Ie,d6f(-T6|$jPvE">
                                        <value name="izq">
                                          <shadow type="math_number" id="FZ6,glYvDmTI}9E1Om:g">
                                            <field name="NUM">0</field>
                                          </shadow>
                                        </value>
                                        <value name="der">
                                          <shadow type="math_number" id="nzcITP;ML8Sev{Tq!B$L">
                                            <field name="NUM">0</field>
                                          </shadow>
                                        </value>
                                      </block>
                                    </statement>
                                    <next>
                                      <block type="hace" id="uWbqshM%PW2F!6-3pNRV">
                                        <field name="btn">left</field>
                                        <field name="action">P</field>
                                        <statement name="NAME">
                                          <block type="set_effort" id="zQ.@gMt5,n}Tj.-6b6g~">
                                            <value name="izq">
                                              <shadow type="math_number" id="IXv=4UCE{9vHUX8FZ5bL">
                                                <field name="NUM">-0.5</field>
                                              </shadow>
                                            </value>
                                            <value name="der">
                                              <shadow type="math_number" id="fN]EviCmJ(Fndw._V$Q4">
                                                <field name="NUM">0.5</field>
                                              </shadow>
                                            </value>
                                          </block>
                                        </statement>
                                        <next>
                                          <block type="hace" id="xO3+ml+1spXdlOWG!1$r">
                                            <field name="btn">left</field>
                                            <field name="action">R</field>
                                            <statement name="NAME">
                                              <block type="set_effort" id="6ZzV8o$8W3fs*yfPT,~^">
                                                <value name="izq">
                                                  <shadow type="math_number" id="/lZ,3{]!\`e%XUN$(8?E=">
                                                    <field name="NUM">0</field>
                                                  </shadow>
                                                </value>
                                                <value name="der">
                                                  <shadow type="math_number" id="U~fiS*7Z@}ju2B@g.2Zl">
                                                    <field name="NUM">0</field>
                                                  </shadow>
                                                </value>
                                              </block>
                                            </statement>
                                            <next>
                                              <block type="hace" id="V}{886c1*VG{+@YTrk5S">
                                                <field name="btn">right</field>
                                                <field name="action">P</field>
                                                <statement name="NAME">
                                                  <block type="set_effort" id="GEWVW.|g8\`VkO$$AA=Fz">
                                                    <value name="izq">
                                                      <shadow type="math_number" id="J=Id#gf59rowBesQ)PK2">
                                                        <field name="NUM">0.5</field>
                                                      </shadow>
                                                    </value>
                                                    <value name="der">
                                                      <shadow type="math_number" id="Ex,kw-RAo)5Vg|JNhc}j">
                                                        <field name="NUM">-0.5</field>
                                                      </shadow>
                                                    </value>
                                                  </block>
                                                </statement>
                                                <next>
                                                  <block type="hace" id="/^vC@%m(i01),.vN5MFj">
                                                    <field name="btn">right</field>
                                                    <field name="action">R</field>
                                                    <statement name="NAME">
                                                      <block type="set_effort" id="K}P=[ki3_}!pxGdcS~;$">
                                                        <value name="izq">
                                                          <shadow type="math_number" id="p:Ors{v:(!F[928%yiQ|">
                                                            <field name="NUM">0</field>
                                                          </shadow>
                                                        </value>
                                                        <value name="der">
                                                          <shadow type="math_number" id="Igr0miB^|fs.euMv~,Bx">
                                                            <field name="NUM">0</field>
                                                          </shadow>
                                                        </value>
                                                      </block>
                                                    </statement>
                                                    <next>
                                                      <block type="hace" id="Eu/I8wG0JhD0w+}$5!NO">
                                                        <field name="btn">down</field>
                                                        <field name="action">P</field>
                                                        <statement name="NAME">
                                                          <block type="set_effort" id="t^kIT2N[{9qUMid+an@V">
                                                            <value name="izq">
                                                              <shadow type="math_number" id="LnXNc\`y!?gj]dcjLX?$6">
                                                                <field name="NUM">-0.5</field>
                                                              </shadow>
                                                            </value>
                                                            <value name="der">
                                                              <shadow type="math_number" id="\`lcfedo,t-h|Y}f?pr4b">
                                                                <field name="NUM">-0.5</field>
                                                              </shadow>
                                                            </value>
                                                          </block>
                                                        </statement>
                                                      </block>
                                                    </next>
                                                  </block>
                                                </next>
                                              </block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </statement>
                      </block>
                    </next>
                  </block>
                </xml>`
              break;
            // Add other examples here with their corresponding XML
            default:
                logToTerminal('Ejemplo no encontrado');
                return;
        }
        
        workspace.clear();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(exampleXml, 'text/xml');
        Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);
        
        // Update filename to match example
        document.getElementById('fileName').value = `ejemplo_${exampleName}`;
        
        logToTerminal(`Ejemplo "${exampleName}" cargado exitosamente`);
        
        // Save to localStorage
        localStorage.setItem('workspaceXml', exampleXml);
        localStorage.setItem('programName', `ejemplo_${exampleName}`);
    }
  }

  function newPythonCode() {
    logToTerminal('Iniciando nuevo código MicroPython...');
  }

  function openFromPC() {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.Fblocks';
    
    input.onchange = e => {
      const file = e.target.files[0];
      
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = e => {
        try {
          // Clear workspace
          workspace.clear();
          
          // Load new blocks
          const xml = e.target.result;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xml, 'text/xml');
          Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);
          
          // Update filename without extension
          const newFileName = file.name.replace('.Fblocks', '');
          document.getElementById('fileName').value = newFileName;
          
          logToTerminal(`Archivo ${file.name} cargado exitosamente`);
        } catch(err) {
          console.error('Error al cargar el archivo:', err);
          logToTerminal('Error al cargar el archivo: Formato inválido');
          alert('Error al cargar el archivo: El archivo no tiene el formato correcto de bloques');
          workspace.clear();
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  function saveToPC() {
    // Get the workspace XML
    const xmlDom = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    
    // Create file name based on current program name
    const fileName = document.getElementById('fileName').value || 'Programa';
    
    // Create blob and download link
    const blob = new Blob([xmlText], {type: 'text/plain'});
    const a = document.createElement('a');
    a.download = `${fileName}.Fblocks`;
    a.href = window.URL.createObjectURL(blob);
    a.click();
    
    logToTerminal('Guardando archivo en PC...');
  }

  function saveAndClose() {
    logToTerminal('Guardando y cerrando...');
  }

  function closeWithoutSaving() {
    logToTerminal('Cerrando sin guardar...');
  }

  async function installAllLibraries() {
    showLoadingOverlay();
    logToTerminal('Instalando todas las librerías...');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      logToTerminal('Todas las librerías instaladas exitosamente');
    } catch (error) {
      logToTerminal('Error al instalar las librerías: ' + error.message);
    } finally {
      hideLoadingOverlay();
    }
  }

  async function installUsedLibraries() {
    showLoadingOverlay();
    logToTerminal('Instalando librerías en uso...');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      logToTerminal('Librerías en uso instaladas exitosamente');
    } catch (error) {
      logToTerminal('Error al instalar las librerías: ' + error.message);
    } finally {
      hideLoadingOverlay();
    }
  }

  async function reinstallLibrary(name) {
    const selectEl = document.getElementById(`version-select-${name}`);
    const version = selectEl.value;
    showLoadingOverlay();
    logToTerminal(`Reinstalando biblioteca ${name} v${version}...`);
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        logToTerminal(`Biblioteca ${name} v${version} reinstalada exitosamente`);
        loadLibraries(); // Refresh the list
    } catch (error) {
        logToTerminal(`Error al reinstalar la biblioteca ${name}: ${error.message}`);
    } finally {
        hideLoadingOverlay();
    }
  }

  function showContextMenu(e, fileName) {
    e.preventDefault();
    if (contextMenu) {
      document.body.removeChild(contextMenu);
    }
    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-item" onclick="openFile('${fileName}')">Abrir</div>
      <div class="context-menu-item" onclick="renameFile('${fileName}')">Renombrar</div>
      <div class="context-menu-item" onclick="deleteFile('${fileName}')">Borrar</div>
    `;
    contextMenu.style.left = e.pageX + 'px';
    contextMenu.style.top = e.pageY + 'px';
    contextMenu.style.display = 'block';
    document.body.appendChild(contextMenu);
  }

  document.addEventListener('click', e => {
    if (contextMenu && !contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
    }
  });

  function renameFile(fileName) {
    const newName = prompt('Ingrese nuevo nombre:', fileName);
    if (newName && newName !== fileName) {
      if (/main/i.test(newName)) {
        alert('No se permite usar "main" en el nombre del archivo');
        logToTerminal('Error: No se permite usar "main" en el nombre del programa');  
      }
      logToTerminal(`Renombrando ${fileName} a ${newName}`);
      refreshFiles();
    }
    if (contextMenu) contextMenu.style.display = 'none';
  }

  function toggleUSBConnection() {
    const usbBtn = document.getElementById('connectUSBButton');
    const btBtn = document.getElementById('connectBTButton');
    const uploadBtn = document.querySelector('.button[onclick="uploadToDevice()"]');
    
    if (usbBtn.classList.contains('disconnected')) {
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
      refreshFiles();
    } else {
      usbBtn.classList.add('disconnected');
      usbBtn.textContent = 'Desconectar USB';
      btBtn.disabled = true;
      btBtn.style.opacity = '0.5';
      isConnected = true;
      uploadBtn.classList.remove('disabled');
      uploadBtn.disabled = false;
      refreshFiles();
    }
    updateUIState();
  }

  function toggleBTConnection() {
    const btBtn = document.getElementById('connectBTButton');
    const usbBtn = document.getElementById('connectUSBButton');
    const uploadBtn = document.querySelector('.button[onclick="uploadToDevice()"]');
    
    if (btBtn.classList.contains('disconnected')) {
      btBtn.classList.remove('disconnected');
      btBtn.textContent = 'Conectar por Bluetooth';
      usbBtn.disabled = false;
      usbBtn.style.opacity = '1';
      isConnected = false;
      uploadBtn.classList.add('disabled');
      uploadBtn.disabled = true;
      if (isUploading) {
        isUploading = false;
        uploadBtn.textContent = 'Iniciar programa';
        uploadBtn.classList.remove('uploading');
      }
      refreshFiles();
    } else {
      btBtn.classList.add('disconnected');
      btBtn.textContent = 'Desconectar BT';
      usbBtn.disabled = true;
      usbBtn.style.opacity = '0.5';
      isConnected = true;
      uploadBtn.classList.remove('disabled');
      uploadBtn.disabled = false;
      refreshFiles();
    }
    updateUIState();
  }

  function formatCode() {
    logToTerminal('Formateando código...');
  }

  function showKeyboardShortcuts() {
    logToTerminal('Mostrando atajos de teclado...');
  }

  function showSettings() {
    logToTerminal('Abriendo configuración...');
  }

  function closeVirtualGamepad() {
    document.querySelector('.gamepad-modal').style.display = 'none';
    logToTerminal('Gamepad virtual cerrado');
  }

  function toggleFullscreen() {
    const modal = document.querySelector('.gamepad-modal');
    modal.classList.toggle('fullscreen');
    const btn = document.querySelector('.fullscreen-btn');
    btn.textContent = modal.classList.contains('fullscreen') ? '⮌' : '⛶';
    
    if (modal.classList.contains('fullscreen')) {
      logToTerminal('Gamepad virtual en pantalla completa');
    } else {
      logToTerminal('Gamepad virtual en modo ventana');
    }
  }

  function toggleTheme() {
    const modalContent = document.querySelector('.gamepad-modal .modal-content');
    modalContent.classList.toggle('light-theme');
    const themeBtn = document.querySelector('.theme-btn');
    const display = document.querySelector('.gamepad-display');
    display.classList.toggle('light-theme');
    
    if (modalContent.classList.contains('light-theme')) {
      logToTerminal('Gamepad virtual: Modo claro activado');
    } else {
      logToTerminal('Gamepad virtual: Modo oscuro activado');
    }
  }

  function openVirtualGamepad() {
    const btBtn = document.getElementById('connectBTButton');
    const usbBtn = document.getElementById('connectUSBButton');
    
    if (!btBtn.classList.contains('disconnected') && !usbBtn.classList.contains('disconnected')) {
      logToTerminal('Error: Debe conectarse por USB o Bluetooth primero para usar el gamepad virtual');
      alert('Debe conectarse por USB o Bluetooth primero para usar el gamepad virtual');
      return;
    }

    document.querySelector('.gamepad-modal').style.display = 'flex';
    logToTerminal('Gamepad virtual abierto');
  }

  function openKeyboardControl() {
    const btBtn = document.getElementById('connectBTButton');
    const usbBtn = document.getElementById('connectUSBButton');
    
    if (!btBtn.classList.contains('disconnected') && !usbBtn.classList.contains('disconnected')) {
      logToTerminal('Error: Debe conectarse por USB o Bluetooth primero para usar el control por teclado');
      alert('Debe conectarse por USB o Bluetooth primero para usar el control por teclado');
      return;
    }

    document.querySelector('.keyboard-modal').style.display = 'flex';
    logToTerminal('Control por teclado abierto'); 
    startKeyboardListener();
  }

  function toggleKeyboardFullscreen() {
    const modal = document.querySelector('.keyboard-modal');
    modal.classList.toggle('fullscreen');
    const btn = document.querySelector('.keyboard-modal .fullscreen-btn');
    btn.textContent = modal.classList.contains('fullscreen') ? '⮌' : '⛶';
    
    if (modal.classList.contains('fullscreen')) {
      logToTerminal('Control por teclado en pantalla completa');
    } else {
      logToTerminal('Control por teclado en modo ventana');
    }
  }

  function saveToRobot() {
    if (isUploading) {
        logToTerminal('Error: No se puede guardar en el robot mientras un programa está en ejecución.');
        alert('No se puede guardar en el robot mientras un programa está en ejecución.');
        return;
    }
    if (!isConnected) {
        logToTerminal('Error: Debe conectarse a un dispositivo primero');
        alert('Debe conectarse a un dispositivo primero');
        return;
    }
    showLoadingOverlay();
    logToTerminal('Guardando programa en robot...');
    try {
        const xmlDom = Blockly.Xml.workspaceToDom(workspace);
        const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
        console.log("Saving to robot:", xmlText);
        logToTerminal('Programa guardado exitosamente en el robot');
    } catch (error) {
        logToTerminal('Error al guardar en el robot: ' + error.message);
    } finally {
        hideLoadingOverlay();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.querySelector('.button[onclick="uploadToDevice()"]');
    const fileNameInput = document.getElementById('fileName');
    
    uploadBtn.classList.add('disabled');
    uploadBtn.disabled = true;

    fileNameInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
      value = value.slice(0, 10);
      value = value.replace(/main/i, '');
      e.target.value = value;
      
      if (/main/i.test(e.target.value)) {
        logToTerminal('Error: No se permite usar "main" en el nombre del programa');  
      }
      
      localStorage.setItem('programName', value);
    });

    const savedWorkspace = localStorage.getItem('workspaceXml');
    if (savedWorkspace) {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(savedWorkspace, 'text/xml');
        Blockly.Xml.domToWorkspace(xmlDoc.documentElement, workspace);
        logToTerminal('Programa anterior restaurado');
      } catch(err) {
        console.error('Error loading saved workspace:', err);
        logToTerminal('Error al cargar el programa guardado');
      }
    }

    const savedName = localStorage.getItem('programName');
    if (savedName) {
      fileNameInput.value = savedName;
    }

    workspace.addChangeListener(() => {
      const xmlDom = Blockly.Xml.workspaceToDom(workspace);
      const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
      localStorage.setItem('workspaceXml', xmlText);
    });

    refreshFiles();
    initializeTerminal();
    updateUIState();
  });

  function closeRobotConfig() {
    document.querySelector('.robot-config-modal').style.display = 'none';
    logToTerminal('Configuración del robot cancelada');
  }

  async function saveRobotConfig() {
    const selectedMethod = document.querySelector('input[name="startup"]:checked').value;
    //const btEnabled = document.getElementById('btEnabled').checked;
    //const btNameInput = document.getElementById('btName');
    //const btName = btNameInput.value.trim();

    /*if (btEnabled && !btName) {
      alert('El nombre del dispositivo Bluetooth no puede estar vacío si está activado.');
      logToTerminal('Error al guardar: El nombre del dispositivo Bluetooth no puede estar vacío.');
      btNameInput.focus();
      return;
    }*/
    closeRobotConfig();
    showLoadingOverlay();
    logToTerminal('Guardando configuración del robot...');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        let methodText;
        switch(selectedMethod) {
            case 'auto':
                methodText = '2';
                break;
            case 'button':
                methodText = '1';
                break;
            case 'pc':
                methodText = '0';
                break;
        }
        console.log(methodText);
        await guardar_confi(methodText);
        let seleccionado = document.querySelector('input[name="startup"]:checked');

    if (seleccionado) {
        alert("Opción seleccionada: " + seleccionado.value);
    } else {
        alert("Ninguna opción está seleccionada.");
    }
        
        logToTerminal(`Configuración guardada: Método de arranque - ${methodText}`);
        //logToTerminal(`Bluetooth ${btEnabled ? 'activado' : 'desactivado'}`);
        //if(btEnabled) {
        //    logToTerminal(`Nombre Bluetooth establecido: "${btName}"`);
        //}
        closeRobotConfig();
    } catch (error) {
        logToTerminal('Error al guardar la configuración: ' + error.message);
    } finally {
        hideLoadingOverlay();
    }
  }

  function toggleBluetooth(enabled) {
    const btNameInput = document.getElementById('btName');
    btNameInput.disabled = !enabled;
    if(enabled) {
        logToTerminal('Activando Bluetooth...');
    } else {
        logToTerminal('Desactivando Bluetooth...');
    }
  }

  function updateBluetoothName(name) {
    if(name.trim()) {
        logToTerminal(`Actualizando nombre Bluetooth a: ${name}`);
    }
  }


  function closeLibraryModal() {
    document.querySelector('.library-modal').style.display = 'none';
  }

  function loadLibraries() {

    const libraryList = document.querySelector('.library-list');
    libraryList.innerHTML = '';

    libraries.forEach(lib => {
        const item = document.createElement('div');
        item.className = 'library-item';
        const latestVersion = lib.versions[0];
        
        let versionInfo = `Última versión: v${latestVersion}`;
        if (lib.installedVersion) {
            versionInfo = `Instalado: v${lib.installedVersion} | Última: v${latestVersion}`;
        }

        let actionsHtml = '';

        if (lib.status === 'not-installed') {
            const options = lib.versions.map(v => `<option value="${v}">v${v}</option>`).join('');
            actionsHtml = `
                <select id="version-select-${lib.name}">${options}</select>
                <button class="library-btn install-btn" onclick="installLibrary('${lib.name}')">Instalar</button>
            `;
        } else if (lib.status === 'outdated') {
            const options = lib.versions.map(v => `<option value="${v}" ${v === lib.installedVersion ? 'selected' : ''}>v${v}</option>`).join('');
            actionsHtml = `
                <select id="version-select-${lib.name}">${options}</select>
                <button class="library-btn update-btn" onclick="updateLibrary('${lib.name}')">Actualizar</button>
                <button class="library-btn reinstall-btn" onclick="reinstallLibrary('${lib.name}')">Reinstalar</button>
                <button class="library-btn remove-btn" onclick="removeLibrary('${lib.name}')">Eliminar</button>
            `;
        } else { // updated
            const options = lib.versions.map(v => `<option value="${v}" ${v === lib.installedVersion ? 'selected' : ''}>v${v}</option>`).join('');
             actionsHtml = `
                <select id="version-select-${lib.name}">${options}</select>
                <button class="library-btn reinstall-btn" onclick="reinstallLibrary('${lib.name}')">Reinstalar</button>
                <button class="library-btn remove-btn" onclick="removeLibrary('${lib.name}')">Eliminar</button>
            `;
        }

        item.innerHTML = `
            <div class="library-info">
                <div class="library-name">${lib.name}</div>
                <div class="library-description">${lib.description}</div>
                <div class="library-version-info">${versionInfo}</div>
            </div>
            <div class="library-actions">
                ${actionsHtml}
            </div>
        `;
        
        libraryList.appendChild(item);
    });
  }


  async function updateLibrary(name) {
    const selectEl = document.getElementById(`version-select-${name}`);
    const version = selectEl.value;
    showLoadingOverlay();
    logToTerminal(`Actualizando biblioteca ${name} a v${version}...`);
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        logToTerminal(`Biblioteca ${name} actualizada a v${version} exitosamente`);
        loadLibraries(); // Refresh the list
    } catch (error) {
        logToTerminal(`Error al actualizar la biblioteca ${name}: ${error.message}`);
    } finally {
        hideLoadingOverlay();
    }
  }

  async function removeLibrary(name) {
    if (confirm(`¿Está seguro de eliminar la biblioteca ${name}?`)) {
        showLoadingOverlay();
        logToTerminal(`Eliminando biblioteca ${name}...`);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            logToTerminal(`Biblioteca ${name} eliminada exitosamente`);
            loadLibraries(); // Refresh the list
        } catch (error) {
            logToTerminal(`Error al eliminar la biblioteca ${name}: ${error.message}`);
        } finally {
            hideLoadingOverlay();
        }
    }
  }


  function showLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    overlay.style.display = 'flex';
  }

  function hideLoadingOverlay() {
    const overlay = document.querySelector('.loading-overlay');
    overlay.style.display = 'none';
  }

  function showHowToUpload() {
    document.querySelector('.help-modal').style.display = 'flex';
    logToTerminal('Mostrando ayuda de cómo grabar programa');
  }

  function closeHelpModal() {
    document.querySelector('.help-modal').style.display = 'none';
  }

  function copyCodeToClipboard() {
    const code = editor.getValue();
    navigator.clipboard.writeText(code).then(() => {
      const copyBtn = document.querySelector('.copy-btn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '¡Copiado!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
      logToTerminal('Código copiado al portapapeles');
    }).catch(err => {
      console.error('Error al copiar el código:', err);
      logToTerminal('Error al copiar el código al portapapeles');
    });
  }

  function closeKeyboardModal() {
    document.querySelector('.keyboard-modal').style.display = 'none';
    logToTerminal('Control por teclado cerrado');
    stopKeyboardListener();
  }

  let keyboardListenerActive = false;
  let pressedKeys = new Set();

  function startKeyboardListener() {
    keyboardListenerActive = true;
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('keyup', handleKeyRelease);
  }

  function stopKeyboardListener() {
    keyboardListenerActive = false;
    document.removeEventListener('keydown', handleKeyPress);
    document.removeEventListener('keyup', handleKeyRelease);
    pressedKeys.clear();
  }

  function handleKeyPress(e) {
    if (!keyboardListenerActive) return;
    
    if (pressedKeys.has(e.code)) return;
    
    pressedKeys.add(e.code);
    
    const keyInfo = document.querySelector('.key-info');
    const lastKey = document.querySelector('.last-key .key-value');
    const keyCode = document.querySelector('.key-code .key-value');

    keyInfo.textContent = e.key;
    lastKey.textContent = e.key;
    keyCode.textContent = e.keyCode;

    keyInfo.classList.remove('pressed-key');
    void keyInfo.offsetWidth; 
    keyInfo.classList.add('pressed-key');

    logToTerminal(`Tecla presionada: ${e.key} (código: ${e.keyCode})`);
  }

  function handleKeyRelease(e) {
    pressedKeys.delete(e.code);
    logToTerminal(`Tecla soltada: ${e.key} (código: -${e.keyCode})`);
    
    const keyInfo = document.querySelector('.key-info');
    keyInfo.textContent = 'Presiona cualquier tecla...';
    const lastKey = document.querySelector('.last-key .key-value');
    const keyCode = document.querySelector('.key-code .key-value');
    
    lastKey.textContent = 'Ninguna';
    keyCode.textContent = '-';
  }

  // Add Service Worker for offline functionality
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          logToTerminal('La aplicación ahora puede funcionar sin conexión.');
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
          logToTerminal('Error al habilitar el modo sin conexión.');
        });
    });
  }

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

//----------------bloques------------------------------------------------

//--------servos del xrp-------------

const servo_onboard = {
  init: function() {
    this.appendDummyInput('NAME')
      .appendField('Servo:')
      .appendField(new Blockly.FieldDropdown([
          ['1', '1'],
          ['2', '2']
        ]), 'servo');
    this.appendValueInput('val')
    .setCheck('Number')
      .appendField('Grados:');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Mueve un servomotor de 180° a la posición especificada');
    this.setHelpUrl('');
    this.setColour(30);
  }
};
Blockly.common.defineBlocks({servo_onboard: servo_onboard});
                    
                    
python.pythonGenerator.forBlock['servo_onboard'] = function(block) {
  const servo = block.getFieldValue('servo');
  const value = Blockly.Python.valueToCode(block, 'val', python.Order.ATOMIC);
  python.pythonGenerator.addImportWithPriority(lib["servo"],1);
  python.pythonGenerator.addImportWithPriority(`servo${servo} = Servo.get_default_servo(${servo})`,2);
  const code = `servo${servo}.set_angle(${value})\n`;
  return code;
}                     

  //---------variables de motor----------------
  const motor_var = {
    init: function() {
      this.appendDummyInput('in')
        .appendField('Motor:')
        .appendField(new Blockly.FieldDropdown([
            ['Izquierdo', '1'],
            ['Derecho', '2'],
            ['Motor 3', '3'],
            ['Motor 4', '4']
          ]), 'num')
        .appendField('Variable:')
        .appendField(new Blockly.FieldDropdown([
            ['Velocidad', 'speed'],
            ['Posición', 'position'],
            ['Cuenta de enconder', 'position_counts']
          ]), 'var');
      this.setOutput(true, null);
      this.setTooltip('Regresa la variable elegida para el motor elegido.');
      this.setHelpUrl('');
      this.setColour(15);
    }
  };
  Blockly.common.defineBlocks({motor_var: motor_var});
                    
  python.pythonGenerator.forBlock['motor_var'] = function(block) {
    const num = block.getFieldValue('num');
    const dropdown_var = block.getFieldValue('var');
    // Agregar el código preámbulo a la lista (se asegura de que sea único)
    python.pythonGenerator.addImportWithPriority(lib["motor"], 1);
    python.pythonGenerator.addImportWithPriority(`motor${num} = EncodedMotor.get_default_encoded_motor(${num})`, 2);
    const code = `motor${num}.get_${dropdown_var}()`;
    return [code, python.Order.NONE];
  }

//----------------- motor esfuerzo--------------------
const motor_esfuerzo = {
  init: function() {
    this.appendDummyInput('name')
      .appendField('Motor:')
      .appendField(new Blockly.FieldDropdown([
          ['Izquierdo', '1'],
          ['Derecho', '2'],
          ['Motor 3', '3'],
          ['Motor 4', '4']
        ]), 'motor')
      .appendField('Esfuerzo:');
    this.appendValueInput('esfuerzo')
    .setCheck('Number');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(30);
  }
};
Blockly.common.defineBlocks({motor_esfuerzo: motor_esfuerzo});
                    
python.pythonGenerator.forBlock['motor_esfuerzo'] = function(block) {
  const motor_num = block.getFieldValue('motor');
  const value_esfuerzo = Blockly.Python.valueToCode(block, 'esfuerzo', python.Order.ATOMIC);
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["motor"], 1);
  python.pythonGenerator.addImportWithPriority(`motor${motor_num} = EncodedMotor.get_default_encoded_motor(${motor_num})`, 2);
  const code = `motor${motor_num}.set_effort(${value_esfuerzo})\n`;
  return code;
}

// -------------motor velocidad rpm--------------
const motor_velocidad = {
  init: function() {
    this.appendDummyInput('name')
      .appendField('Motor:')
      .appendField(new Blockly.FieldDropdown([
          ['Izquierdo', '1'],
          ['Derecho', '2'],
          ['Motor 3', '3'],
          ['Motor 4', '4']
        ]), 'motor')
      .appendField('Velocidad:');
    this.appendValueInput('velocidad')
    .setCheck('Number');
    this.appendEndRowInput('NAME')
      .appendField('RPM');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(30);
  }
};
Blockly.common.defineBlocks({motor_velocidad: motor_velocidad});
                    
python.pythonGenerator.forBlock['motor_velocidad'] = function(block) {
  const dropdown_motor = block.getFieldValue('motor');
  const value_velocidad = Blockly.Python.valueToCode(block, 'velocidad', python.Order.ATOMIC);
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["motor"], 1);
  python.pythonGenerator.addImportWithPriority(`motor${dropdown_motor} = EncodedMotor.get_default_encoded_motor(${dropdown_motor})`, 2);
  const code = `motor${dropdown_motor}.set_speed(${value_velocidad})\n`;
  return code;
}
 
//-----------------motor reversa----------------
const motor_reversa = {
  init: function() {
    this.appendDummyInput('NAME')
      .appendField('Motor:')
      .appendField(new Blockly.FieldDropdown([
          ['Izquierdo', '1'],
          ['Derecho', '2'],
          ['Motor 3', '3'],
          ['Motor 4', '4']
        ]), 'motor')
      .appendField('Dirección: ')
      .appendField(new Blockly.FieldDropdown([
          ['Reversa', 'True'],
          ['Adelante', 'False']
        ]), 'direccion');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(30);
  }
};
Blockly.common.defineBlocks({motor_reversa: motor_reversa});
   
python.pythonGenerator.forBlock['motor_reversa'] = function(block) {
  const dropdown_motor = block.getFieldValue('motor');
  const dropdown_direccion = block.getFieldValue('direccion');
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["motor"], 1);
  python.pythonGenerator.addImportWithPriority(`motor${dropdown_motor} = EncodedMotor.get_default_encoded_motor(${dropdown_motor})`, 2);
  const code = `motor${dropdown_motor}._motor.flip_dir = (${dropdown_direccion})\n`;
  return code;
}

//----------------reset encoder--------------------
const reset_encoder = {
  init: function() {
    this.appendEndRowInput('NAME')
      .appendField('Motor')
      .appendField(new Blockly.FieldDropdown([
          ['Izquierdo', '1'],
          ['Derecho', '2'],
          ['Motor 3', '3'],
          ['Motor 4', '4']
        ]), 'NAME')
      .appendField('Reiniciar encoder');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(30);
  }
};
Blockly.common.defineBlocks({reset_encoder: reset_encoder});
                    
python.pythonGenerator.forBlock['reset_encoder'] = function(block) {
  const dropdown_name = block.getFieldValue('NAME');
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["motor"], 1);
  python.pythonGenerator.addImportWithPriority(`motor${dropdown_name} = EncodedMotor.get_default_encoded_motor(${dropdown_name})`, 2);
  const code = `motor${dropdown_name}.reset_encoder_position()\n`;
  return code;
}


//----------------avanzar---------------------

const avanzar = {
  init: function() {
    this.appendValueInput('distancia')
    .setCheck('Number')
      .appendField('Avanzar');
    this.appendValueInput('esfuerzo')
    .setCheck('Number')
      .appendField('cm    ')
      .appendField('Esfuerzo:');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(15);
  }
};
Blockly.common.defineBlocks({avanzar: avanzar});
                    
python.pythonGenerator.forBlock['avanzar'] = function(block) {
  const value_distancia = Blockly.Python.valueToCode(block, 'distancia', python.Order.ATOMIC);
  const value_esfuerzo = Blockly.Python.valueToCode(block, 'esfuerzo', python.Order.ATOMIC);
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["avanzar"], 1);
  python.pythonGenerator.addImportWithPriority(def["avanzar"], 2);

  const code = `differentialDrive.straight(${value_distancia}, ${value_esfuerzo})\n`;
  return code;
}

//-------------------girar---------------------

const girar = {
  init: function() {
    this.appendValueInput('grados')
    .setCheck('Number')
      .appendField('Girar:');
    this.appendValueInput('esfuerzo')
    .setCheck('Number')
      .appendField('Grados     ')
      .appendField('Esfuerzo:');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(15);
  }
};
Blockly.common.defineBlocks({girar: girar});
                    
python.pythonGenerator.forBlock['girar'] = function(block) {
  const value_grados = Blockly.Python.valueToCode(block, 'grados', python.Order.ATOMIC);
  const value_esfuerzo = Blockly.Python.valueToCode(block, 'esfuerzo', python.Order.ATOMIC);
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["avanzar"], 1);
  python.pythonGenerator.addImportWithPriority(def["avanzar"], 2);
  const code = `differentialDrive.turn(${value_grados}, ${value_esfuerzo})\n`;
  return code;
}

//-------------------set effort----------------

const set_effort = {
  init: function() {
    this.appendValueInput('izq')
    .setCheck('Number')
      .appendField('Establecer esfuerzo')
      .appendField(' Izquierdo:');
    this.appendValueInput('der')
    .setCheck('Number')
      .appendField('Derecho:');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(15);
  }
};
Blockly.common.defineBlocks({set_effort: set_effort});
                    
python.pythonGenerator.forBlock['set_effort'] = function(block) {
  const value_izq = Blockly.Python.valueToCode(block, 'izq', python.Order.ATOMIC);
  const value_der = Blockly.Python.valueToCode(block, 'der', python.Order.ATOMIC);
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["avanzar"], 1);
  python.pythonGenerator.addImportWithPriority(def["avanzar"], 2);
  const code = `differentialDrive.set_effort(${value_izq}, ${value_der})\n`;
  return code;
}

//----------------------------set speed----------------

const set_speed = {
  init: function() {
    this.appendValueInput('izq')
    .setCheck('Number')
      .appendField('Establecer velocidad')
      .appendField(' Izquierdo:');
    this.appendDummyInput('NAME')
      .appendField('cm/s   ');
    this.appendValueInput('der')
    .setCheck('Number')
      .appendField('Derecho:');
    this.appendDummyInput('NAME')
      .appendField('cm/s   ');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(15);
  }
};
Blockly.common.defineBlocks({set_speed: set_speed});
                    
python.pythonGenerator.forBlock['set_speed'] = function(block) {
  const value_izq = Blockly.Python.valueToCode(block, 'izq', python.Order.ATOMIC);
  const value_der = Blockly.Python.valueToCode(block, 'der', python.Order.ATOMIC);
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["avanzar"], 1);
  python.pythonGenerator.addImportWithPriority(def["avanzar"], 2);
  const code = `differentialDrive.set_speed(${value_izq}, ${value_der})\n`;
  return code;
}

//----------------------avanzar giro-----------------------
const avanzar_giro = {
  init: function() {
    this.appendValueInput('vel')
    .setCheck('Number')
      .appendField('Avanzar')
      .appendField('Velocidad:');
    this.appendValueInput('dir')
    .setCheck('Number')
      .appendField('Giro:');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Avanza en la dirección que se indique');
    this.setHelpUrl('');
    this.setColour(15);
  }
};
Blockly.common.defineBlocks({avanzar_giro: avanzar_giro});
                  
python.pythonGenerator.forBlock['avanzar_giro'] = function(block) {
  python.pythonGenerator.addImportWithPriority(lib["avanzar"], 1);
  python.pythonGenerator.addImportWithPriority(def["avanzar"], 2);
  // TODO: change Order.ATOMIC to the correct operator precedence strength
  const value_vel = Blockly.Python.valueToCode(block, 'vel', python.Order.ATOMIC);

  // TODO: change Order.ATOMIC to the correct operator precedence strength
  const value_dir = Blockly.Python.valueToCode(block, 'dir', python.Order.ATOMIC);

  // TODO: Assemble python into the code variable.
  const code = `differentialDrive.arcade(${value_vel}, ${value_dir})\n`;
  return code;
}
                    

//------------detener motores-------------------
const stop_motor = {
  init: function() {
    this.appendDummyInput('NAME')
      .appendField('Detener motores');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(15);
  }
};
Blockly.common.defineBlocks({stop_motor: stop_motor});
                    
python.pythonGenerator.forBlock['stop_motor'] = function() {
  python.pythonGenerator.addImportWithPriority(lib["avanzar"], 1);
  python.pythonGenerator.addImportWithPriority(def["avanzar"], 2);
  const code = 'differentialDrive.stop()\n';
  return code;
}

//------------------reset encoders

const reset_encoders = {
  init: function() {
    this.appendDummyInput('NAME')
      .appendField('Reiniciar encoders');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(15);
  }
};
Blockly.common.defineBlocks({reset_encoders: reset_encoders});
                    
python.pythonGenerator.forBlock['reset_encoders'] = function() {
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["avanzar"], 1);
  python.pythonGenerator.addImportWithPriority(def["avanzar"], 2);
  const code = 'differentialDrive.reset_encoder_position()\n';
  return code;
}

//-------------------encoder-------------------
const encoder = {
  init: function() {
    this.appendDummyInput('NAME')
      .appendField('Encoder')
      .appendField(new Blockly.FieldDropdown([
          ['Izquierdo', 'left'],
          ['Derecho', 'right']
        ]), 'NAME');
    this.setOutput(true, 'Number');
    this.setTooltip('');
    this.setHelpUrl('');
    this.setColour(15);
  }
};
Blockly.common.defineBlocks({encoder: encoder});
                    
python.pythonGenerator.forBlock['encoder'] = function(block){
  const dropdown_name = block.getFieldValue('NAME');
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["avanzar"], 1);
  python.pythonGenerator.addImportWithPriority(def["avanzar"], 2);
  const code = `differentialDrive.get_${dropdown_name}_encoder_position()`;
  return [code, python.Order.NONE];
}

  //Web Server
  var nextFunc = 0;
  function getFuncName(){
    nextFunc++;
    return "func" + nextFunc;
  }

//------------server foward------------------

const xrp_ws_forward_button = {
  init: function () {
    this.appendDummyInput()
      .appendField("Web forward button")
    this.appendStatementInput('func')
      .appendField('Function:');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190); // turquoise
    this.setTooltip("");
    this.setHelpUrl("");
  }
}
Blockly.common.defineBlocks({xrp_ws_forward_button: xrp_ws_forward_button});

python.pythonGenerator.forBlock['xrp_ws_forward_button'] = function(block){
  var func = Blockly.Python.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerForwardButton(${funcName})\n`
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["server"], 1);
  python.pythonGenerator.addImportWithPriority(def["server"], 2);
  return code;
}

//-------------server back-----------------
const xrp_ws_back_button = {
  init: function () {
    this.appendDummyInput()
      .appendField("Web back button")
    this.appendStatementInput('func')
      .appendField('Function:');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190); // turquoise
    this.setTooltip("");
    this.setHelpUrl("");
  }
}
Blockly.common.defineBlocks({xrp_ws_back_button: xrp_ws_back_button});

python.pythonGenerator.forBlock['xrp_ws_back_button'] = function(block){
  var func = Blockly.Python.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerBackwardButton(${funcName})\n`
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["server"], 1);
  python.pythonGenerator.addImportWithPriority(def["server"], 2);
  return code;
}

//----------------server left----------------------

const xrp_ws_left_button = {
  init: function () {
    this.appendDummyInput()
      .appendField("Web left button")
    this.appendStatementInput('func')
      .appendField('Function:'); this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190); // turquoise
    this.setTooltip("");
    this.setHelpUrl("");
  }
}
Blockly.common.defineBlocks({xrp_ws_left_button: xrp_ws_left_button});

python.pythonGenerator.forBlock['xrp_ws_left_button'] = function(block){
  var func = Blockly.Python.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerLeftButton(${funcName})\n`
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["server"], 1);
  python.pythonGenerator.addImportWithPriority(def["server"], 2);
  return code;
}

//--------------------server right---------------------

const xrp_ws_right_button = {
  init: function () {
    this.appendDummyInput()
      .appendField("Web right button")
    this.appendStatementInput('func')
      .appendField('Function:'); this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190); // turquoise
    this.setTooltip("");
    this.setHelpUrl("");
  }
}
Blockly.common.defineBlocks({xrp_ws_right_button: xrp_ws_right_button});

python.pythonGenerator.forBlock['xrp_ws_right_button'] = function(block){
  var func = Blockly.Python.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerRightButton(${funcName})\n`
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["server"], 1);
  python.pythonGenerator.addImportWithPriority(def["server"], 2);
  return code;
}

//----------------server stop-------------------

const xrp_ws_stop_button = {
  init: function () {
    this.appendDummyInput()
      .appendField("Web stop button")
    this.appendStatementInput('func')
      .appendField('Function:'); this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190); // turquoise
    this.setTooltip("");
    this.setHelpUrl("");
  }
}
Blockly.common.defineBlocks({xrp_ws_stop_button: xrp_ws_stop_button});

python.pythonGenerator.forBlock['xrp_ws_stop_button'] = function(block){
  var func = Blockly.Python.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.registerStopButton(${funcName})\n`
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["server"], 1);
  python.pythonGenerator.addImportWithPriority(def["server"], 2);
  return code;
}

//----------------add button--------------------
const xrp_ws_add_button = {
  init: function () {
    this.appendDummyInput()
      .appendField("Web add button  Name:")
      .appendField(new Blockly.FieldTextInput("name"), "TEXT")
    this.appendStatementInput('func')
      .appendField('Function:');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190); // turquoise
    this.setTooltip("");
    this.setHelpUrl("");
  }
}
Blockly.common.defineBlocks({xrp_ws_add_button: xrp_ws_add_button});

python.pythonGenerator.forBlock['xrp_ws_add_button'] = function(block){
  var name = block.getFieldValue("TEXT");
  var func = Blockly.Python.statementToCode(block, 'func');
  var funcName = getFuncName();
  var code = `\ndef ${funcName}():\n${func}\n`
  code += `webserver.add_button("${name}", ${funcName})\n`
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["server"], 1);
  python.pythonGenerator.addImportWithPriority(def["server"], 2);
  return code;
}

//----------------log data-----------------------------

const xrp_ws_log_data = {
  init: function () {
    this.appendDummyInput()
      .appendField("Web log data");
    this.appendValueInput("log_name")
      .appendField("Label:")
      .setCheck("String");
    this.appendValueInput("DATA")
      .appendField("Data:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190); // turquoise
    this.setTooltip("");
    this.setHelpUrl("");
  }
}
Blockly.common.defineBlocks({xrp_ws_log_data: xrp_ws_log_data});

python.pythonGenerator.forBlock['xrp_ws_log_data'] = function(block){
  data = Blockly.Python.valueToCode(block, 'DATA', Blockly.Python.ORDER_ATOMIC);
  var label  = block.getInputTargetBlock("log_name").getFieldValue("TEXT");
  var code = `webserver.log_data("${label}", ${data})\n`
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["server"], 1);
  python.pythonGenerator.addImportWithPriority(def["server"], 2);
  return code;
}

//-----------------start server----------------

const xrp_ws_start_server = {
  init: function () {
    this.appendDummyInput()
      .appendField("Start web server");
    this.appendValueInput("server_ssid")
      .appendField("Name:")
      .setCheck("String");
    this.appendValueInput("server_pwd")
      .appendField("Password:")
      .setCheck("String");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190); // turquoise
    this.setTooltip("Starts a web server from the XRP");
    this.setHelpUrl("");
  }
}
Blockly.common.defineBlocks({xrp_ws_start_server: xrp_ws_start_server});

python.pythonGenerator.forBlock['xrp_ws_start_server'] = function(block){
  var ssid = block.getInputTargetBlock("server_ssid").getFieldValue("TEXT");
  var pwd = block.getInputTargetBlock("server_pwd").getFieldValue("TEXT")
  var code = `webserver.start_network(ssid="${ssid}", password="${pwd}")\nwebserver.start_server()\n`
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["server"], 1);
  python.pythonGenerator.addImportWithPriority(def["server"], 2);
  return code;
}

//-------------server connect---------------

const xrp_ws_connect_server = {
  init: function () {
    this.appendDummyInput()
      .appendField("Connect web server");
    this.appendValueInput("server_ssid")
      .appendField("Name:")
      .setCheck("String");
    this.appendValueInput("server_pwd")
      .appendField("Password:")
      .setCheck("String");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(190); // turquoise
    this.setTooltip("Connects the XRP web server to an existing network");
    this.setHelpUrl("");
  }
}
Blockly.common.defineBlocks({xrp_ws_connect_server: xrp_ws_connect_server});

python.pythonGenerator.forBlock['xrp_ws_connect_server'] = function(block){
  var ssid = block.getInputTargetBlock("server_ssid").getFieldValue("TEXT");
  var pwd = block.getInputTargetBlock("server_pwd").getFieldValue("TEXT")
  var code = `webserver.connect_to_network(ssid="${ssid}", password="${pwd}")\nwebserver.start_server()\n`
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["server"], 1);
  python.pythonGenerator.addImportWithPriority(def["server"], 2);
  return code;
}


  // --------led en placa---------------------
  
  const Led_xrp = {
    init: function() {
      this.appendDummyInput('value')
        .appendField('Led en placa')
        .appendField(new Blockly.FieldDropdown([
            ['Encender', 'on'],
            ['Apagar', 'off']
          ]), 'NAME');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip('Maneja el led incorporado en la placa del xrp');
      this.setHelpUrl('');
      this.setColour(165);
    }
  };
  Blockly.common.defineBlocks({Led_xrp: Led_xrp});
                      
  python.pythonGenerator.forBlock['Led_xrp'] = function(block) {
    // Agregar el código preámbulo a la lista (se asegura de que sea único)
    python.pythonGenerator.addImportWithPriority(lib["board"], 1);
    python.pythonGenerator.addImportWithPriority(def["onboard"], 2);
    const dropdown_name = block.getFieldValue('NAME');
    const code = `board.led_${dropdown_name}()\n`;
    return code;
  }
  
  //---------esperar a boton de placa---------
  
  const wait_boton_xrp = {
    init: function() {
      this.appendDummyInput('NAME')
        .appendField('Esperar a botón de placa');
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setTooltip('Espera a que el botón del xrp sea presionado');
      this.setHelpUrl('');
      this.setColour(165);
    }
  };
  Blockly.common.defineBlocks({wait_boton_xrp: wait_boton_xrp});
  
  python.pythonGenerator.forBlock['wait_boton_xrp'] = function() {
    python.pythonGenerator.addImportWithPriority(lib["board"], 1);
    python.pythonGenerator.addImportWithPriority(def["onboard"], 2);
    const code = 'board.wait_for_button()\n';
    return code;
  }
  
  //--------leer boton de xrp-----------------
  
  const b_xrp = {
    init: function() {
      this.appendDummyInput('titutlo')
        .appendField('Botón de placa');
      this.setOutput(true, 'Boolean');
      this.setTooltip('Valor booleano del botón ubicado en la placa del xrp');
      this.setHelpUrl('');
      this.setColour(165);
    }
  };
  Blockly.common.defineBlocks({b_xrp: b_xrp});
  
  python.pythonGenerator.forBlock['b_xrp'] = function() {
    python.pythonGenerator.addImportWithPriority(lib["board"], 1);
    python.pythonGenerator.addImportWithPriority(def["onboard"], 2);
    const code = 'board.is_button_pressed()';
    return [code, python.Order.NONE];
  }
  
  
  //--------sensor de distancia---------------
  
  const distancia = {
    init: function() {
      this.appendDummyInput('titulo')
        .appendField('Sensor de distancia');
      this.setOutput(true, 'Number');
      this.setTooltip('Muestra la distancia medida por el sensor ultrasónico conectado al xrp ');
      this.setHelpUrl('');
      this.setColour(165);
    }
  };
  Blockly.common.defineBlocks({distancia: distancia});
                      
  python.pythonGenerator.forBlock['distancia'] = function() {
    python.pythonGenerator.addImportWithPriority(lib["distance"], 1);
    python.pythonGenerator.addImportWithPriority(def["distance"], 2);
    const code = 'rangefinder.distance()';
    return [code, python.Order.NONE];
  }

    //--------voltaje bateria---------------
  
    const Voltaje = {
      init: function() {
        this.appendDummyInput('titulo')
          .appendField('Voltaje de bateria');
        this.setOutput(true, 'Number');
        this.setTooltip('Muestra el voltaje de las baterias');
        this.setHelpUrl('');
        this.setColour(165);
      }
    };
    Blockly.common.defineBlocks({Voltaje: Voltaje});
                        
    python.pythonGenerator.forBlock['Voltaje'] = function() {
      python.pythonGenerator.addImportWithPriority(lib["pin"], 1);
      python.pythonGenerator.addImportWithPriority(lib["adc"], 1);
      python.pythonGenerator.addImportWithPriority(lib["math"], 1);
      const code = '(ADC(Pin(\'BOARD_VIN_MEASURE\')).read_u16())/(1024*64/14)';
      return [code, python.Order.NONE];
    }
  
  //-----------sigue lineas------------------
  const sigue_linea = {
    init: function() {
      this.appendDummyInput('titulo')
        .appendField('Seguidor de lineas')
        .appendField(new Blockly.FieldDropdown([
            ['Izquierdo', 'left'],
            ['Derecho', 'right']
          ]), 'ubicacion');
          this.setOutput(true, 'Number');
      this.setTooltip('Valor booleano del sensor sigue líneas');
      this.setHelpUrl('');
      this.setColour(165);
    }
  };
  Blockly.common.defineBlocks({sigue_linea: sigue_linea});
                      
  python.pythonGenerator.forBlock['sigue_linea'] = function(block) {
    python.pythonGenerator.addImportWithPriority(lib["siguelinea"], 1);
    python.pythonGenerator.addImportWithPriority(def["siguelineas"], 2);
    const ubicacion = block.getFieldValue('ubicacion');
    const code = `reflectance.get_${ubicacion}()`;
    return [code, python.Order.NONE];
  }
  
  // ----------giroscopio--------------------
  const giroscopio = {
    init: function() {
      this.appendDummyInput('NAME')
        .appendField('Giroscopio')
        .appendField(new Blockly.FieldDropdown([
            ['Yaw', 'yaw'],
            ['Pitch', 'pitch'],
            ['Roll', 'roll']
          ]), 'NAME');
      this.setOutput(true, 'Number');
      this.setTooltip('Angulo de giro en cada eje, la posición se establece en 0 al momento de encender.');
      this.setHelpUrl('');
      this.setColour(165);
    }
  };
  Blockly.common.defineBlocks({giroscopio: giroscopio});
                      
  python.pythonGenerator.forBlock['giroscopio'] = function(block) {
    python.pythonGenerator.addImportWithPriority(lib["gyro"], 1);
    python.pythonGenerator.addImportWithPriority(def["gyro"], 2);
    const name = block.getFieldValue('NAME');
    python.pythonGenerator.addImportWithPriority(`imu.reset_${name}()`, 3);
    const code = `imu.get_${name}()`;
    return [code, python.Order.NONE];
  }

  //-----------comentario--------------
const comentario = {
  init: function() {
    this.appendDummyInput('n')
      .appendField('Comentario: ')
      .appendField(new Blockly.FieldTextInput('Escriba aqui'), 'NAME');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Comentario sin función alguna');
    this.setHelpUrl('');
    this.setColour(180);
  }
};
Blockly.common.defineBlocks({comentario: comentario});
              
python.pythonGenerator.forBlock['comentario'] = function(block) {
  const text_name = block.getFieldValue('NAME');

  // TODO: Assemble python into the code variable.
  const code = '';
  return code;
}
  
  //--------------esperar--------------------
const delay_seconds = {
  init: function() {
    this.appendValueInput('val')
    .setCheck('Number')
      .appendField('Esperar');
    this.appendDummyInput('NAME')
      .appendField('Segundos');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Detiene el programa por la cantidad de segundos establecida.');
    this.setHelpUrl('');
    this.setColour(60);
  }
};
Blockly.common.defineBlocks({delay_seconds: delay_seconds});
                    
python.pythonGenerator.forBlock['delay_seconds'] = function(block) {
  // Agregar el código preámbulo a la lista (se asegura de que sea único)
  python.pythonGenerator.addImportWithPriority(lib["tiempo"],1);
  const time_value = Blockly.Python.valueToCode(block, 'val', python.Order.ATOMIC);
  const code = `time.sleep(${time_value})\n`;
  return code;
}

//-------------------esperar hasta ----------------------------------
Blockly.Blocks['esperar_hasta'] = {
  init: function() {
    this.appendValueInput("NAME")
        .setCheck("Boolean")
        .appendField("Esperar hasta: ");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(60);
 this.setTooltip("Espera hasta que se cumpla la condición, tiene un tiempo de espera 0.01s entre cada revisión de la condición. ");
 this.setHelpUrl("");
  }
};

python.pythonGenerator.forBlock['esperar_hasta'] = function(block, generator) {
  python.pythonGenerator.addImportWithPriority(lib["tiempo"],1);
  const condicion = Blockly.Python.valueToCode(block, 'NAME', python.Order.ATOMIC);
  // TODO: Assemble python into code variable.
  var code = `while not (${condicion}):\n`;
  code = code + "  time.sleep(0.01)\n";
  return code;
};

//----------------------iniciar pestolink----------------------------

Blockly.Blocks['pestolink_start'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Iniciar Pesto link");
    this.appendValueInput("NAME")
        .setCheck("String")
        .appendField("Nombre: ");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(240);
 this.setTooltip("'Solo se debe usar una vez'. Inicia la comunicación bluetooth con el nombre indicado");
 this.setHelpUrl("");
  }
};

python.pythonGenerator.forBlock['pestolink_start'] = function(block, generator) {
  python.pythonGenerator.addImportWithPriority(lib["pin"],1);
  python.pythonGenerator.addImportWithPriority(lib["bt"],1);
  python.pythonGenerator.addImportWithPriority(lib["tiempo"],1);
  python.pythonGenerator.addImportWithPriority(lib["math"],1);
  python.pythonGenerator.addImportWithPriority(def["pestolink"], 2);
  var value_name = generator.valueToCode(block, 'NAME', python.Order.ATOMIC);
  // TODO: Assemble python into code variable.
  var code = `pestolink = PestoLinkAgent(${value_name})\n`;
  return code;
};

//----------------------pestolink conectado-------------------------
Blockly.Blocks['pl_conected'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("¿Esta PestoLink Conectado?");
    this.setOutput(true, "Boolean");
    this.setColour(240);
 this.setTooltip("Devuelve verdadero si PestoLink tiene una conexión activa");
 this.setHelpUrl("");
  }
};
python.pythonGenerator.forBlock['pl_conected'] = function(block, generator) {
  var code = 'pestolink.is_connected()';
  return [code, Blockly.Python.ORDER_ATOMIC]; // Usa ORDER_ATOMIC para asegurar que se use en una condición
};

//----------------------joystickX-----------------------------
Blockly.Blocks['joy1'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("JoyStickX");
    this.setOutput(true, "Number");
    this.setColour(240);
 this.setTooltip("Regresa el valor del JoyStick X");
 this.setHelpUrl("");
  }
};
python.pythonGenerator.forBlock['joy1'] = function(block, generator) {
  // TODO: Assemble python into code variable.
  const code = 'pestolink.get_axis(0)';
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.Python.ORDER_ATOMIC]; // Usa ORDER_ATOMIC para asegurar que se use en una condición
};

//----------------------joystickY-----------------------------
Blockly.Blocks['joy2'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("JoyStickY");
    this.setOutput(true, "Number");
    this.setColour(240);
 this.setTooltip("Regresa el valor del JoyStick Y");
 this.setHelpUrl("");
  }
};
python.pythonGenerator.forBlock['joy2'] = function(block, generator) {
  // TODO: Assemble python into code variable.
  const code = '-1*pestolink.get_axis(1)';
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.Python.ORDER_ATOMIC]; // Usa ORDER_ATOMIC para asegurar que se use en una condición
};
//-------------------boton 0--------------------------
Blockly.Blocks['B0'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Boton 0 ¿Esta presionado?");
    this.setOutput(true, "Boolean");
    this.setColour(240);
 this.setTooltip("regresa true si el boton esta presionado");
 this.setHelpUrl("");
  }
};
python.pythonGenerator.forBlock['B0'] = function(block, generator) {
  // TODO: Assemble python into code variable.
  const code = 'pestolink.get_button(0)';
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.Python.ORDER_ATOMIC]; // Usa ORDER_ATOMIC para asegurar que se use en una condición
};

//-------------------boton 1--------------------------
Blockly.Blocks['B1'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Boton 1 ¿Esta presionado?");
    this.setOutput(true, "Boolean");
    this.setColour(240);
 this.setTooltip("regresa true si el boton esta presionado");
 this.setHelpUrl("");
  }
};
python.pythonGenerator.forBlock['B1'] = function(block, generator) {
  // TODO: Assemble python into code variable.
  const code = 'pestolink.get_button(1)';
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.Python.ORDER_ATOMIC]; // Usa ORDER_ATOMIC para asegurar que se use en una condición
};

//-------------------boton 2--------------------------
Blockly.Blocks['B2'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Boton 2 ¿Esta presionado?");
    this.setOutput(true, "Boolean");
    this.setColour(240);
 this.setTooltip("regresa true si el boton esta presionado");
 this.setHelpUrl("");
  }
};
python.pythonGenerator.forBlock['B2'] = function(block, generator) {
  // TODO: Assemble python into code variable.
  const code = 'pestolink.get_button(2)';
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.Python.ORDER_ATOMIC]; // Usa ORDER_ATOMIC para asegurar que se use en una condición
};

//-------------------boton 3--------------------------
Blockly.Blocks['B3'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Boton 3 ¿Esta presionado?");
    this.setOutput(true, "Boolean");
    this.setColour(240);
 this.setTooltip("regresa true si el boton esta presionado");
 this.setHelpUrl("");
  }
};
python.pythonGenerator.forBlock['B3'] = function(block, generator) {
  // TODO: Assemble python into code variable.
  const code = 'pestolink.get_button(3)';
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.Python.ORDER_ATOMIC]; // Usa ORDER_ATOMIC para asegurar que se use en una condición
};
//------------------telemetria----------
Blockly.Blocks['mostrar_link'] = {
  init: function() {
    this.appendValueInput("valor")
        .setCheck("Number")
        .appendField("Mostrar voltaje: ");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(240);
 this.setTooltip("Muestra el valor en PestoLink");
 this.setHelpUrl("");
  }
};
python.pythonGenerator.forBlock['mostrar_link'] = function(block, generator) {
  var value_valor = generator.valueToCode(block, 'valor', python.Order.ATOMIC);
  // TODO: Assemble python into code variable.
  var code = `pestolink.telemetryPrintBatteryVoltage(${value_valor})\n`;
  return code;
};

//-----------------------------configurar wifi----------------

const wifi_confi = {
  init: function() {
    this.appendDummyInput('bloque')
      .appendField('Iniciar servidor wifi')
      .appendField('Nombre:')
      .appendField(new Blockly.FieldTextInput('XRP_Server'), 'name')
      .appendField('Clave:')
      .appendField(new Blockly.FieldTextInput('12345678', validarClave), 'pass')
      .appendField('Dispositivo:')
      .appendField(new Blockly.FieldDropdown([
          ['PC', '0'],
          ['Teléfono', '1']
        ]), 'dvs');
    this.setInputsInline(true)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Configura el nombre y contraseña de la red wifi, se debe decidir el dispositivo para el tipo de activación.');
    this.setHelpUrl('');
    this.setColour(180);
  }
};
Blockly.common.defineBlocks({wifi_confi: wifi_confi});
                    

// Función de validación para la clave
function validarClave(text) {
  return text.length >= 8 ? text : null; // Si es menor a 8 caracteres, no permite el cambio
}

python.pythonGenerator.forBlock['wifi_confi'] = function(block) {
  python.pythonGenerator.addImportWithPriority(lib["wifi_gamepad"], 1);
  python.pythonGenerator.addImportWithPriority(def["wifi_gamepad"], 2);
  const text_name = block.getFieldValue('name');
  const text_pass = block.getFieldValue('pass');
  const dropdown_dvs = block.getFieldValue('dvs');

  // TODO: Assemble python into the code variable.
  const code = `w_gamepad.start_server('${text_name}','${text_pass}',${dropdown_dvs})\n`;
  return code;
}

Blockly.Blocks['wifi_confi'] = wifi_confi;

//--------------------------leer wifi--------------------

const leer = {
  init: function() {
    this.appendDummyInput('1')
      .appendField('1. Esperar hasta recibir mensaje');
    this.appendDummyInput('NAME')
      .appendField('2. Leer mensaje');
    this.setInputsInline(false)
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Espera hasta que recibe un mensaje, si no se usa no se actualizaran los mensajes');
    this.setHelpUrl('');
    this.setColour(180);
  }
};
Blockly.common.defineBlocks({leer: leer});
                    
python.pythonGenerator.forBlock['leer'] = function(block) {

  // TODO: Assemble python into the code variable.
  const code = 'w_gamepad.read()\n';
  return code;
}

//------------------funcion----------------------
const hace = {
  init: function() {
    this.appendDummyInput('accion')
      .appendField('Botón:')
      .appendField(new Blockly.FieldDropdown([
          ['LEFT', 'l'],
          ['RIGHT', 'r'],
          ['ARROW_UP', 'up'],
          ['ARROW_LEFT', 'left'],
          ['ARROW_DOWN', 'down'],
          ['ARROW_RIGHT', 'right'],
          ['Y', 'y'],
          ['X', 'x'],
          ['A', 'a'],
          ['B', 'b'],
          ['SELECT', 'select'],
          ['START', 'start'],
          ['HOME', 'home'],
          ['F1', 'f1'],
          ['F2', 'f2'],
          ['F3', 'f3'],
          ['F4', 'f4']
        ]), 'btn')
      .appendField('Acción:')
      .appendField(new Blockly.FieldDropdown([
          ['Presionar', 'P'],
          ['Soltar', 'R']
        ]), 'action');
    this.appendStatementInput('NAME');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Ejecuta bloque si el mensaje menciona el botón indicado y la acción indicada');
    this.setHelpUrl('');
    this.setColour(180);
  }
};
Blockly.common.defineBlocks({hace: hace});
                    
python.pythonGenerator.forBlock['hace'] = function(block,generator) {
  const dropdown_btn = block.getFieldValue('btn');
  const dropdown_action = block.getFieldValue('action');

  let statement_name = generator.statementToCode(block, 'NAME');

  if (!statement_name.trim()) { 
    statement_name = '  pass'; // Si está vacío, agrega 'pass'
  }

  // TODO: Assemble python into the code variable.
  const code = `if w_gamepad.see_action('/${dropdown_action}${dropdown_btn}'):\n${statement_name}\n`;
  return code;
}



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
