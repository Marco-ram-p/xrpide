const bt_pestolink = `from micropython import const
import bluetooth
import random
import struct
import time


_IRQ_CENTRAL_CONNECT = const(1)
_IRQ_CENTRAL_DISCONNECT = const(2)
_IRQ_GATTS_WRITE = const(3)

_FLAG_READ = const(0x0002)
_FLAG_WRITE_NO_RESPONSE = const(0x0004)
_FLAG_WRITE = const(0x0008)
_FLAG_NOTIFY = const(0x0010)

_UART_UUID = bluetooth.UUID('27df26c5-83f4-4964-bae0-d7b7cb0a1f54')
_UART_TX = (
    bluetooth.UUID('266d9d74-3e10-4fcd-88d2-cb63b5324d0c'),
    _FLAG_READ | _FLAG_NOTIFY,
)
_UART_RX = (
    bluetooth.UUID('452af57e-ad27-422c-88ae-76805ea641a9'),
    _FLAG_WRITE | _FLAG_WRITE_NO_RESPONSE,
)
_UART_SERVICE = (
    _UART_UUID,
    (_UART_TX, _UART_RX),
)

_ADV_TYPE_FLAGS = const(0x01)
_ADV_TYPE_NAME = const(0x09)
_ADV_TYPE_UUID16_COMPLETE = const(0x3)
_ADV_TYPE_UUID32_COMPLETE = const(0x5)
_ADV_TYPE_UUID128_COMPLETE = const(0x7)
_ADV_TYPE_UUID16_MORE = const(0x2)
_ADV_TYPE_UUID32_MORE = const(0x4)
_ADV_TYPE_UUID128_MORE = const(0x6)
_ADV_TYPE_APPEARANCE = const(0x19)


# Generate a payload to be passed to gap_advertise(adv_data=...).
def advertising_payload(limited_disc=False, br_edr=False, name=None, services=None, appearance=0):
    payload = bytearray()

    def _append(adv_type, value):
        nonlocal payload
        payload += struct.pack('BB', len(value) + 1, adv_type) + value

    _append(
        _ADV_TYPE_FLAGS,
        struct.pack('B', (0x01 if limited_disc else 0x02) + (0x18 if br_edr else 0x04)),
    )

    if name:
        _append(_ADV_TYPE_NAME, name)

    if services:
        for uuid in services:
            b = bytes(uuid)
            if len(b) == 2:
                _append(_ADV_TYPE_UUID16_COMPLETE, b)
            elif len(b) == 4:
                _append(_ADV_TYPE_UUID32_COMPLETE, b)
            elif len(b) == 16:
                _append(_ADV_TYPE_UUID128_COMPLETE, b)

    # See org.bluetooth.characteristic.gap.appearance.xml
    if appearance:
        _append(_ADV_TYPE_APPEARANCE, struct.pack('<h', appearance))

    return payload


def decode_field(payload, adv_type):
    i = 0
    result = []
    while i + 1 < len(payload):
        if payload[i + 1] == adv_type:
            result.append(payload[i + 2 : i + payload[i] + 1])
        i += 1 + payload[i]
    return result


def decode_name(payload):
    n = decode_field(payload, _ADV_TYPE_NAME)
    return str(n[0], 'utf-8') if n else ''


def decode_services(payload):
    services = []
    for u in decode_field(payload, _ADV_TYPE_UUID16_COMPLETE):
        services.append(bluetooth.UUID(struct.unpack('<h', u)[0]))
    for u in decode_field(payload, _ADV_TYPE_UUID32_COMPLETE):
        services.append(bluetooth.UUID(struct.unpack('<d', u)[0]))
    for u in decode_field(payload, _ADV_TYPE_UUID128_COMPLETE):
        services.append(bluetooth.UUID(u))
    return services

class PestoLinkAgent:
    def __init__(self, name):
        sliced_name = name[:8] #only use the first 8 characters in the name, otherwise code will crash
        self._ble = bluetooth.BLE()
        self._ble.active(True)
        self._ble.irq(self._irq)
        ((self._handle_tx, self._handle_rx),) = self._ble.gatts_register_services((_UART_SERVICE,))
        self._connections = set()
        self._payload = advertising_payload(name=sliced_name, services=[_UART_UUID])
        self._byte_list = [1,127,127,127,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        self._advertise()
        self.last_telemetry_ms = 0

    def _irq(self, event, data):
        # Track connections so we can send notifications.
        if event == _IRQ_CENTRAL_CONNECT:
            conn_handle, _, _ = data
            #print('New connection')
            self._connections.add(conn_handle)
        elif event == _IRQ_CENTRAL_DISCONNECT:
            conn_handle, _, _ = data
            #print('Disconnected')
            self._connections.remove(conn_handle)
            # Start advertising again to allow a new connection.
            self._advertise()
        elif event == _IRQ_GATTS_WRITE:
            conn_handle, value_handle = data
            value = self._ble.gatts_read(value_handle)
            if value_handle == self._handle_rx:
                self.on_write(value)

    def send(self, data):
        for conn_handle in self._connections:
            self._ble.gatts_notify(conn_handle, self._handle_tx, data)

    def is_connected(self):
        return len(self._connections) > 0

    def _advertise(self, interval_us=500000):
        #print('Starting advertising')
        self._ble.gap_advertise(interval_us, adv_data=self._payload)

    def on_write(self, value):
        _raw_byte_list = [byte for byte in value]
        if (_raw_byte_list[0] == 0x01):
            self._byte_list = _raw_byte_list
        else:
            self._byte_list = [1,127,127,127,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        
    def get_raw_axis(self, axis_num):
        if axis_num < 0 or axis_num > 3 or self._byte_list == None:
            return 127
        else:
            return self._byte_list[1 + axis_num]

    def get_axis(self, axis_num):
        raw_axis = self.get_raw_axis(axis_num)
        if raw_axis == 127:
            return 0
        else:
            return (raw_axis / 127.5) - 1
        
    def get_button(self, button_num):
        if self._byte_list == None:
            return False
        
        raw_buttons = (self._byte_list[6] << 8) + self._byte_list[5]
        if ((raw_buttons >> (button_num)) & 0x01):
            return True
        else:
            return False
            
    def telemetryPrint(self, telemetry, hex_code):
        if self.last_telemetry_ms + 500 > time.ticks_ms():
            return

        result = bytearray(11)
        
        # Copy up to 8 characters from telemetry
        for i in range(8):
            if i < len(telemetry):
                result[i] = ord(telemetry[i])
            else:
                result[i] = 0
        
        # Adjust pointer if the hex code starts with '0x'
        if hex_code.startswith('0x'):
            hex_code = hex_code[2:]
        
        try:
            color = int(hex_code, 16)
        except ValueError:
            color = 0  # Default to 0 if conversion fails
        
        #debug: print(str(hex_code) + ' ' + str(color))
        
        result[8] = (color >> 16) & 0xFF
        result[9] = (color >> 8) & 0xFF
        result[10] = color & 0xFF
        
        self.send(result)  # Assuming BLE characteristic write
        self.last_telemetry_ms = time.ticks_ms()
        
    def telemetryPrintBatteryVoltage(self, battery_voltage):
        voltage_string = '{:.2f} V'.format(battery_voltage)
        
        if battery_voltage >= 7.6:
            self.telemetryPrint(voltage_string, '00FF00')
        elif battery_voltage >= 7:
            self.telemetryPrint(voltage_string, 'FFFF00')
        else:
            self.telemetryPrint(voltage_string, 'FF0000')

`;
const wifi_lib = `import network
import socket
import time
class wifi_gamepad:
    def __init__(self):
        pass
    def start_server(self, name='XRP_Server',passkey='12345678',device=0):    
        self.dev_d = 'onmousedown'
        self.dev_u = 'onmouseup'
        if device == 1:
            self.dev_d = 'ontouchstart'
            self.dev_u = 'ontouchend'   
        self.ap = network.WLAN(network.AP_IF)
        self.ap.config(essid=name, password=passkey)  # Cambia esto si deseas
        self.ap.active(True)
        while self.ap.active() == False:
            pass
        print('Access Point creado:', self.ap.ifconfig())
        self.addr = socket.getaddrinfo('0.0.0.0', 80)[0][-1]
        self.s = socket.socket()
        self.s.bind(self.addr)
        self.s.listen(1)
        print('Servidor web en', self.addr)
    def read(self):
        self.cl, self.addr = self.s.accept()
        print('Cliente conectado desde', self.addr)
        self.request = self.cl.recv(1024)
        self.request = str(self.request)
        self.mensaje = self.request
        self.cl.send('HTTP/1.0 200 OK\r\nContent-type: text/html\r\n\r\n')
        self.cl.send('''
        <!DOCTYPE html>
        <head>
        <meta charset='UTF-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1.0'>
        <title>Virtual Controller</title>
        <style>
        body,html{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background-color:#1a1a2e;touch-action:none;}    
        #c-c{position:fixed;width:100%;height:100%;display:flex;justify-content:space-around;align-items:stretch;padding:2.5vmin;box-sizing:border-box;}
        .controller-side {display:flex;flex-direction:column;justify-content:space-between;align-items:center;width:40%;padding:1vmin 0; box-sizing:border-box;}
        .middle-section {display:flex;flex-direction:column;justify-content:center;align-items:center;width:15%;padding:1vmin 0;box-sizing:border-box;gap:2vmin;}
        .btn {
        width:14vmin; height:14vmin;border-radius:50%;background:linear-gradient(145deg,#3498db,#2980b9);border:1vmin solid #2c3e50;box-shadow:0 1vmin 2vmin rgba(0,0,0,0.3);
        display:flex;justify-content:center;align-items:center;color:white;font-weight:bold;font-size:3vmin;user-select:none;touch-action:none;
        font-family: inherit;cursor: pointer;padding:0;box-sizing:border-box;transition:transform 0.05s ease-out, background 0.05s ease-out; 
        }
        .btn:active, .btn.pressed {transform:scale(0.95);background:linear-gradient(145deg, #2980b9, #3498db);}
        .btn.option-btn {width:18vmin;height:7vmin;border-radius:1.5vmin;font-size: 2.5vmin;}
        #l-t, #r-t {width:22vmin;height:8vmin;font-size: 2.8vmin;}
        .btn.middle-btn {width:20vmin;height:8vmin;border-radius:1.5vmin;font-size: 2.2vmin;}
        .btn.option-btn:active, .btn.option-btn.pressed, .btn.middle-btn:active, .btn.middle-btn.pressed {transform:scale(0.97)}
        .button-cluster {display:grid;grid-template-areas:'. top .' 'left . right' '. bottom .';grid-template-columns:auto auto auto;grid-template-rows: auto auto auto;gap:1.5vmin;}
        .extra-buttons-row {display:flex;justify-content:center;align-items:center;gap:1.5vmin;width:100%;min-height:7vmin;}
        #t { grid-area: top; }
        #s { grid-area: left; }
        #c { grid-area: right; }
        #cr { grid-area: bottom; }
        #d-u { grid-area: top; }
        #d-l { grid-area: left; }
        #d-r { grid-area: right; }
        #d-d { grid-area: bottom; }
        </style>
            </head>
            <body>
                <div id='c-c'>
                    <div class='controller-side' id='controller-left'>
                        <div class='extra-buttons-row'>
                            <button class='btn option-btn' id='l-t' ''' + self.dev_d + '''='send('Pl',event)' ''' + self.dev_u +'''='send('Rl',event)'>LEFT</button>
                        </div>
                        <div class='d-pad button-cluster'>
                            <button class='btn' id='d-u' ''' + self.dev_d + '''='send('Pup',event)' ''' + self.dev_u +'''='send('Rup',event)'>▲</button>
                            <button class='btn' id='d-l' ''' + self.dev_d + '''='send('Pleft',event)' ''' + self.dev_u +'''='send('Rleft',event)'>◄</button>
                            <button class='btn' id='d-r' ''' + self.dev_d + '''='send('Pright',event)' ''' + self.dev_u +'''='send('Rright',event)'>►</button>
                            <button class='btn' id='d-d' ''' + self.dev_d + '''='send('Pdown',event)' ''' + self.dev_u +'''='send('Rdown',event)'>▼</button>
                        </div>
                        <div class='extra-buttons-row'>
                            <button class='btn option-btn' id='f1' ''' + self.dev_d + '''='send('Pf1',event)' ''' + self.dev_u +'''='send('Rf1',event)'>F1</button>
                            <button class='btn option-btn' id='f2' ''' + self.dev_d + '''='send('Pf2',event)' ''' + self.dev_u +'''='send('Rf2',event)'>F2</button>
                        </div>
                    </div>
                    <div class='middle-section'>
                        <button class='btn middle-btn' id='select-middle' ''' + self.dev_d + '''='send('Pselect',event)' ''' + self.dev_u +'''='send('Rselect',event)'>SELECT</button>
                        <button class='btn middle-btn' id='start-middle' ''' + self.dev_d + '''='send('Pstart',event)' ''' + self.dev_u +'''='send('Rstart',event)'>START</button>
                        <button class='btn middle-btn' id='home-middle' ''' + self.dev_d + '''='send('Phome',event)' ''' + self.dev_u +'''='send('Rhome',event)'>HOME</button>
                    </div>        
                    <div class='controller-side' id='controller-right'>
                        <div class='extra-buttons-row'>
                            <button class='btn option-btn' id='r-t' ''' + self.dev_d + '''='send('Pr',event)' ''' + self.dev_u +'''='send('Rr',event)'>RIGHT</button>
                        </div>
                        <div class='action-buttons button-cluster'>
                            <button class='btn' id='t' ''' + self.dev_d + '''='send('Py',event)' ''' + self.dev_u +'''='send('Ry',event)'>Y</button>
                            <button class='btn' id='s' ''' + self.dev_d + '''='send('Px',event)' ''' + self.dev_u +'''='send('Rx',event)'>X</button>
                            <button class='btn' id='c' ''' + self.dev_d + '''='send('Pb',event)' ''' + self.dev_u +'''='send('Rb',event)'>B</button>
                            <button class='btn' id='cr' ''' + self.dev_d + '''='send('Pa',event)' ''' + self.dev_u +'''='send('Ra',event)'>A</button>
                        </div>
                        <div class='extra-buttons-row'>
                            <button class='btn option-btn' id='f3' ''' + self.dev_d + '''='send('Pf3',event)' ''' + self.dev_u +'''='send('Rf3',event)'>F3</button>
                            <button class='btn option-btn' id='f4' ''' + self.dev_d + '''='send('Pf4',event)' ''' + self.dev_u +'''='send('Rf4',event)'>F4</button>
                        </div>
                    </div>
                </div>
                <script>
                    function send(cmd,event) {
                    if (event) event.preventDefault();
                    fetch('/' + cmd)
                    .then(response => response.text())
                    .then(data => console.log(data));
                    }
                </script>
            </body>
            </html>
        ''')
        self.cl.close()
    def see_action(self,action='up'):
        if action in self.mensaje:
            return True
        else:
            return False      
`