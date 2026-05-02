-- ALTER TYPE para enum requer transacoes separadas em alguns casos.
-- Mantido em migration propria para evitar problemas de commit.

ALTER TYPE "TipoAlerta" ADD VALUE 'DOCUMENTO_VENCENDO';
ALTER TYPE "TipoAlerta" ADD VALUE 'IPTU_PENDENTE';
