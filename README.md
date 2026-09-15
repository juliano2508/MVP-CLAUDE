# AgendaFácil

MVP de plataforma de site + agenda para profissionais autônomos. Ver a
especificação completa em [`docs/mvp-site-agenda-autonomos.md`](docs/mvp-site-agenda-autonomos.md).

## Status

Backend inicial (FastAPI + SQLite) implementado, cobrindo o **Fluxo 1
(onboarding do profissional)**:

- Cadastro/login do profissional (JWT), com trial de 14 dias
- Criação/edição da página pública do negócio (slug gerado automaticamente)
- Cadastro de serviços (nome, duração, preço)
- Definição de disponibilidade semanal
- Página pública somente leitura (`GET /p/{slug}`)

Os demais fluxos (agendamento pelo cliente final, painel de gestão de
agendamentos e cobrança/assinatura) ainda não foram implementados — ver
seção 8 do documento de especificação para o roadmap.

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
    routers/
      auth.py              # /auth/register, /auth/login, /auth/me
      onboarding.py         # /me/business-page (+ /services, /availability)
      public.py               # /p/{slug} — página pública do profissional
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
```

## Próximos passos

1. **Fluxo 2** — endpoint público de agendamento: calcular horários livres
   (disponibilidade - agendamentos - bloqueios) e criar `Appointment` sem
   exigir login do cliente final; envio de email de confirmação.
2. **Fluxo 3** — painel do profissional: listar/cancelar/remarcar
   agendamentos, criar `BlockedSlot`.
3. **Fluxo 4** — integração de cobrança (Stripe/Mercado Pago) e expiração de
   trial.
4. Frontend (React + Vite + Tailwind) consumindo esta API.
