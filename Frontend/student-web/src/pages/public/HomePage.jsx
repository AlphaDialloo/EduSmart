import { useEffect, useState } from "react";
import CourseSection from "../../components/courses/CourseSection";
import HeroSection from "../../components/home/HeroSection";
import { getCourses } from "../../services/course.service";
function HomePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function loadCourses() {
      try {
        setLoading(true);
        setError("");
        const data = await getCourses({
          page: 1,
          limit: 30
        });
        if (active) {
          setCourses(data.courses || []);
        }
      } catch (requestError) {
        console.error("Erreur de chargement des cours :", requestError);
        if (active) {
          setError("Impossible de charger les cours pour le moment.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadCourses();
    return () => {
      active = false;
    };
  }, []);
  const popularCourses = courses.slice().sort((a, b) => b.studentsCount - a.studentsCount).slice(0, 8);
  const newCourses = courses.slice(0, 8);
  return <main>
      <HeroSection />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {loading && <p className="py-12 text-center font-semibold text-slate-500">
            Chargement des cours...
          </p>}

        {!loading && error && <div className="my-10 rounded-2xl border border-red-200 bg-red-50 p-5 text-center font-semibold text-red-700">
            {error}
          </div>}

        {!loading && !error && courses.length === 0 && <p className="py-12 text-center font-semibold text-slate-500">
            Aucun cours publié pour le moment.
          </p>}

        {!loading && !error && courses.length > 0 && <>
            <CourseSection title="Cours populaires" description="Découvrez les formations les plus suivies par nos étudiants." courses={popularCourses} viewAllLink="/courses?sort=popular" />

            <CourseSection title="Nouveautés" description="Explorez les cours récemment publiés sur EduSmart." courses={newCourses} viewAllLink="/courses?sort=newest" />

            <CourseSection title="Tous les cours" description="Trouvez la formation qui correspond à votre prochain objectif." courses={courses.slice(0, 10)} viewAllLink="/courses" />
          </>}
      </div>
    </main>;
}
export default HomePage;
