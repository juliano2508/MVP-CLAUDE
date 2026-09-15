# MVP: Plataforma de Site + Agenda para Autônomos

## 1. Visão Geral

**Nome de trabalho:** AgendaFácil (pode trocar depois)

**Problema que resolve:** profissionais autônomos (tarólogos, tatuadores, terapeutas, personal trainers, esteticistas, professores particulares) não têm uma página profissional própria nem sistema de agendamento, e dependem de WhatsApp/Instagram bagunçado para marcar horários.

**Proposta de valor:** em minutos, o profissional cria uma página pública (nome, foto, serviços, preços, bio) com um sistema de agendamento embutido, sem precisar saber programar. O cliente final acessa o link, vê os horários disponíveis e agenda sozinho.

**Modelo de negócio:** SaaS por assinatura mensal (ex: R$29-49/mês por profissional), com um plano free limitado (ex: até 5 agendamentos/mês) para geração de leads.

**Clientes-piloto reais para validar:** Manu (Cartomancia) e o pessoal do Talento Pudim — já são contatos existentes, ótimo para primeiros testes e feedback.

---

## 2. Personas

- **Profissional (usuário pagante):** autônomo que quer presença online + agenda organizada sem contratar agência ou dev.
- **Cliente final (usuário do link público):** pessoa que acha o profissional (via Instagram, indicação, Google) e quer agendar um horário rápido, sem precisar criar conta.

---

## 3. Escopo do MVP (o que ENTRA)

1. **Cadastro do profissional** (email/senha)
2. **Editor de página pública básico:**
   - Nome do negócio, foto/logo, bio curta
   - Lista de serviços (nome, duração, preço)
   - Cores/tema simples (2-3 templates prontos, não editor visual complexo)
3. **Página pública do profissional** (`/p/nome-do-negocio`)
   - Mostra serviços e botão "Agendar"
4. **Sistema de agenda:**
   - Profissional define dias/horários disponíveis (ex: seg-sex, 9h-18h, slots de 30/60min)
   - Bloqueio manual de horários (folga, compromisso)
   - Cliente final escolhe serviço + horário disponível, informa nome/telefone/email (sem precisar criar conta)
   - Confirmação por email (e futuramente WhatsApp)
5. **Painel do profissional:**
   - Lista de agendamentos (próximos e histórico)
   - Cancelar/remarcar
6. **Assinatura:**
   - Integração de pagamento simples (Stripe ou Mercado Pago) para cobrança recorrente
   - Trial grátis de 14 dias

## Fora do escopo do MVP (deixar para depois)
- Pagamento do cliente final pelo serviço (só agendamento, sem cobrança do agendamento em si)
- Notificação via WhatsApp automatizada (usar email no MVP)
- App mobile nativo (MVP é web responsivo)
- Múltiplos profissionais por conta (equipes/funcionários)
- Editor de página totalmente customizável (drag-and-drop)
- Relatórios financeiros avançados

---

## 4. Modelo de Dados (entidades principais)

```
User (profissional)
- id, nome, email, senha_hash, criado_em
- plano (free | pago), status_assinatura, trial_fim

BusinessPage (página pública)
- id, user_id, slug (usado na URL), nome_negocio, bio, foto_url, tema

Service (serviço oferecido)
- id, business_page_id, nome, duracao_minutos, preco, ativo

AvailabilitySlot (disponibilidade recorrente)
- id, business_page_id, dia_semana, hora_inicio, hora_fim

BlockedSlot (bloqueio manual)
- id, business_page_id, data, hora_inicio, hora_fim, motivo

Appointment (agendamento)
- id, business_page_id, service_id, cliente_nome, cliente_telefone, cliente_email
- data, hora_inicio, hora_fim, status (confirmado | cancelado | concluido), criado_em
```

---

## 5. Fluxos Principais

**Fluxo 1 — Onboarding do profissional**
1. Cadastro (email/senha)
2. Preenche dados da página (nome, bio, foto)
3. Cadastra 1+ serviços
4. Define disponibilidade semanal
5. Recebe link público (`seusite.com/p/manu-cartomancia`)

**Fluxo 2 — Cliente agenda**
1. Acessa o link público
2. Escolhe um serviço
3. Vê calendário com horários livres (calculado a partir de disponibilidade - agendamentos já feitos - bloqueios)
4. Escolhe horário, preenche nome/telefone/email
5. Recebe confirmação por email

**Fluxo 3 — Profissional gerencia**
1. Login no painel
2. Vê lista de agendamentos do dia/semana
3. Pode cancelar ou bloquear horários manualmente

**Fluxo 4 — Cobrança**
1. Trial de 14 dias ao cadastrar
2. Ao expirar, precisa assinar para manter página pública ativa
3. Cobrança recorrente mensal via Stripe/Mercado Pago

---

## 6. Stack Técnico Sugerido

- **Frontend:** React + Vite, Tailwind (rápido de estilizar, você já usa React)
- **Backend:** Python com FastAPI (rápido de prototipar, tipagem ajuda) — alternativa: Node/Express se preferir manter tudo em JS
- **Banco de dados:** PostgreSQL (ou SQLite no início para simplificar o MVP local)
- **Autenticação:** JWT simples ou uma lib como Auth.js/Clerk se quiser economizar tempo
- **Pagamentos:** Stripe (mais fácil de integrar) ou Mercado Pago (melhor para Pix/Brasil)
- **Hospedagem inicial:** Vercel (frontend) + Railway/Render (backend + banco) — baixo custo para validar

---

## 7. Telas do MVP

1. Landing page do produto (marketing, "crie sua página em 5 min")
2. Cadastro/Login
3. Onboarding (criar página + serviços + disponibilidade)
4. Painel do profissional (dashboard de agendamentos)
5. Editor da página pública
6. Página pública do profissional (vista pelo cliente)
7. Tela de agendamento (calendário + formulário do cliente)
8. Tela de confirmação
9. Configurações de assinatura/pagamento

---

## 8. Roadmap Pós-MVP (ideias futuras, não implementar agora)

- Notificações via WhatsApp (API oficial ou Twilio)
- Pagamento do serviço no ato do agendamento
- Múltiplos profissionais/equipe por conta
- App mobile
- Editor visual mais flexível
- Lembretes automáticos 24h antes do agendamento
- Avaliações/reviews de clientes

---

## 9. Prompt Inicial Sugerido para o Claude Code

```
Quero começar o MVP de um SaaS de "site + agenda para autônomos" descrito no
arquivo mvp-site-agenda-autonomos.md. Vamos começar pelo backend: crie a
estrutura do projeto FastAPI + PostgreSQL (ou SQLite para dev local) com os
modelos de dados descritos na seção 4, e os endpoints para o Fluxo 1
(onboarding do profissional) primeiro. Depois seguimos para os outros fluxos.
```
