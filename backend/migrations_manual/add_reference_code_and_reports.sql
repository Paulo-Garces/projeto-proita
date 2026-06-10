-- ====================================================================
-- proITA — Script SQL para Supabase/PostgreSQL (VERSÃO ATUALIZADA)
-- Sistema de Códigos de Referência + Tabela de Denúncias (com details e reporterUserId)
-- Execute as 3 etapas em ordem no SQL Editor do Supabase
-- ====================================================================


-- ====================================================================
-- ETAPA 1: Adicionar coluna referenceCode na tabela Profile
-- ====================================================================

ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "referenceCode" TEXT;


-- ====================================================================
-- ETAPA 2: Backfill — Admin recebe PRO-001, demais recebem sequência
-- ====================================================================

DO $$
DECLARE
  admin_profile_id TEXT;
  profile_rec RECORD;
  counter INT := 2;
BEGIN

  -- Passo 1: Encontra o perfil do admin e atribui PRO-001
  SELECT p.id INTO admin_profile_id
  FROM "Profile" p
  JOIN "User" u ON p."userId" = u.id
  WHERE u.role = 'ADMIN'
  ORDER BY p."createdAt" ASC
  LIMIT 1;

  IF admin_profile_id IS NOT NULL THEN
    UPDATE "Profile"
    SET "referenceCode" = 'PRO-001'
    WHERE id = admin_profile_id;
    RAISE NOTICE 'Admin profile (%) recebeu PRO-001', admin_profile_id;
  ELSE
    RAISE NOTICE 'Nenhum usuário ADMIN encontrado. Ajuste o WHERE se necessário.';
  END IF;

  -- Passo 2: Atribui códigos sequenciais a todos os outros perfis sem código
  FOR profile_rec IN
    SELECT id FROM "Profile"
    WHERE "referenceCode" IS NULL
    ORDER BY "createdAt" ASC
  LOOP
    UPDATE "Profile"
    SET "referenceCode" = 'PRO-' || LPAD(counter::TEXT, 3, '0')
    WHERE id = profile_rec.id;
    counter := counter + 1;
  END LOOP;

  RAISE NOTICE 'Backfill concluído. Total de perfis numerados: %', counter - 1;
END $$;

-- Após o backfill, adicionar a constraint UNIQUE
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_referenceCode_key" UNIQUE ("referenceCode");


-- ====================================================================
-- ETAPA 3: Criar tabela de denúncias (Central de Moderação)
-- Versão atualizada com campos: details e reporterUserId
-- ====================================================================

CREATE TABLE IF NOT EXISTS "Report" (
  "id"             TEXT         NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "adId"           TEXT         NOT NULL,
  "reason"         TEXT         NOT NULL,
  "details"        TEXT,
  "reporterUserId" TEXT,
  "status"         TEXT         NOT NULL DEFAULT 'pendente',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Report_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "Report_adId_fkey" FOREIGN KEY ("adId")
    REFERENCES "Profile"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Report_adId_idx"   ON "Report"("adId");
CREATE INDEX IF NOT EXISTS "Report_status_idx" ON "Report"("status");

-- ====================================================================
-- VERIFICAÇÃO FINAL (opcional — rode para conferir)
-- ====================================================================

-- Verificar referenceCode por perfil:
-- SELECT u.role, p."referenceCode", p."createdAt"
-- FROM "Profile" p
-- JOIN "User" u ON p."userId" = u.id
-- ORDER BY p."referenceCode" ASC;

-- Verificar tabela Report:
-- SELECT * FROM "Report" LIMIT 10;
