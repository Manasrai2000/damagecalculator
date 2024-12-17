# Import required modules
import socket
import threading

HOST = '127.0.0.1'
# we can use port from 0 - 65535
PORT = 1234
LISTENER_LIMIT = 5

# List of all currently connected client
active_client = []

def listen_for_message(client, username):

    while 1:
        message = client.recv(2048).decode('utf-8')
        if message != '':
            final_msg = username + ": " + message
            send_messages_to_all(final_msg)

        else:
            print("The message send from the client {username} is empty")


def send_messages_to_client(client, message):
    
    client.sendall(message.encode())


# Function to send any new message to all the clients that are currently connected to this server
def send_messages_to_all(message):

    for user  in active_client:
        send_messages_to_client(user[1], message)


# function to handle client
def client_handler(client):
    
    # Server will listen for client message that will contain the username
    while 1:

        username = client.recv(2048).decode('utf-8')
        if username != '':
            active_client.append((username,client))

        else:
            print("Client username is empty")

    threading.Thread(target=listen_for_message)




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