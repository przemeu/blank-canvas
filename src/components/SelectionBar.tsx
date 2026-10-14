import { Eye, EyeOff, Star, Trash2 } from "lucide-react";
import { plural } from "@/lib/format";

interface Props {
  count: number;
  selectedOnly: boolean;
  onShowSelected: (on: boolean) => void;
  onClear: () => void;
}

/** Pływający pasek z liczbą zaznaczonych meczów. */
export default function SelectionBar({ count, selectedOnly, onShowSelected, onClear }: Props) {
  if (count === 0 && !selectedOnly) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 animate-slide-up">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-arka-gold/40 bg-arka-navy/95 px-4 py-3 text-white shadow-2xl backdrop-blur">
        <span className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 fill-arka-gold text-arka-gold" />
          Zaznaczono: <strong className="text-arka-gold">{count}</strong> {plural(count, "mecz", "mecze", "meczów")}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn h-9 border border-white/20 bg-white/10 px-3 text-white hover:bg-white/20"
            onClick={() => {
              if (count && confirm(`Czy na pewno chcesz usunąć wszystkie zaznaczenia? (${count})`)) onClear();
            }}
            disabled={count === 0}
          >
            <Trash2 className="h-4 w-4" /> Usuń zaznaczenia
          </button>
          <button type="button" className="btn-gold h-9 px-3" onClick={() => onShowSelected(!selectedOnly)}>
            {selectedOnly ? (
              <>
                <EyeOff className="h-4 w-4" /> Wróć do filtrów
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" /> Pokaż tylko zaznaczone
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
