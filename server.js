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
    connection.mensagensGrupo.push(mensagem);
  });
}

var criandoGrupo = function (nomeDoGrupo, connection) {
  if (nomeDoGrupo === '' || nomeDoGrupo === undefined) {
    connection.write('Nome do grupo não foi informado');
  } else {
    var grupo = { 'nome': nomeDoGrupo, 'administador': connection.nickname, 'participantes': [connection] };
    grupos.push(grupo);
    connection.grupos.push(grupo);
    connection.write('Grupo criado com sucesso!');
  }
}

var nickenameExiste = function (nickname) {
  return connections.find(function (connection) {
    return connection.nickname === nickname;
  });
}

var addParticipanteEmGrupo = function (connection, grupoNome, nicknameParticipante) {

  connectionFound = connection.listaDeContatos.find(function (contato) {
    return contato.nickname === nicknameParticipante
  });
  if (connectionFound === undefined) {
    connection.write('Participante não encontrado na lista de contatos');
    return;
  }

  grupos.forEach(function (itemGrupo) {
    if (itemGrupo.nome === grupoNome) {
      itemGrupo.participantes.push(connectionFound);
      if (connectionFound.grupos === undefined) connectionFound.grupos = [];
      connectionFound.push(itemGrupo);
    }
  });
  connection.write('Participante Adicionado!\n');
};

var enviaMensagemGrupo = function (grupo, mensagem, origem) {
  grupos.forEach(function (itemGrupo) {
    if (itemGrupo.nome === grupo) {
      grupoBroadcast(itemGrupo.participantes, mensagem, origem)
    }
  });
}

var enviaMensagemParaContato = function (connection, contato, mensagem) {
  var connectionFound = connections.find(function (connectionItem) {
    return connectionItem.nickname === contato;
  });
  if (connectionFound === undefined) {
    connection.write('Contato não encontrado na lista de contatos');
    return;
  }    
  connectionFound.mensagens.push(mensagem);
  connection.mensagens.push(mensagem);
}

var adicionarContatoNaLista = function (connection, contato) {  
  var contatoEncontrado = connections.find(function (connectionItem) {
    return connectionItem.nickname === contato;
  });
  if (contatoEncontrado === undefined) {
    connection.write('Nenhum contato encontrado!\n');
    return;
  }
  connection.listaDeContatos.push(contatoEncontrado);
  connection.write('Contato adicionado!\n');
}

