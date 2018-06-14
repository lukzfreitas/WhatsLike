var net = require('net');

var client = net.connect({host: 'localhost', port: 3000}); // alterar localhost para o endereço IP do servidor
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