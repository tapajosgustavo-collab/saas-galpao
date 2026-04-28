import { PrismaClient, Role, TipoGalpao, StatusGalpao, StatusContrato, StatusPagamento, CategoriaDespesa } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed iniciando...");

  // Tenant demo
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Demo Logística Ltda", slug: "demo" },
  });
  console.log("✓ Tenant:", tenant.name);

  // Admin user
  const passwordHash = await bcrypt.hash("admin12345", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@demo.com",
      name: "Admin Demo",
      passwordHash,
      role: Role.ADMIN,
    },
  });
  console.log("✓ Admin:", admin.email, "(senha: admin12345)");

  // Galpões
  const g1 = await prisma.galpao.create({
    data: {
      tenantId: tenant.id,
      nome: "Galpão Anhanguera 01",
      endereco: "Rod. Anhanguera, km 32",
      cidade: "Cajamar",
      estado: "SP",
      cep: "07750000",
      metragemTotal: 5000,
      metragemDisponivel: 0,
      tipo: TipoGalpao.LOGISTICO,
      valorPorM2: 28.5,
      status: StatusGalpao.OCUPADO,
    },
  });

  const g2 = await prisma.galpao.create({
    data: {
      tenantId: tenant.id,
      nome: "Galpão Embu 02",
      endereco: "Av. Industrial, 1500",
      cidade: "Embu das Artes",
      estado: "SP",
      cep: "06800000",
      metragemTotal: 3200,
      metragemDisponivel: 1200,
      tipo: TipoGalpao.INDUSTRIAL,
      valorPorM2: 32.0,
      status: StatusGalpao.EM_NEGOCIACAO,
    },
  });

  const g3 = await prisma.galpao.create({
    data: {
      tenantId: tenant.id,
      nome: "Galpão Guarulhos 03",
      endereco: "Rod. Pres. Dutra, km 220",
      cidade: "Guarulhos",
      estado: "SP",
      cep: "07120000",
      metragemTotal: 8000,
      metragemDisponivel: 8000,
      tipo: TipoGalpao.ARMAZENAMENTO,
      valorPorM2: 25.0,
      status: StatusGalpao.DISPONIVEL,
    },
  });
  console.log("✓ 3 galpões criados");

  // Contrato ativo no g1
  const contrato = await prisma.contrato.create({
    data: {
      tenantId: tenant.id,
      galpaoId: g1.id,
      numero: "CT-2024-001",
      empresaLocataria: "Mercado Livre Brasil",
      cnpjLocataria: "03007331000141",
      emailLocataria: "contratos@mercadolivre.com",
      dataInicio: new Date("2024-01-01"),
      dataFim: new Date("2026-12-31"),
      valorMensal: 142500,
      diaVencimento: 5,
      reajusteAnual: 5,
      indiceReajuste: "IPCA",
      status: StatusContrato.ATIVO,
    },
  });

  // Contrato vencendo (60 dias)
  const dataFimProxima = new Date();
  dataFimProxima.setDate(dataFimProxima.getDate() + 45);
  await prisma.contrato.create({
    data: {
      tenantId: tenant.id,
      galpaoId: g2.id,
      numero: "CT-2023-007",
      empresaLocataria: "Magalu Logística",
      cnpjLocataria: "47960950000121",
      dataInicio: new Date("2023-06-01"),
      dataFim: dataFimProxima,
      valorMensal: 64000,
      diaVencimento: 10,
      reajusteAnual: 4,
      indiceReajuste: "IGPM",
      status: StatusContrato.ATIVO,
    },
  });
  console.log("✓ 2 contratos criados");

  // Receitas (3 meses)
  const hoje = new Date();
  for (let i = 0; i < 3; i++) {
    const mes = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const venc = new Date(hoje.getFullYear(), hoje.getMonth() - i, 5);
    await prisma.receita.create({
      data: {
        tenantId: tenant.id,
        contratoId: contrato.id,
        competencia: mes,
        vencimento: venc,
        valor: 142500,
        valorPago: i > 0 ? 142500 : null,
        dataPagamento: i > 0 ? venc : null,
        status: i === 0 ? StatusPagamento.PENDENTE : StatusPagamento.PAGO,
      },
    });
  }

  // Receita em atraso
  const vencAtrasado = new Date();
  vencAtrasado.setDate(vencAtrasado.getDate() - 10);
  await prisma.receita.create({
    data: {
      tenantId: tenant.id,
      contratoId: contrato.id,
      competencia: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
      vencimento: vencAtrasado,
      valor: 142500,
      status: StatusPagamento.ATRASADO,
    },
  });
  console.log("✓ 4 receitas criadas (1 atrasada)");

  // Despesas
  await prisma.despesa.createMany({
    data: [
      {
        tenantId: tenant.id,
        galpaoId: g1.id,
        descricao: "IPTU Cajamar - 1ª parcela",
        categoria: CategoriaDespesa.IMPOSTOS,
        competencia: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
        vencimento: new Date(hoje.getFullYear(), hoje.getMonth(), 15),
        valor: 8500,
        pago: false,
      },
      {
        tenantId: tenant.id,
        galpaoId: g2.id,
        descricao: "Manutenção elétrica",
        categoria: CategoriaDespesa.MANUTENCAO,
        competencia: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1),
        vencimento: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 20),
        valor: 3200,
        pago: true,
        dataPagamento: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 18),
      },
    ],
  });
  console.log("✓ 2 despesas criadas");

  console.log("\n✅ Seed concluído!");
  console.log("Login: admin@demo.com / admin12345");
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