var addNickname = function (connection, nickname) {
  connection = getConnection(connection, connection.ip);  
  if (nickname === '') {
    connection.write('Nenhum nickname informado\n');
    return;
  }
  if (nickname.length > 8) {
    connection.write('Nickname tamanho maior que 8 caracteres');
    return;
  }
  if (nickenameExiste(nickname) !== undefined) {
    connection.write('Nickname já existe');
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
  // connectionCopy = getConnection(connection, connection.ip);
  if (connection.listaDeContatos.length === 0) {
    connection.write('Nenhum contato localizado!\n');
  } else {
    for (var i = 0; i < connection.listaDeContatos.length; i++) {
      strContatos = strContatos + connection.listaDeContatos[i].nickname + ', ';
    }
    connection.write('lista de contatos:' + strContatos + '\n');
  }

  var strGrupos = '';
  if (connection.grupos.length === 0) {
    connection.write('Nenhum grupo pertencente!\n');
  } else {
    for (var i = 0; i < connection.grupos.length; i++) {
      strGrupos = strGrupos + connection.grupos[i].nome + ', ';
    }
    connection.write('lista de grupos:' + strGrupos + '\n');
  }
}

var exibeHistoricoMsg = function (connection) {
  var strMensagem = '';
  if (connection.mensagens.length === 0) {
    connection.write('Nenhuma mensagem encontrada!\n');
  } else {
    for (var i = 0; i < connection.mensagens.length; i++) {
      nickname = connection.mensagens[i].substring(0, connection.mensagens[i].indexOf(">")).trim();
      connectionFound = connections.find(function (connectionItem) {
        return nickname === connectionItem.nickname;
      });
      if (connectionFound !== undefined) {
        connectionFound.write(connection.nickname + ' leu sua mensagem => ' + connection.mensagens[i]);
        connectionFound.mensagens = [];
      }      
      strMensagem = strMensagem + connection.mensagens[i] + '\n';
    }
    connection.write(strMensagem + '\n');
    connection.mensagens = [];
  }
}

var exibeHistoricoMsgGrupo = function (connection) {
  var strMensagem = '';
  if (connection.mensagensGrupo.length === 0) {
    connection.write('Nenhuma mensagem encontrada!\n');
  } else {
    for (var i = 0; i < connection.mensagensGrupo.length; i++) {      
      nickname = connection.mensagensGrupo[i].substring(0, connection.mensagensGrupo[i].indexOf(">")).trim();
      connectionFound = connections.find(function (connectionItem) {
        return nickname === connectionItem.nickname;
      });
      if (connectionFound !== undefined) {
        connectionFound.write(connection.nickname + ' leu sua mensagem => ' + connection.mensagensGrupo[i]);
        connectionFound.mensagensGrupo = [];
      }      
      strMensagem = strMensagem + connection.mensagensGrupo[i] + '\n';
    }
    connection.write(strMensagem + '\n');
    connection.mensagensGrupo = [];
  }
}

var getConnection = function (connection, ip) {
  return connections.find(function (connectionItem) {
    return ip === connectionItem.ip;
  });
}

var exibeComandos = function (connection) {
  connection.write(
    '\nComandos:\n'
    + '1 - criar nickname (exemplo: 1 - fulano) \n'
    + '2 - adicionar contato (exemplo: 2 - fulano) \n'
    + '3 - enviar mensagem a contato (exemplo: 3 - contato => mensagem ) \n'
    + '4 - criar grupo (exemplo: 4 - nome do grupo ) \n'
    + '5 - adicionar participante em grupo (exemplo: 5 - grupo => participante ) \n'
    + '6 - enviar mensagem no grupo (exemplo: 6 - grupo => mensagem) \n'
    + '7 - detalhes \n'
    + '8 - histórico de mensagens \n'
    + '9 - historico de mensagens em grupos \n'
    + '0 - sair \n'
  );
}

net.createServer(function (connection) {

  connection.on('data', function (message) {

    var command = message.toString();    
    if (command.indexOf('ip -') === 0) {
      var ip = command.replace('ip -', '').trim();
      console.log('Ip conectado ' + ip);
      connectionExists = getConnection(connection, ip);
      if (connectionExists === undefined) {
        connection.listaDeContatos = [];
        connection.grupos = [];
        connection.mensagens = [];
        connection.mensagensGrupo = [];
        connection.ip = ip;
        connections.push(connection);
        connection.write('Bem vindo!!! Você está conectado ao servidor\n');
      } else {
        connection.nickname = connectionExists.nickname;
        connection.listaDeContatos = connectionExists.listaDeContatos;
        connection.grupos = connectionExists.grupos;
        connection.mensagens = connectionExists.mensagens;
        connection.mensagensGrupo = connectionExists.mensagensGrupo;
        if (connection.nickname !== undefined) {
          connection.write(connection.nickname + ' você está novamente conectado ao servidor\n');
        } else {
          connection.write('Você está novamente conectado ao servidor\n');
        }
      }
    }


    exibeComandos(connection);

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
      enviaMensagemParaContato(connection, contato, connection.nickname + ' > ' + mensagem);
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
      addParticipanteEmGrupo(connection, grupo, nicknameParticipante);
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

    if (command.indexOf('8 -') === 0) {
      exibeHistoricoMsg(connection);
      exibeComandos(connection);
      return;
    }

    if (command.indexOf('9 -') === 0) {
      exibeHistoricoMsgGrupo(connection);
      exibeComandos(connection);
      return;
    }

    if (command.indexOf('0 -') === 0) {
      connection.write('bye bye');
      connection.destroy();
      return;
    }
    // connection.ip = command;
  });

  connection.on('close', function () {
    broadcast(connection.nickname + ' saiu!', connection);
  });

  connection.on('error', function (erro) {
  });

}).listen(3000);
