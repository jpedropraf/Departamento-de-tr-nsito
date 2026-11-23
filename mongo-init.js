const { MongoClient, ObjectId, Decimal128 } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);

const collections = [
  "cidadaos", "condutores", "cnh", "exames", "veiculos", "proprietarios",
  "licenciamentos", "infracoes", "multas", "pagamentos", "processos",
  "unidades_atendimento"
];

async function createCollection(db, name, options = {}) {
  try {
    await db.createCollection(name, options);
  } catch (error) {
    if (error.codeName !== "NamespaceExists") throw error;
  }
}

async function main() {
  await client.connect();
  const db = client.db("detran");

  await createCollection(db, "cidadaos", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["nome", "cpf", "dataNascimento", "status"],
        properties: {
          nome: { bsonType: "string", minLength: 3 },
          cpf: { bsonType: "string", pattern: "^[0-9]{11}$" },
          dataNascimento: { bsonType: "date" },
          status: { enum: ["ativo", "inativo"] }
        }
      }
    },
    validationLevel: "strict",
    validationAction: "error"
  });

  for (const name of collections.filter((item) => item !== "cidadaos")) {
    await createCollection(db, name);
  }

  await db.cidadaos.createIndex({ cpf: 1 }, { unique: true });
  await db.condutores.createIndex({ numeroRegistro: 1 }, { unique: true });
  await db.cnh.createIndex({ numeroCNH: 1 }, { unique: true });
  await db.veiculos.createIndex({ placa: 1 }, { unique: true });
  await db.veiculos.createIndex({ renavam: 1 }, { unique: true });
  await db.multas.createIndex({ numeroAutoInfracao: 1 }, { unique: true });
  await db.multas.createIndex({ veiculoId: 1, situacao: 1 });
  await db.pagamentos.createIndex({ codigoTransacao: 1 }, { unique: true });
  await db.processos.createIndex({ numeroProcesso: 1 }, { unique: true });

  const cidadao = {
    nome: "João da Silva",
    cpf: "12345678901",
    dataNascimento: new Date("1998-05-15"),
    status: "ativo"
  };

  let pessoa = await db.cidadaos.findOne({ cpf: cidadao.cpf });
  if (!pessoa) {
    const result = await db.cidadaos.insertOne(cidadao);
    pessoa = await db.cidadaos.findOne({ _id: result.insertedId });
  }

  let veiculo = await db.veiculos.findOne({ placa: "ABC1D23" });
  if (!veiculo) {
    const result = await db.veiculos.insertOne({
      proprietarioId: pessoa._id,
      placa: "ABC1D23",
      renavam: "00123456789",
      marca: "Fiat",
      modelo: "Argo",
      anoFabricacao: 2024,
      situacao: "ativo"
    });
    veiculo = await db.veiculos.findOne({ _id: result.insertedId });
  }

  const infracao = await db.infracoes.findOneAndUpdate(
    { codigo: "CTB-001" },
    { $setOnInsert: {
      codigo: "CTB-001",
      descricao: "Excesso de velocidade",
      gravidade: "grave",
      pontos: 7
    } },
    { upsert: true, returnDocument: "after" }
  );

  await db.multas.updateOne(
    { numeroAutoInfracao: "AI-2026-000123" },
    { $setOnInsert: {
      infracaoId: infracao._id,
      veiculoId: veiculo._id,
      proprietarioId: pessoa._id,
      numeroAutoInfracao: "AI-2026-000123",
      valorOriginal: Decimal128.fromString("293.47"),
      dataVencimento: new Date("2026-12-10"),
      dataPagamento: null,
      situacao: "pendente"
    } },
    { upsert: true }
  );

  console.log("Banco detran criado e dados iniciais inseridos.");
  await client.close();
}

main().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exitCode = 1;
});
