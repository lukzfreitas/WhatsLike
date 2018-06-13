var net = require('net');

var connections = [];
var grupos = [];

var broadcast = function (message, origin) {
  connections.forEach(function (connection) {
    if (connection === origin) return;
    connection.write(message);
  });
};

var grupoBroadcast = function (participantes, mensagem, origem) {
  participantes.forEach(function (connection) {
    if (connection === origem) return;
    connection.write(mensagem);
  });
}

var criandoGrupo = function (nomeDoGrupo, connection) {
  if (nomeDoGrupo === '' || nomeDoGrupo === undefined) {
    connection.write('Nome do grupo não foi informado');
  } else {
    var grupo = { 'nome': nomeDoGrupo, 'administador': connection.nickname, 'participantes': [connection] };
    grupos.push(grupo);
    if (connection.grupos == undefined) connection.grupos = [];    
    connection.grupos.push(grupo);
    connection.write('Grupo criado com sucesso!');
  }
}

var addParticipanteEmGrupo = function (grupoNome, nicknameParticipante) {
  var connectionFound = null;
  connections.forEach(function (connection) {
    if (connection.nickname == nicknameParticipante) {
      connectionFound = connection;
    }
  });

  if (connectionFound == null) {
    connectionFound.write('Nome do participante não econtrado!' + nicknameParticipante);
  }

  grupos.forEach(function (itemGrupo) {
    if (itemGrupo.nome === grupoNome) {
      itemGrupo.participantes.push(connectionFound);
      if (connectionFound.grupos == undefined) connectionFound.grupos = [];
      connectionFound.push(itemGrupo);
    }
  });
};

var enviaMensagemGrupo = function (grupo, mensagem, origem) {
  grupos.forEach(function (itemGrupo) {
    if (itemGrupo.nome === grupo) {
      grupoBroadcast(itemGrupo.participantes, mensagem, origem)
    }
  });
}

var enviaMensagemParaContato = function (contato, mensagem) {
  var connectionFound = null;
  connections.forEach(function (connection) {
    if (connection.nickname == contato) {
      connectionFound = connection;
    }
  });
  connectionFound.write(mensagem);
}

var adicionarContatoNaLista = function (connection, contato) {
  if (connection.listaDeContatos == undefined) {
    connection.listaDeContatos = [];
  }
  var contatoEncontrado = null;
  connections.forEach(function (contatoConnection) {
    if (contatoConnection.nickname === contato) {
      contatoEncontrado = contatoConnection;      
    }
  });
  if (contatoEncontrado == null) {
    connection.write('Nenhum contato encontrado!\n');
  } else {
    connection.listaDeContatos.push(contatoEncontrado);
  }  
  return;
}

var addNickname = function (connection, nickname) {
  if (nickname === '') {
    connection.write('Nenhum nickname informado\n');
    return;
  }
  if (connection.nickname == undefined) {
    connection.write('Nickname criado\n');
  } else {    
    broadcast(connection.nickname + ' agora é ' + nickname);
  }
  connection.nickname = nickname;
}

var exibeDetalhes = function (connection) {    
  var strContatos = '';
  if (connection.listaDeContatos == undefined) {
    connection.write('Nenhum contato localizado!\n');    
  } else {
    for (var i = 0; i < connection.listaDeContatos.length; i++) {
      strContatos = strContatos + connection.listaDeContatos[i].nickname + ', ';
    } 
    connection.write('lista de contatos:' + strContatos + '\n');    
  }    

  var strGrupos = '';
  if (connection.grupos == undefined) {
    connection.write('Nenhum grupo pertencente!\n');    
  } else {
    for (var i = 0; i < connection.grupos.length; i++) {
      strGrupos = strGrupos + connection.grupos[i].nome + ', ';
    }
    connection.write('lista de grupos:' + strGrupos + '\n');
  }
}

var exibeComandos = function (connection) {
  connection.write(
    connection.nickname + ' está conectado(a)!!!\n'
    + '\nComandos:\n' 
    + '1 - criar nickname (exemplo: 1 fulano) \n' 
    + '2 - adicionar contato (exemplo: 2 fulano) \n'
    + '3 - enviar mensagem a contato (exemplo: 3 contato => mensagem ) \n'
    + '4 - criar grupo (exemplo: 4 nome do grupo ) \n'
    + '5 - adicionar participante em grupo (exemplo: 5 grupo => participante ) \n'
    + '6 - enviar mensagem no grupo (exemplo: 6 grupo => mensagem) \n'
    + '7 - detalhes \n'
  );
}

net.createServer(function (connection) {
  connections.push(connection);
  connection.write('Você está conectado ao servidor\n');  
  exibeComandos(connection);

  connection.on('data', function (message) {
    var command = message.toString();

    if (command.indexOf('1 -') === 0) {
      var nickname = command.replace('1 -', '').trim();
      addNickname(connection, nickname);      
      exibeComandos(connection);
      return;
    }

    if (command.indexOf('2 -') === 0) {      
      var contato = command.replace('2 -', '').trim();
      adicionarContatoNaLista(connection, contato);
      exibeComandos(connection);
      return;
    }

    if (command.indexOf('3 -') === 0) {
      var contatoMensagem = command.replace('3 -', '').trim();
      var contato = contatoMensagem.substring(0, contatoMensagem.indexOf("=>")).trim();
      var mensagem = contatoMensagem.split("=>").pop();
      enviaMensagemParaContato(contato, connection.nickname + ' > ' + mensagem);
    }

    if (command.indexOf('4 -') === 0) {
      var nomeDoGrupo = command.replace('4 -', '').trim();
      criandoGrupo(nomeDoGrupo, connection);
      exibeComandos(connection);
      return;
    }

    if (command.indexOf('5 -') === 0) {
      var grupoParticipante = command.replace('5 -', '').trim();
      var grupo = grupoParticipante.substring(0, grupoParticipante.indexOf("=>")).trim();
      var nicknameParticipante = grupoParticipante.split("=>").pop().trim();
      addParticipanteEmGrupo(grupo, nicknameParticipante);
      connection.write('Participante Adicionado!\n');
      exibeComandos(connection);
      return;
    }

    if (command.indexOf('6 -') === 0) {
      var grupoMensagem = command.replace('6 -', '').trim();
      var grupo = grupoMensagem.substring(0, grupoMensagem.indexOf("=>")).trim();
      var mensagem = grupoMensagem.split("=>").pop();
      enviaMensagemGrupo(grupo, connection.nickname + ' > ' + mensagem);      
      return;
    }

    if (command.indexOf('7 -') === 0) {      
      exibeDetalhes(connection);
      exibeComandos(connection);
      return;
    }
    
    if (command.indexOf('0 -') === 0 ){
      connection.write('bye bye');
      connection.destroy();
    }

    // broadcast(connection.nickname + ' > ' + message, connection);
  });

  connection.on('close', function () {
    broadcast(connection.nickname + ' saiu!', connection);
    connections.splice(connections.indexOf(connection), 1);
  });

  connection.on('error', function (erro) {
  });


}).listen(3000);