const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const Configs = require('./configs');

let socketConnection = [];
let port = null;

app.get('/', (req, res) => {
    res.send("Hello !");
});

io.on('connection', socket => {
    console.log(`New connection (ID: ${socket.id})`);
    socketConnection.push(socket);

    socket.on("control", data => {
        console.log(data);

        if (typeof data.speed !== "undefined") {
            const newSpeed = data.speed;
            console.log("New speed is", newSpeed);
            
            port.write(`S${newSpeed}`);
        }

        if (typeof data.reset !== "undefined") {
            console.log("Reset");
            
            port.write(`R`);
        }
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


const reconnectSerial = () => {
    // Scan COM port
    SerialPort.list().then(list => {
        // console.log(list);

        if (list.length >= 1) {
            Configs.comport = list[0]?.path;
        }

        port = new SerialPort({
            path: Configs.comport,
            baudRate: 9600,
        }, err => {
            if (err) {
                setTimeout(reconnectSerial, 1000);
                console.log(Configs.comport, "connect fail");
                return;
            }

            // Fixed ESP32 go to Bootloader Mode after press Reset Button
            port.set({
                dtr: true,
                rts: true
            });

            console.log(Configs.comport, "Connected");
        });

        const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }))
        parser.on("data", data => {
            console.log('Data:', data);
            const [ heartRate, distance, speed, weight, emergency ] = data.split("\t");
            // console.log(heartRate, distance);

            io.emit("value_update", {
                heartRate: +heartRate || 0,
                distance: (+distance / 1000).toFixed(3) || 0,
                speed: +speed || 0,
                weight: +weight || 0,
                emergency: 1 - (+emergency)
            });
        });

        port.on("close", () => {
            console.log(Configs.comport, "Disconnect");
            setTimeout(reconnectSerial, 1000);
        })
    });
}

reconnectSerial();

/*
setInterval(() => {
    io.emit("value_update", {
        heartRate: +new Date(),
        distance: 12
    });
}, 2000);
*/

