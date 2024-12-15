# Import required modules
import socket
import threading

HOST = '127.0.0.1'
# we can use port from 0 - 65535
PORT = 1234
LISTENER_LIMIT = 5

# main function
def main():
    # Creating the socket class object
    # AF_INET is ipv4 address
    # SOCK_STREAM: we using tcp packets for communication
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        server.bind((HOST,PORT))
        print(f"Running the server on host: {HOST}  port: {PORT}")
    except:
        print(f'Unable to bind to host {HOST} and post {PORT}')

    # SET server limit
    server.listen(LISTENER_LIMIT)

    while 1:
        client, address = server.accept()
        print(f"Successully connected to client {address[0]} {address[1]}")


if __name__ == '__main__':
    main()