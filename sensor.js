const net = require("net");
const os = require('os');
const nodeDiskInfo = require('node-disk-info');

const port = 3001;

const server = net.createServer((socket) => {
    console.log("Client connected");
    const result = {
        processor: os.cpus()[0].model,
        cores: os.cpus().length / 2,
        architecture: os.machine(),
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        totalmem: formatBytes(os.totalmem()),
        networkInterfaces: os.networkInterfaces(),
        disks: nodeDiskInfo.getDiskInfoSync().filter((disk) => 
            !disk.mounted.includes('/dev') && 
            !disk.mounted.includes('/var') &&
            !disk.mounted.includes('/run') &&
            !disk.mounted.includes('/home') &&
            !disk.mounted.includes('/boot') &&
            !disk.mounted.includes('/tmp')
        ).map((disk) => {
            return {
                mounted: disk.mounted,
                blocks: disk.blocks,
                capacity: disk.capacity,
                used: disk.used,
                available: disk.available,
                filesystem: disk.filesystem
            }
        })
    }

    socket.write(new Buffer.from(JSON.stringify(result)))

    socket.on("data", (data) => {
        const strData = data.toString();
        console.log(`Received: ${strData}`);

        const command = strData.split(",");
        const operator = command[0];
        const operand1 = parseFloat(command[1]);
        const operand2 = parseFloat(command[2]);
        let result;

        switch (operator) {
            case "add":
                result = operand1 + operand2;
                break;
            case "sub":
                result = operand1 - operand2;
                break;
        }

        socket.write(result.toString());
    });

    socket.on("end", () => {
        console.log("Client disconnected");
    });

    socket.on("error", (error) => {
        console.log(`Socket Error: ${error.message}`);
    });
});

server.on("error", (error) => {
    console.log(`Server Error: ${error.message}`);
});

server.listen(port, () => {
    console.log(`TCP socket server is running on port: ${port}`);
});

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}