import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-brand-700">
          AgendaFácil
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {token ? (
            <>
              <Link to="/painel" className="text-gray-600 hover:text-brand-700">
                Agendamentos
              </Link>
              <Link to="/painel/pagina" className="text-gray-600 hover:text-brand-700">
                Minha página
              </Link>
              {user && <span className="hidden text-gray-400 sm:inline">{user.nome}</span>}
              <button
                onClick={handleLogout}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-brand-700">
                Entrar
              </Link>
              <Link
                to="/cadastro"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
              >
                Criar conta grátis
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
