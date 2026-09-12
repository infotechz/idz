# Correção de UX e temas — 12/09/2026

## Diagnóstico

O domínio estava servindo a versão b8dd2f7. Não era apenas um problema de cache: os componentes e as imagens de fundo mantinham cores azuis fixas. O CSS de tema tinha sido adicionado antes dos componentes, e a logo do cabeçalho ainda apontava para a versão redesenhada. O RGB aplicava hue-rotate ao card inteiro, incluindo seu conteúdo.

## Alterações

- Logo oficial existente `assets/idz/brand/logo-horizontal.png` restaurada no cabeçalho, drawer e rodapé, preservando proporções. Login já usava esse arquivo.
- Cores azuis dos componentes convertidas na origem para HSL com `--theme-hue`; tokens de superfície e aliases definidos no body. Fundos de imagens azuis removidos. Status de sucesso/erro e identidade dos assets permanecem sem recoloração.
- RGB usa gradiente na borda do botão e animação de 24 segundos, sem filtro no conteúdo; respeita movimento reduzido.
- Menu do aluno: Início, Meu curso, Projeto Final, Certificado, Bônus, Ajuda e Minha conta, além de Sair.
- Admin organizado por Visão geral, Alunos, Curso, Financeiro, Atendimento, Certificados e Configurações; rotas originais mantidas em submenus.
- Configurações agrupadas por Minha conta, Preferências e Ajuda. Conexões deixa de ser uma aba principal; implementação preservada.
- Dashboard com três métricas, ação Continuar estudando e atalhos para projeto/certificado.
- Meu curso concentra as três abas. Seletor de módulos não usa mais a antiga lista completa com bônus. Exercícios abrem em área própria sem player.
- Aula prioriza mídia e título; descrição e objetivos ficam no accordion Sobre esta aula. Lista do módulo recolhível e botão Concluir junto à navegação.
- Arquivos CSS/JS versionados na página para que a atualização não reutilize recursos antigos do cache.

## Validação

18 testes unitários. Teste Playwright com fixtures isoladas de Firebase/API/Mercado Pago; 405 combinações de view/largura. Cinco temas comparados por estilo computado e captura. Larguras incluem 360, 390, 412, 768, 1366 e 1920. Recarregamento verifica persistência do tema; movimento reduzido desativa animação RGB. Sem pagamentos ou gravações em produção nesses testes.
