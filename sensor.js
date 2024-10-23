require('dotenv').config();
const os = require('os');
const { EVENTS } = require('./constants');
const nodeDiskInfo = require('node-disk-info');
const io = require('socket.io')(process.env.PORT);

/**
 * Socket on connection
 */
io.on('connection', (socket) => {
	/**
	 * Socket on Authenticate with password
	 */
	socket.on(EVENTS.AUTHENTICATE, (providedPassword) => {
		if (providedPassword === process.env.TOKEN) {
			socket.emit(EVENTS.AUTHENTICATE, true);
			/**
			 * Socket on global message
			 * send global system informations
			 */
			socket.on(EVENTS.GLOBAL, () => {
				socket.emit(EVENTS.GLOBAL, getGlobalInformations());
			});

			/**
			 * Socket on memories message
			 * send light system informations (cpu usage, max memory, free memory)
			 */
			socket.on(EVENTS.LIGHT, () => {
				socket.emit(EVENTS.LIGHT, getLightInformations());
			});
		} else {
			socket.disconnect();
		}
	});
});

/**
 * Format big integer to bytes string
 * @param {BigInteger} bytes 
 * @param {Number} decimals 
 * @returns {String}
 */
function formatBytes(bytes, decimals = 2) {
	if (!+bytes) return '0 Bytes'
	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
	const i = Math.floor(Math.log(bytes) / Math.log(k))
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Return System global informations
 * @returns {Object}
 */
function getGlobalInformations() {
	const cpuInfo = os.cpus();
	return {
		processor: cpuInfo[0].model,
		cores: cpuInfo.length,
		architecture: os.machine(),
		hostname: os.hostname(),
		platform: os.platform(),
		release: os.release(),
		type: os.type(),
		uptime: getUptime(os.uptime()),
		totalmem: formatBytes(os.totalmem()),
		networkInterfaces: os.networkInterfaces(),
		disks: nodeDiskInfo.getDiskInfoSync()
			.filter(disk => !['/dev', '/var', '/run', '/home', '/boot', '/tmp'].some(path => disk.mounted.includes(path)))
			.map(({ mounted, blocks, capacity, used, available, filesystem }) => ({ mounted, blocks, capacity, used, available, filesystem }))
	}
}

/**
 * Return System light informations
 * @returns {Object}
 */
function getLightInformations() {
	return {
		totalMemory: formatBytes(os.totalmem()),
		freeMemory: formatBytes(os.freemem()),
		ratio: `${(os.freemem() * 100) / os.totalmem()} %`
	}
}

function getUptime(time) {
	const units = [
		{ label: 'day', value: Math.floor(time / (3600 * 24)) },
		{ label: 'hour', value: Math.floor(time % (3600 * 24) / 3600) },
		{ label: 'minute', value: Math.floor(time % 3600 / 60) },
		{ label: 'second', value: Math.floor(time % 60) }
	];
	return units
		.filter(unit => unit.value > 0)
		.map(unit => `${unit.value} ${unit.label}${unit.value > 1 ? 's' : ''}`)
		.join(', ');
}