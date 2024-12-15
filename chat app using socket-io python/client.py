# Import required modules
import socket
import threading


HOST = '127.0.0.1'
# we can use port from 0 - 65535
PORT = 1234

def main():
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    try:
        client.connect((HOST,PORT))
        print(f"Successfully connect to the server on host: {HOST}  port: {PORT}")
    except:
        print(f"Unable to connect to server {HOST} {PORT}")

        threading.Thread(target=client_handler,args=(client, )).start()


if __name__ == '__main__':
    main()