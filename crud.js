const { MongoClient, ObjectId, Decimal128 } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

async function cadastrarVeiculo(dados) {
  const db = client.db("detran");
  const result = await db.collection("veiculos").insertOne({
    proprietarioId: new ObjectId(dados.proprietarioId),
    placa: dados.placa.toUpperCase(),
    renavam: dados.renavam,
    marca: dados.marca,
    modelo: dados.modelo,
    anoFabricacao: dados.anoFabricacao,
    situacao: dados.situacao || "ativo"
  });
  return db.collection("veiculos").findOne({ _id: result.insertedId });
}

async function consultarMultasPorPlaca(placa) {
  const db = client.db("detran");
  const veiculo = await db.collection("veiculos").findOne({ placa: placa.toUpperCase() });
  if (!veiculo) return { veiculo: null, multas: [] };

  const multas = await db.collection("multas").find({
    veiculoId: veiculo._id,
    situacao: "pendente"
  }).toArray();

  return { veiculo, multas };
}

async function atualizarCNH(numeroCNH, dataValidade) {
  const db = client.db("detran");
  return db.collection("cnh").updateOne(
    { numeroCNH },
    { $set: { dataValidade: new Date(dataValidade) } }
  );
}

async function adicionarPontuacao(numeroRegistro, pontos) {
  const db = client.db("detran");
  return db.collection("condutores").updateOne(
    { numeroRegistro },
    { $inc: { pontuacaoAtual: pontos } }
  );
}

async function excluirPagamento(codigoTransacao) {
  const db = client.db("detran");
  return db.collection("pagamentos").deleteOne({
    codigoTransacao,
    situacao: "cancelado"
  });
}

async function registrarMultaComPontuacao(multa, numeroRegistro, pontos) {
  const db = client.db("detran");
  const session = client.startSession();

  try {
    let resultado;
    await session.withTransaction(async () => {
      resultado = await db.collection("multas").insertOne({
        ...multa,
        infracaoId: new ObjectId(multa.infracaoId),
        veiculoId: new ObjectId(multa.veiculoId),
        proprietarioId: new ObjectId(multa.proprietarioId),
        valorOriginal: Decimal128.fromString(String(multa.valorOriginal))
      }, { session });

      const atualizacao = await db.collection("condutores").updateOne(
        { numeroRegistro },
        { $inc: { pontuacaoAtual: pontos } },
        { session }
      );

      if (atualizacao.matchedCount === 0) {
        throw new Error("Condutor não encontrado. A transação foi cancelada.");
      }
    });
    return resultado;
  } finally {
    await session.endSession();
  }
}

async function fechar() {
  await client.close();
}

module.exports = {
  client,
  cadastrarVeiculo,
  consultarMultasPorPlaca,
  atualizarCNH,
  adicionarPontuacao,
  excluirPagamento,
  registrarMultaComPontuacao,
  fechar
};

if (require.main === module) {
  (async () => {
    await client.connect();
    const resultado = await consultarMultasPorPlaca("ABC1D23");
    console.dir(resultado, { depth: null });
    await fechar();
  })().catch(async (error) => {
    console.error(error);
    await fechar();
    process.exitCode = 1;
  });
}
