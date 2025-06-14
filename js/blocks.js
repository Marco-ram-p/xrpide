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
