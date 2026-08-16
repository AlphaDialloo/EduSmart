import { Clock3, ShoppingCart, Star, UsersRound } from "lucide-react";
import { Link } from "react-router";
function formatPrice(price, currency = "CAD") {
  if (Number(price) === 0) {
    return "Gratuit";
  }
  try {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency,
      maximumFractionDigits: 2
    }).format(Number(price));
  } catch {
    return `${Number(price).toLocaleString("fr-CA")} ${currency}`;
  }
}
function CourseCard({
  course
}) {
  const courseId = course.id || course._id;
  return <article className="group flex h-full w-[285px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[310px]">
      <div className="relative overflow-hidden bg-slate-100">
        <Link to={`/courses/${courseId}`}>
          <img src={course.image} alt={course.imageAlt || course.title} loading="lazy" className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" />
        </Link>

        {course.badge && <span className="absolute left-3 top-3 rounded-lg bg-slate-950/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            {course.badge}
          </span>}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-xs font-bold uppercase tracking-wide text-emerald-600">
            {course.category}
          </span>

          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            {course.levelLabel || course.level}
          </span>
        </div>

        <Link to={`/courses/${courseId}`}>
          <h3 className="mt-3 line-clamp-2 min-h-14 text-lg font-black leading-7 text-slate-950 transition group-hover:text-emerald-600">
            {course.title}
          </h3>
        </Link>

        <p className="mt-2 truncate text-sm text-slate-500">
          Par {course.instructor}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-1.5">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            <span className="font-black text-slate-800">
              {course.rating > 0 ? course.rating.toFixed(1) : "Nouveau"}
            </span>
            {course.reviewCount > 0 && <span>({course.reviewCount})</span>}
          </div>

          <div className="flex items-center gap-1.5">
            <UsersRound size={15} />
            {course.studentsCount || 0}
          </div>

          <div className="flex items-center gap-1.5">
            <Clock3 size={15} />
            {course.duration}
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <p className="text-xl font-black text-slate-950">
            {formatPrice(course.price, course.currency)}
          </p>

          <Link to={`/courses/${courseId}`} aria-label={`Voir ${course.title}`} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">
            <ShoppingCart size={19} />
          </Link>
        </div>
      </div>
    </article>;
}
export default CourseCard;
