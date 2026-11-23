# Departamento de Trânsito — MongoDB

Projeto educacional em JavaScript que simula o banco de dados de um departamento de trânsito. Ele demonstra a modelagem de documentos, a criação de coleções e índices, validação de dados e operações CRUD com o MongoDB.

O banco fictício é criado com o nome `detran` e organiza informações relacionadas a cidadãos, condutores, CNHs, exames, veículos, proprietários, licenciamentos, infrações, multas, pagamentos, processos e unidades de atendimento.

## Estrutura do projeto

- `mongo-init.js`: cria o banco e suas coleções, configura um validador para cidadãos, cria índices e insere dados iniciais;
- `crud.js`: contém exemplos de operações de criação, consulta, atualização e exclusão;
- `package.json`: define as dependências e os comandos de execução;
- `README.md`: descreve o projeto e sua utilização.

## Pré-requisitos

- Node.js;
- npm;
- MongoDB local ou MongoDB Atlas.

## Instalação

```bash
npm install
```

Configure a variável `MONGODB_URI` quando desejar conectar o projeto a uma instância diferente da MongoDB local padrão:

```bash
MONGODB_URI="mongodb://127.0.0.1:27017" npm run init-db
```

Para o MongoDB local em `127.0.0.1:27017`, basta executar:

```bash
npm run init-db
npm start
```

O comando `npm run init-db` cria as 12 coleções, aplica o validador da coleção `cidadaos`, configura índices e registra um cidadão, veículo, infração e multa como dados iniciais.

## Operações disponíveis

O arquivo `crud.js` exporta funções que podem ser reutilizadas em uma aplicação:

- `cadastrarVeiculo`: cria um veículo;
- `consultarMultasPorPlaca`: consulta multas pendentes associadas a uma placa;
- `atualizarCNH`: altera a data de validade de uma CNH;
- `adicionarPontuacao`: incrementa a pontuação de um condutor;
- `excluirPagamento`: remove somente pagamentos cancelados;
- `registrarMultaComPontuacao`: registra uma multa e adiciona pontos ao condutor em uma transação;
- `fechar`: encerra a conexão com o MongoDB.

Ao executar `node crud.js` diretamente, o projeto demonstra a consulta de multas pendentes para a placa `ABC1D23`.

> Algumas operações com sessão e transações exigem que o MongoDB esteja configurado como replica set. A inicialização e as operações CRUD comuns funcionam em uma instância local padrão.
