import { Link } from "react-router-dom";
import { ArrowLeft, DatabaseZap, Download, Lock, ShieldCheck, Trash2, UserCheck } from "lucide-react";
import { BRAND, PRIVACY_CONTACT, PRIVACY_VERSION } from "@/brand";
import { Logo } from "@/components/brand/Logo";

/** Aviso de privacidade (LGPD, Lei 13.709/2018) em linguagem simples. Página pública. */
export function PrivacyPage() {
  return (
    <div className="legal">
      <header className="legal__head">
        <Link to="/" className="legal__back"><ArrowLeft size={16} aria-hidden /> Voltar</Link>
        <div className="legal__brand"><Logo size={30} />{BRAND.name}</div>
      </header>

      <main className="legal__body">
        <p className="eyebrow">Versão {PRIVACY_VERSION}</p>
        <h1>Privacidade e proteção de dados</h1>
        <p className="legal__lead">Seus gastos são assunto seu. Aqui está, sem juridiquês, o que o {BRAND.name} guarda, por quê, com quem passa por perto e como você manda em tudo isso.</p>

        <section className="legal__cards" aria-label="Resumo">
          <div><Lock size={18} aria-hidden /><b>Só você vê</b><span>Cada conta enxerga apenas os próprios dados.</span></div>
          <div><DatabaseZap size={18} aria-hidden /><b>Sem rastreio</b><span>Sem anúncios, sem analytics, sem venda de dados.</span></div>
          <div><Download size={18} aria-hidden /><b>Leve com você</b><span>Exporte tudo em JSON ou CSV quando quiser.</span></div>
          <div><Trash2 size={18} aria-hidden /><b>Apague tudo</b><span>Exclusão da conta em um toque, em Perfil.</span></div>
        </section>

        <h2>1. Quem é o controlador</h2>
        <p>O {BRAND.name} é um projeto acadêmico de controle financeiro pessoal. {PRIVACY_CONTACT ? <>Para qualquer pedido sobre seus dados, escreva para <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>.</> : <>Para pedidos sobre seus dados, fale com quem te passou o link do app; a maior parte você resolve sozinho(a) em <b>Perfil</b>.</>}</p>

        <h2>2. Quais dados tratamos</h2>
        <ul>
          <li><b>Conta:</b> nome (ou apelido), e-mail e senha (guardada apenas como <i>hash</i>, nunca em texto).</li>
          <li><b>O que você registra:</b> lançamentos, categorias, contas, orçamentos, metas e projetos.</li>
          <li><b>Opcionais:</b> instituição, curso, datas do semestre e meta de renda. Só entram se você preencher.</li>
          <li><b>Técnicos mínimos:</b> sessão de login e cópia local dos seus dados no aparelho (para funcionar sem internet).</li>
        </ul>
        <p>Não pedimos CPF, endereço, telefone, dados bancários reais, nem acesso à sua conta de banco.</p>

        <h2>3. Para que usamos e em que base legal</h2>
        <ul>
          <li>Entregar o app (criar conta, guardar e sincronizar seus registros): <b>execução do serviço</b> que você pediu (art. 7º, V).</li>
          <li>Manter a conta segura e evitar fraude: <b>legítimo interesse</b> (art. 7º, IX).</li>
          <li>Dados acadêmicos opcionais e este aviso: <b>seu consentimento</b> (art. 7º, I), que você pode retirar a qualquer momento.</li>
        </ul>

        <h2>4. Com quem os dados passam</h2>
        <ul>
          <li><b>Supabase</b> (banco de dados e login): guarda os dados da sua conta, em servidores na região de São Paulo.</li>
          <li><b>GitHub Pages</b>: apenas entrega os arquivos do app. Seus dados financeiros não passam por lá.</li>
        </ul>
        <p>Não vendemos nem cedemos seus dados a terceiros para marketing.</p>

        <h2>5. Por quanto tempo guardamos</h2>
        <p>Enquanto sua conta existir. Ao excluir a conta, apagamos seus dados do banco. Cópias de segurança do provedor podem manter resquícios por um período curto, conforme a política dele, e depois são descartadas.</p>

        <h2>6. Seus direitos (art. 18)</h2>
        <ul>
          <li><b>Acesso e portabilidade:</b> Perfil › Exportar backup (JSON); Relatórios › CSV.</li>
          <li><b>Correção:</b> edite nome, dados acadêmicos e registros no próprio app.</li>
          <li><b>Eliminação:</b> Perfil › Excluir minha conta e dados.</li>
          <li><b>Revogar consentimento, pedir informações ou reclamar:</b> pelo contato acima. Você também pode procurar a ANPD (gov.br/anpd).</li>
        </ul>

        <h2>7. Como protegemos</h2>
        <ul>
          <li>Conexão criptografada (HTTPS) e senhas com <i>hash</i>.</li>
          <li>Isolamento por usuário no banco (RLS): mesmo conhecendo o endereço do banco, ninguém lê dados alheios.</li>
          <li>Política de segurança de conteúdo (CSP) contra injeção de código.</li>
          <li>Ao sair, os dados locais do aparelho são apagados. Em Perfil você pode ligar a saída automática por inatividade.</li>
        </ul>
        <p>Nenhum sistema é 100% seguro. Se houver incidente que possa causar risco relevante, avisaremos os titulares e a ANPD, como manda o art. 48.</p>

        <h2>8. Menores de idade</h2>
        <p>O app é pensado para universitários. Se você tem menos de 18 anos, use com ciência e consentimento de um responsável (art. 14).</p>

        <h2>9. Mudanças neste aviso</h2>
        <p>Se mudarmos algo relevante, a versão acima muda e pedimos sua ciência de novo.</p>

        <div className="legal__foot"><ShieldCheck size={16} aria-hidden /> <UserCheck size={16} aria-hidden /> Seus dados, suas regras.</div>
      </main>
    </div>
  );
}
