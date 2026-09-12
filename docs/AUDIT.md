# Auditoria anterior à reconstrução

Base: 5ba5011d27de0febea5da9ee1b1007b9ddf76539. 29 testes passaram antes das alterações.

## Contratos preservados
- Auth: e-mail/senha, Google, persistência, recuperação, verificação, atualização de perfil, senha e saída. Admin por getIdTokenResult().claims.admin.
- Firestore: users/{uid}, progress/{uid}, modules, notifications, supportTickets, refundRequests, coupons, certificate_requests. Leitura do curso via onSnapshot; progresso e conta por UID.
- Storage: upload de avatar e limites de tipo/tamanho.
- Railway: backendRequest com token Firebase e renovação, /api/session, configuração pública, pagamentos PIX/cartão, cupons, reembolso, gestão individual, notificações.
- Mercado Pago: SDK lazy, campos tokenizados, idempotência, QR e copia/cola. Nenhum pagamento será criado durante QA.
- Progresso: aulas, exercícios obrigatórios, sete etapas, bônus e migração do armazenamento legado. Certificado depende dos requisitos/override existentes.
- Certificado: PDF, posicionamento do nome, metadados, solicitação física, prazo de endereço e confirmação de recebimento. Templates preservados byte a byte.
- Admin: alunos, acesso, progresso manual, conteúdo, exercícios, vendas, pendentes, reembolsos, cupons, suporte, certificado físico, notificações/testes.
- UI: formulários e IDs usados por handlers precisam continuar únicos; dialogs e player gerados dinamicamente.

## Problemas existentes observados
- Cinco estilos antigos, incluindo inline e múltiplos overrides.
- Aula gratuita era apenas uma imagem. Não inventar vídeo se a fonte real estiver vazia.
- Auth podia chegar antes de Firestore e capturar funções ainda indisponíveis.
- PIX não possuía observação ativa de liberação de acesso; backend/webhook está fora deste repositório.
- Etapa zero continha números demonstrativos sem fonte de progresso.
- storage.rules contém exceção administrativa por e-mail; não foi alterada ou implantada nesta reconstrução de frontend.
- E-mail legado de notificações não determina isAdmin.
- Testes visuais antigos verificam nomes de folhas e brilho, precisam ser substituídos por verificações da nova apresentação.
