import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <div className="text-5xl font-black text-arka-navy dark:text-arka-gold">404</div>
      <p className="mt-2 text-slate-500">Nie znaleziono takiej strony ani meczu.</p>
      <Link to="/" className="btn-primary mt-6">
        Wróć do kroniki
      </Link>
    </div>
  );
}
