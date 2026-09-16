import { Link } from 'react-router-dom'

const BENEFICIOS = [
  {
    titulo: 'Sua página em minutos',
    descricao:
      'Nome, foto, bio e serviços com preços — sem precisar saber programar ou contratar ninguém.',
  },
  {
    titulo: 'Agenda que se organiza sozinha',
    descricao:
      'Defina seus horários disponíveis e deixe que o sistema calcule o que está livre automaticamente.',
  },
  {
    titulo: 'Cliente agenda sem fricção',
    descricao:
      'Seu cliente acessa o link, escolhe o serviço e o horário — sem precisar criar conta nem trocar mensagem.',
  },
]

export function LandingPage() {
  return (
    <div>
      <section className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Chega de agendar horário pelo WhatsApp
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Crie sua página profissional com agenda embutida em poucos minutos. Ideal para
          tarólogos, tatuadores, terapeutas, personal trainers e outros autônomos.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/cadastro"
            className="rounded-md bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
          >
            Criar minha página grátis
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Já tenho conta
          </Link>
        </div>
        <p className="mt-3 text-sm text-gray-400">14 dias grátis, sem cartão de crédito.</p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900">{b.titulo}</h2>
              <p className="mt-2 text-sm text-gray-600">{b.descricao}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
