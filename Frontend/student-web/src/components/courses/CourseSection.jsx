import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";

import CourseCard from "./CourseCard";

function CourseSection({
  title,
  description,
  courses,
  viewAllLink = "/courses",
}) {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    const container = carouselRef.current;

    if (!container) {
      return;
    }

    const distance = Math.max(container.clientWidth * 0.8, 320);

    container.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-10">
      <div className="mb-6 flex items-end justify-between gap-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h2>

          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              {description}
            </p>
          )}
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Link
            to={viewAllLink}
            className="mr-3 text-sm font-bold text-indigo-600 transition hover:text-indigo-800"
          >
            Voir tout
          </Link>

          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label={`Faire défiler ${title} vers la gauche`}
            className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ArrowLeft size={19} />
          </button>

          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label={`Faire défiler ${title} vers la droite`}
            className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ArrowRight size={19} />
          </button>
        </div>
      </div>

      <div
        ref={carouselRef}
        className="scrollbar-hidden flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5"
      >
        {courses.map((course) => (
          <div key={course.id} className="snap-start">
            <CourseCard course={course} />
          </div>
        ))}
      </div>

      <Link
        to={viewAllLink}
        className="mt-2 inline-flex text-sm font-bold text-indigo-600 sm:hidden"
      >
        Voir tous les cours
      </Link>
    </section>
  );
}

export default CourseSection;