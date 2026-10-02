import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { signInWithGoogle } from "./actions";

const messages: Record<string, string> = {
  unauthorized: "Tu cuenta inició sesión, pero no está habilitada como administradora.",
  "not-configured": "Primero completá las variables de Supabase en .env.local.",
  oauth: "Google no pudo iniciar la sesión. Intentá nuevamente.",
  callback: "No pudimos completar el acceso. Intentá nuevamente.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="login-page">
      <Link className="back-link" href="/"><ArrowLeft size={16} /> Volver a la vidriera</Link>
      <section className="login-card">
        <div className="login-icon"><ShieldCheck size={30} /></div>
        <p className="eyebrow">Acceso privado</p>
        <h1>Panel de administración</h1>
        <p>Ingresá con la cuenta de Google autorizada para gestionar catálogo y stock.</p>
        {error && <div className="form-message error" role="alert">{messages[error] || messages.oauth}</div>}
        <form action={signInWithGoogle}>
          <button className="google-button" type="submit">
            <span className="google-g">G</span> Continuar con Google
          </button>
        </form>
        <small>El acceso está limitado por whitelist. Iniciar sesión no otorga permisos automáticamente.</small>
      </section>
    </main>
  );
}
