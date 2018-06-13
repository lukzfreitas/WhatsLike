var net = require('net');

var client = net.connect(3000);
client.on('connect', function () {	
});
client.on('data', function (message) {
	console.log(message.toString());
});
client.on('close', function () {	
	process.exit();
});
process.stdin.on('readable', function () {
	var message = process.stdin.read();
	if (!message) return;
	message = message.toString().replace(/\n/, '');
	client.write(message);
});