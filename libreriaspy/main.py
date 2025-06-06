import sys
import os
import _thread
import json
import time
import machine
from XRPLib.board import Board
board = Board.get_default_board()
running = False
lock = _thread.allocate_lock()

def main():
    global running
    buffer = ""
    assembling = False
    save1 = False
    save2 = False
    save3 = False
    line_read = '0'
    file_name = 'Programa.Fblocks'
    message = ""
    print(" listo para iniciar")

    while True:
        try:
            time.sleep(0.04)
            line = sys.stdin.readline().strip()
            if not line:
                continue
            message = line
            if message == "[[END]]":
                save2 = False
                save3 = False
            elif message.startswith("[[read]]"):
                partes = message.split(',')
                with open(partes[1], "r") as archivo:
                    for linea in archivo:
                        print(linea)  # .strip() elimina saltos de línea y espacios
                        time.sleep(0.05)
                print("[[rpd]]")
            elif save1:
                file_name = message
                save1 = False
            elif save2:
                line = line[1:-1]
                with open("Running.py", 'a') as archivo:
                    archivo.write(line + "\n")
            elif save3:
                line = line[1:-1]
                with open(file_name, 'a') as archivo:
                    archivo.write(line + "\n")
            elif message == "[[RUN]]":
                with lock:
                    running = True
            elif message == "[[STOP]]":
                machine.reset()
            elif message.startswith("[[delete]]"):
                partes = message.split(',')
                if partes[1] in os.listdir():
                    os.remove(partes[1])
            elif message.startswith("[[rename]]"):
                partes = message.split(',')
                if partes[1] in os.listdir():
                    os.rename(partes[1],partes[2])
            elif message == "[[memory]]":
                # Obtener estadísticas del sistema de archivos
                stats = os.statvfs('/')
                # Tamaño total de almacenamiento en bytes
                total = stats[0] * stats[2]
                # Espacio libre disponible en bytes
                libre = stats[0] * stats[3]
                # Espacio usado
                usado = total - libre
                # Convertir a KB
                total_kb = total // 1024
                used_kb = usado // 1024
                enviar = '[[memory]],' + str(total_kb) + ',' + str(used_kb)
                print(enviar)
            elif message == "[[files]]":
                # Listar solo archivos en la raíz
                archivos = [f for f in os.listdir('/') if not os.stat(f)[0] & 0x4000]
                enviar = '[[files]]'
                for archivo in archivos:
                    enviar = enviar + "," + archivo
                print(enviar)
            elif message == "[[Save1]]":
                save1 = True
            elif message == "[[Save2]]":
                save2 = True
                line_read = '1'
                file_name = '/' + file_name + '.Fblocks'
                # Crear y abrir el archivo en modo escritura
                with open(file_name, 'w') as archivo:
                    pass
                with open("Running.py", 'w') as archivo:
                    pass
            elif message == "[[Save3]]":
                save3 = True
                save2 = False
                line_read = '1'
            elif message == "[[AI]]":
                with open("confi.txt", 'w') as archivo:
                    archivo.write("0")
            elif message == "[[BI]]":
                with open("confi.txt", 'w') as archivo:
                    archivo.write("1")
            elif message == "[[NI]]":
                with open("confi.txt", 'w') as archivo:
                    archivo.write("2")
            elif line == 'hola':
                print("Mensaje completo recibido: hola desde xrp")
            else:
                print(f"Mensaje fuera de fragmentación: {line}")

        except Exception as e:
            print(f"❌ Error: {e}")
_thread.start_new_thread(main, ())

Start = False
button = False
with open('confi.txt', 'r') as f:
    contenido = f.read()
if contenido == '0':
    with lock:
        running = True
elif contenido == '1':
    button = True
while (not running):
    board.led_on()
    time.sleep(0.3)
    board.led_off()
    time.sleep(0.3)
    with lock:
        Start = running
    if board.is_button_pressed() and button:
        with lock:
            running = True

import Running
