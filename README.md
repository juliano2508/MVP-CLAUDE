# AgendaFácil

MVP de plataforma de site + agenda para profissionais autônomos. Ver a
especificação completa em [`docs/mvp-site-agenda-autonomos.md`](docs/mvp-site-agenda-autonomos.md).

## Status

Backend inicial (FastAPI + SQLite) implementado, cobrindo os 4 fluxos
principais do MVP: **Fluxo 1 (onboarding do profissional)**, **Fluxo 2
(cliente agenda)**, **Fluxo 3 (profissional gerencia)** e **Fluxo 4
(cobrança/assinatura)**:

- Cadastro/login do profissional (JWT), com trial de 14 dias
- Criação/edição da página pública do negócio (slug gerado automaticamente)
- Cadastro de serviços (nome, duração, preço)
- Definição de disponibilidade semanal
- Página pública somente leitura (`GET /p/{slug}`)
- Cálculo de horários livres por serviço/data (disponibilidade menos
  agendamentos já feitos menos bloqueios) — `GET /p/{slug}/services/{id}/available-slots`
- Agendamento pelo cliente final sem precisar criar conta, com checagem de
  conflito (409 se o horário não estiver mais livre) — `POST /p/{slug}/appointments`
- Email de confirmação do agendamento (via SMTP se configurado; caso
  contrário, é apenas logado — útil para desenvolvimento local)
- Painel do profissional: listar agendamentos com filtro por período/status,
  cancelar, remarcar (com a mesma checagem de conflito, ignorando o próprio
  agendamento) — `GET/PATCH /me/business-page/appointments/...`
- Bloqueio manual de horários (folga, compromisso) — `/me/business-page/blocked-slots`
- Assinatura via Stripe (`GET /billing/status`, `POST /billing/checkout`,
  `POST /billing/cancel`, `POST /billing/webhook`): trial de 14 dias
  (já criado no cadastro), e a página pública fica indisponível (`402`)
  quando o trial expira e não há assinatura ativa. **Modo demo**: se
  `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID` não estiverem configurados,
  assinar/cancelar mudam o status na hora, sem chamada real ao Stripe —
  útil para desenvolver e testar sem uma conta Stripe.

Frontend (React + Vite + Tailwind) implementado cobrindo as mesmas telas:
landing, cadastro/login, onboarding + edição da página, painel do
profissional, tela de assinatura (com banner de aviso quando o trial está
acabando ou a assinatura está inativa) e o fluxo público de agendamento
(página pública → escolher serviço/horário → confirmação). Testado de
ponta a ponta no navegador, incluindo o ciclo assinar → cancelar → página
pública bloqueada → assinar de novo → página pública volta a funcionar.

Os 4 fluxos do escopo do MVP (seção 3 da especificação) estão implementados.
Ver seção 8 do documento de especificação para ideias de roadmap pós-MVP.

## Backend

```
backend/
  app/
    main.py          # cria a app FastAPI e inclui os routers
    config.py         # settings via variáveis de ambiente (.env)
    database.py        # engine/sessão SQLAlchemy
    models.py          # modelos: User, BusinessPage, Service,
                        #   AvailabilitySlot, BlockedSlot, Appointment
    schemas.py          # schemas Pydantic de request/response
    security.py         # hash de senha e JWT
    deps.py              # dependência get_current_user
    utils.py              # geração de slug único
    scheduling.py          # cálculo de horários livres (Fluxo 2)
    notifications.py        # email de confirmação de agendamento
    billing.py                # assinatura via Stripe (ou modo demo) (Fluxo 4)
    routers/
      auth.py              # /auth/register, /auth/login, /auth/me
      onboarding.py         # /me/business-page (+ /services, /availability,
                             #   /appointments, /blocked-slots)
      public.py               # /p/{slug}, available-slots, appointments
      billing.py                # /billing/status, /checkout, /cancel, /webhook
```

### Rodando localmente

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env   # ajuste SECRET_KEY em produção

uvicorn app.main:app --reload
```

A API sobe em `http://127.0.0.1:8000`. Documentação interativa (Swagger) em
`http://127.0.0.1:8000/docs`.

### Fluxo de exemplo (onboarding)

```bash
# 1. cadastro
curl -X POST localhost:8000/auth/register -H "Content-Type: application/json" \
  -d '{"nome":"Manu","email":"manu@example.com","senha":"segredo123"}'

# 2. login (retorna access_token)
curl -X POST localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=manu@example.com&password=segredo123"

# 3. criar página pública (usar o token do passo anterior)
curl -X POST localhost:8000/me/business-page -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome_negocio":"Manu Cartomancia","bio":"Leitura de taro online"}'

# 4. cadastrar serviço
curl -X POST localhost:8000/me/business-page/services -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Consulta de Tarô","duracao_minutos":30,"preco":80.0}'

# 5. definir disponibilidade (dia_semana: 0=segunda ... 6=domingo)
curl -X POST localhost:8000/me/business-page/availability -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"dia_semana":0,"hora_inicio":"09:00:00","hora_fim":"18:00:00"}'

# 6. ver a página pública gerada
curl localhost:8000/p/manu-cartomancia

# 7. ver horários livres para um serviço em uma data (cliente final, sem login)
curl "localhost:8000/p/manu-cartomancia/services/1/available-slots?data=2026-01-20"

# 8. agendar (cliente final, sem login)
curl -X POST localhost:8000/p/manu-cartomancia/appointments \
  -H "Content-Type: application/json" \
  -d '{"service_id":1,"data":"2026-01-20","hora_inicio":"09:00:00","cliente_nome":"Cliente","cliente_telefone":"11999999999","cliente_email":"cliente@example.com"}'

# 9. painel: listar agendamentos (opcionalmente filtrado por ?de=&ate=&status=)
curl localhost:8000/me/business-page/appointments -H "Authorization: Bearer TOKEN"

# 10. painel: cancelar um agendamento
curl -X PATCH localhost:8000/me/business-page/appointments/1/cancel -H "Authorization: Bearer TOKEN"

# 11. painel: remarcar um agendamento
curl -X PATCH localhost:8000/me/business-page/appointments/1/reschedule -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":"2026-01-21","hora_inicio":"10:00:00"}'

# 12. painel: bloquear um horário manualmente (folga, compromisso)
curl -X POST localhost:8000/me/business-page/blocked-slots -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":"2026-01-21","hora_inicio":"12:00:00","hora_fim":"13:00:00","motivo":"Almoço"}'

# 13. ver status da assinatura (plano, trial, dias restantes)
curl localhost:8000/billing/status -H "Authorization: Bearer TOKEN"

# 14. assinar (em modo demo, ativa na hora; com Stripe configurado, retorna
#     a URL do Checkout para redirecionar o navegador)
curl -X POST localhost:8000/billing/checkout -H "Authorization: Bearer TOKEN"

# 15. cancelar assinatura
curl -X POST localhost:8000/billing/cancel -H "Authorization: Bearer TOKEN"
```

## Frontend

Ver [`frontend/README.md`](frontend/README.md) para estrutura e instruções
de execução. Resumo:

```bash
cd frontend
npm install
cp .env.example .env   # ajuste VITE_API_URL se necessário
npm run dev
```

O frontend sobe em `http://127.0.0.1:5173` e espera o backend rodando em
`http://127.0.0.1:8000` (ajustável via `VITE_API_URL`).

## Próximos passos (roadmap pós-MVP)

Ver seção 8 do documento de especificação: notificações via WhatsApp,
pagamento do serviço no ato do agendamento, múltiplos profissionais por
conta, app mobile, editor visual mais flexível, lembretes automáticos e
avaliações de clientes.
