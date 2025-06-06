import sys
import os
import _thread
import json

def main():
    buffer = ""
    assembling = False
    save1 = False
    save2 = False
    line_read = '0'
    file_name = 'Pograma.Fblocks'
    message = ""
    print(" listo para iniciar")

    while True:
        try:
            line = sys.stdin.readline().strip()

            if not line:
                continue

            message = line
            
            if message == "[[END]]":
                save2 = False
            elif save1:
                file_name = message
                save1 = False
            elif save2:
                line = line[1:-1]
                with open(file_name, 'a') as archivo:
                    archivo.write(line + "\n")
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
            elif line == 'hola':
                print("Mensaje completo recibido: hola desde xrp")
            else:
                print(f"Mensaje fuera de fragmentación: {line}")

        except Exception as e:
            print(f"❌ Error: {e}")

main()
