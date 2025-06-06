import network
import socket
import time
class wifi_gamepad:
    def __init__(self):
        pass
    def start_server(self, name="XRP_Server",passkey="12345678",device=0):    
        self.dev_d = "onmousedown"
        self.dev_u = "onmouseup"
        if device == 1:
            self.dev_d = "ontouchstart"
            self.dev_u = "ontouchend"   
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
        self.cl.send("""
        <!DOCTYPE html>
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
        .button-cluster {display:grid;grid-template-areas:". top ." "left . right" ". bottom .";grid-template-columns:auto auto auto;grid-template-rows: auto auto auto;gap:1.5vmin;}
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
                <div id="c-c">
                    <div class="controller-side" id="controller-left">
                        <div class="extra-buttons-row">
                            <button class="btn option-btn" id="l-t" """ + self.dev_d + """="send('Pl',event)" """ + self.dev_u +"""="send('Rl',event)">LEFT</button>
                        </div>
                        <div class="d-pad button-cluster">
                            <button class="btn" id="d-u" """ + self.dev_d + """="send('Pup',event)" """ + self.dev_u +"""="send('Rup',event)">▲</button>
                            <button class="btn" id="d-l" """ + self.dev_d + """="send('Pleft',event)" """ + self.dev_u +"""="send('Rleft',event)">◄</button>
                            <button class="btn" id="d-r" """ + self.dev_d + """="send('Pright',event)" """ + self.dev_u +"""="send('Rright',event)">►</button>
                            <button class="btn" id="d-d" """ + self.dev_d + """="send('Pdown',event)" """ + self.dev_u +"""="send('Rdown',event)">▼</button>
                        </div>
                        <div class="extra-buttons-row">
                            <button class="btn option-btn" id="f1" """ + self.dev_d + """="send('Pf1',event)" """ + self.dev_u +"""="send('Rf1',event)">F1</button>
                            <button class="btn option-btn" id="f2" """ + self.dev_d + """="send('Pf2',event)" """ + self.dev_u +"""="send('Rf2',event)">F2</button>
                        </div>
                    </div>
                    <div class="middle-section">
                        <button class="btn middle-btn" id="select-middle" """ + self.dev_d + """="send('Pselect',event)" """ + self.dev_u +"""="send('Rselect',event)">SELECT</button>
                        <button class="btn middle-btn" id="start-middle" """ + self.dev_d + """="send('Pstart',event)" """ + self.dev_u +"""="send('Rstart',event)">START</button>
                        <button class="btn middle-btn" id="home-middle" """ + self.dev_d + """="send('Phome',event)" """ + self.dev_u +"""="send('Rhome',event)">HOME</button>
                    </div>        
                    <div class="controller-side" id="controller-right">
                        <div class="extra-buttons-row">
                            <button class="btn option-btn" id="r-t" """ + self.dev_d + """="send('Pr',event)" """ + self.dev_u +"""="send('Rr',event)">RIGHT</button>
                        </div>
                        <div class="action-buttons button-cluster">
                            <button class="btn" id="t" """ + self.dev_d + """="send('Py',event)" """ + self.dev_u +"""="send('Ry',event)">Y</button>
                            <button class="btn" id="s" """ + self.dev_d + """="send('Px',event)" """ + self.dev_u +"""="send('Rx',event)">X</button>
                            <button class="btn" id="c" """ + self.dev_d + """="send('Pb',event)" """ + self.dev_u +"""="send('Rb',event)">B</button>
                            <button class="btn" id="cr" """ + self.dev_d + """="send('Pa',event)" """ + self.dev_u +"""="send('Ra',event)">A</button>
                        </div>
                        <div class="extra-buttons-row">
                            <button class="btn option-btn" id="f3" """ + self.dev_d + """="send('Pf3',event)" """ + self.dev_u +"""="send('Rf3',event)">F3</button>
                            <button class="btn option-btn" id="f4" """ + self.dev_d + """="send('Pf4',event)" """ + self.dev_u +"""="send('Rf4',event)">F4</button>
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
        """)
        self.cl.close()
    def see_action(self,action='up'):
        if action in self.mensaje:
            return True
        else:
            return False      
