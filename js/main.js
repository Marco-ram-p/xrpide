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