const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { SerialPort } = require('serialport');
const Configs = require('./configs');

let socketConnection = [];

app.get('/', (req, res) => {
    res.send("Hello !");
});

io.on('connection', socket => {
    console.log(`New connection (ID: ${socket.id})`);
    socketConnection.push(socket);

    socket.on("set_speed", newSpeed => {
        console.log("New speed is", newSpeed);

        io.emit("new_speed", newSpeed);
    });

    socket.on("disconnect", () => {
        console.log(`ID: ${socket.id} disconnect`);

        const index = socketConnection.findIndex(a => a.id === socket.id);
        if (index >= 0) {
            socketConnection.splice(index, 1);
        }
    });
});

server.listen(Configs.port, () => {
    console.log('listening on *:3002');
});


// Scan COM port
// SerialPort.list().then
(list => {
    console.log(list);

    /*
    const port = new SerialPort({
        path: Configs.comport,
        baudRate: 9600,
    });

    port.on('data', function (data) {
        console.log('Data:', data);
        const sensor_info = data.split("\t");

        io.emit("value_update", {
            heartRate: +new Date(),
            distance: 12
        });
    });*/
})();

/*
setInterval(() => {
    io.emit("value_update", {
        heartRate: +new Date(),
        distance: 12
    });
}, 2000);
*/

