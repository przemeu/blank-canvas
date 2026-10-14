import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

const LOGO = (f: string) => `${import.meta.env.BASE_URL}logos/${f}`;

function Navbar() {
  const { theme, toggle } = useTheme();
  return (
    <header
      className="relative overflow-hidden bg-arka-navy bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(0,40,80,0.92), rgba(0,89,168,0.75)), url(${LOGO("dark_blue_widescreen_bg.jpg")})` }}
    >
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-arka-gold via-arka-gold-dark to-arka-gold" />
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-4">
        <a href="https://arka.gdynia.pl/" target="_blank" rel="noreferrer" className="shrink-0 transition hover:scale-105" title="Arka Gdynia">
          <img src={LOGO("arka_gdynia.png")} alt="Arka Gdynia" className="h-12 w-auto drop-shadow-lg sm:h-16" />
        </a>
        <Link to="/" className="flex min-w-0 flex-1 items-center justify-center" title="Kalendarium – strona główna">
          <img src={LOGO("kalendarium_header.png")} alt="Kalendarium" className="h-8 w-auto max-w-full object-contain sm:h-12" />
        </Link>
        <a href="https://socios.ag/" target="_blank" rel="noreferrer" className="hidden shrink-0 transition hover:scale-105 sm:block" title="Socios Arka Gdynia">
          <img src={LOGO("socios_logo.png")} alt="Socios Arka Gdynia" className="h-12 w-auto sm:h-14" />
        </a>
        <button
          onClick={toggle}
          className="shrink-0 rounded-full border border-white/20 bg-white/10 p-2.5 text-arka-gold backdrop-blur transition hover:bg-white/20"
          aria-label={theme === "dark" ? "Włącz tryb jasny" : "Włącz tryb ciemny"}
          title={theme === "dark" ? "Tryb jasny" : "Tryb ciemny"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/70 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          Dane pochodzą z:{" "}
          <a className="link" href="https://lubimyczytac.pl/ksiazka/243643/zolto-niebiescy" target="_blank" rel="noreferrer">
            Żółto-niebiescy. Monografia
          </a>{" "}
          M. Witczaka oraz strony{" "}
          <a className="link" href="http://www.90minut.pl/" target="_blank" rel="noreferrer">
            90minut.pl
          </a>
          .
        </div>
        <div>
          O autorze:{" "}
          <a className="link" href="https://www.linkedin.com/in/przemek-wojcik/" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          ,{" "}
          <a className="link" href="https://x.com/PrzemekAG" target="_blank" rel="noreferrer">
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}

function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(!localStorage.getItem("cookiesAccepted"));
  }, []);
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-r from-arka-navy to-arka-navy-light px-4 py-3 text-sm text-arka-gold shadow-2xl">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="min-w-[240px] flex-1 leading-relaxed">
          🍪 Ta strona korzysta z pamięci przeglądarki (localStorage) w celu zapamiętania Twoich preferencji (np. tryb ciemny, zaznaczone mecze).
        </p>
        <button
          className="btn-gold"
          onClick={() => {
            localStorage.setItem("cookiesAccepted", "true");
            setVisible(false);
          }}
        >
          Akceptuję
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-2 py-4 sm:px-4 lg:px-6">{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  );
}
