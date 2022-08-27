import express, { Express, Request, Response } from 'express';
import { ReadlineParser, SerialPort } from 'serialport';

import dotenv from 'dotenv';

dotenv.config();

const port: SerialPort = new SerialPort({
	path: process.env.RECEIVER_PORT || '/dev/tty-usbserial1',
	baudRate: 115200,
});

const parser: ReadlineParser = port.pipe(
	new ReadlineParser({
		includeDelimiter: true,
		delimiter: '\n\n',
	})
);

function runCommand(command: string) {
	return new Promise(function (resolve, reject) {
		port.write(command, function () {
			parser.once('data', (data) => {
				resolve(data);
			});
		});
	});
}

const app: Express = express();

app.use(require('body-parser').urlencoded({ extended: false }));

app.post('/', (req: Request, res: Response) => {
	const command = req.body.command;

	runCommand(command).then((result) => {
		res.send({
			output: result,
		});
	});
});

const serverPort: number = Number(process.env.SERVER_PORT || 8000);
const serverHost: string = process.env.SERVER_HOST || '127.0.0.1';

app.listen(serverPort, serverHost, () => {
	console.log(
		`⚡️[server]: Server is running at http://${serverHost}:${serverPort}`
	);
});
