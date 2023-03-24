const chalk = require("chalk")
const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta').locale('id')

const color = (text, colorName) => {
    return chalk[colorName](text)
}

const getBuffer = async (input, optionsOverride = {}) => {
	try {
		if (fs.existsSync(input)) {
			return {
				mimetype: mime.lookup(input),
				buffer: fs.readFileSync(input)
			}
		} else {
			const response = await axios.get(input, {
				responseType: 'arraybuffer',
				...optionsOverride,
			})
			return {
				mimetype: response.headers['content-type'],
				buffer: response.data,
			};
		}
		// return Buffer.from(response.data, 'binary').toString('base64')
	} catch (error) {
		console.log('TCL: getDUrl -> error', error);
	}
}

const humanFileSize = (bytes, si = true, dp = 1) => {
	const thresh = si ? 1000 : 1024;

	if (Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}

	const units = si
		? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
	let u = -1;
	const r = 10 ** dp;

	do {
		bytes /= thresh;
		++u;
	} while (
		Math.round(Math.abs(bytes) * r) / r >= thresh &&
		u < units.length - 1
	);

	return bytes.toFixed(dp) + ' ' + units[u];
}

const secondsConvert = (seconds, hour = false) => {
	const format = val => `0${Math.floor(val)}`.slice(-2)
	const hours = seconds / 3600
	const minutes = (seconds % 3600) / 60
	const res = hour ? [hours, minutes, seconds % 60] : [minutes, seconds % 60]

	return res.map(format).join(':')
}

const processTime = (timestamp, now) => {
    return moment.duration(now - moment(timestamp * 1000)).asSeconds()
}

module.exports = {
    color,
    getBuffer,
    humanFileSize,
    secondsConvert,
	processTime
}