import { useState, useEffect } from "react";
import { Star } from "lucide-react";

// ─────────────────────────────────────────────────────────
// TYPES & MOCKS
// ─────────────────────────────────────────────────────────
interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

const MOCK_REVIEWS: Review[] = [
  { id: "r1", patientName: "María G.", rating: 5, date: "2024-12-28", comment: "El Dr. Mendoza es un profesional excepcional. Explicó mi diagnóstico con mucha claridad y paciencia. Me sentí muy bien atendida. Totalmente recomendado." },
  { id: "r2", patientName: "Juan P.", rating: 5, date: "2024-12-25", comment: "Excelente atención. El doctor tomó el tiempo necesario para revisar mis estudios anteriores y me dio un plan de tratamiento muy detallado. Salí con todas mis dudas resueltas." },
  { id: "r3", patientName: "Ana M.", rating: 4, date: "2024-12-20", comment: "Muy buen médico, conocedor de su especialidad. La espera fue un poco larga pero la calidad de la consulta lo justifica ampliamente." },
  { id: "r4", patientName: "Roberto J.", rating: 5, date: "2024-12-18", comment: "Me realizó el ecocardiograma con gran precisión y explicó cada hallazgo al momento. Profesional de primera. Ya programé mi próxima consulta." },
  { id: "r5", patientName: "Carmen D.", rating: 4, date: "2024-12-15", comment: "Consulta muy completa. El Dr. Mendoza es atento y preciso en sus diagnósticos. Regresaré sin duda." },
  { id: "r6", patientName: "Fernando G.", rating: 5, date: "2024-12-10", comment: "Detectó mi arritmia que otros médicos habían pasado por alto. Altamente recomendado. Le estoy muy agradecido." },
  { id: "r7", patientName: "Valentina H.", rating: 3, date: "2024-12-05", comment: "Buena consulta, aunque me hubiese gustado más tiempo para resolver mis dudas. En general satisfecha con la atención recibida." },
];

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className ?? ""}`} />;
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${sz} ${s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────
export default function ReviewsView() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setReviews(MOCK_REVIEWS);
      setLoading(false);
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  const avg = 4.8;
  const total = 247;

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { star, count, pct };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reseñas de Pacientes</h1>
        <p className="text-sm text-slate-500 mt-0.5">Feedback recibido de tus consultas en Zenda</p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
        {loading ? (
          <div className="flex items-start gap-8">
            <Skeleton className="h-28 w-28 rounded-2xl" />
            <div className="flex-1 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4" />)}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-8">
            <div className="text-center shrink-0">
              <p
                className="text-8xl font-black text-slate-900 leading-none tracking-tight"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
              >
                {avg.toFixed(1)}
              </p>
              <div className="flex justify-center mt-3">
                <StarRating rating={avg} size="lg" />
              </div>
              <p className="text-sm text-slate-400 mt-2 font-medium">{total.toLocaleString("es")} reseñas</p>
            </div>
            <div className="flex-1 w-full space-y-2.5">
              {distribution.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-500 w-3 text-right shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{star}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-400 w-6 shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-slate-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                    {r.patientName[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{r.patientName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(r.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <StarRating rating={r.rating} size="sm" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{r.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
