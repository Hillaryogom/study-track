import { BarChart3, CalendarCheck, Flame } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "../../components/Brand";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const HIGHLIGHTS = [
  { icon: CalendarCheck, text: "Log every study session against the subject you were working on." },
  { icon: Flame, text: "See your streak and weekly hours without keeping a spreadsheet." },
  { icon: BarChart3, text: "Track goals and spot the subjects you have been avoiding." },
];

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth">
      <section className="auth__panel" aria-hidden="true">
        <Brand />
        <h2 className="auth__panel-title">Study habits you can actually see.</h2>
        <ul className="auth__highlights">
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <li key={text}>
              <Icon size={18} />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </section>

      <main className="auth__form-area" id="main-content">
        <div className="auth__card">
          <div className="auth__mobile-brand">
            <Brand />
          </div>
          <h1>{title}</h1>
          <p className="auth__subtitle">{subtitle}</p>
          {children}
          {footer ? <div className="auth__footer">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
