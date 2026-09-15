# AgendaFácil — Frontend

React + Vite + TypeScript + Tailwind CSS, consumindo a API em `../backend`.

## Rodando localmente

```bash
npm install
cp .env.example .env   # ajuste VITE_API_URL se o backend não estiver em localhost:8000
npm run dev
```

O app sobe em `http://127.0.0.1:5173` (ou porta escolhida pelo Vite).

## Estrutura

```
src/
  lib/
    api.ts          # cliente HTTP tipado para todos os endpoints do backend
    auth.tsx         # AuthContext (JWT em localStorage) + useAuth()
    format.ts         # helpers de formatação (data, hora, preço)
  components/
    Navbar.tsx
    ProtectedRoute.tsx  # redireciona para /login quando não autenticado
  pages/
    LandingPage.tsx           # marketing
    LoginPage.tsx / RegisterPage.tsx
    BusinessPageEditorPage.tsx  # onboarding + edição contínua (dados, serviços, disponibilidade)
    DashboardPage.tsx           # painel do profissional (agendamentos + bloqueios manuais)
    PublicBusinessPage.tsx      # /p/:slug — página pública vista pelo cliente
    BookingPage.tsx             # /p/:slug/agendar/:serviceId — calendário + formulário do cliente
    ConfirmationPage.tsx        # /p/:slug/confirmado
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (`tsc -b && vite build`)
- `npm run lint` — oxlint
- `npm run preview` — pré-visualiza o build de produção

## Pendente

A tela de configurações de assinatura/pagamento (Fluxo 4) ainda não existe,
pois o backend correspondente também não foi implementado.
