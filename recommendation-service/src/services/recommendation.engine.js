function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
function list(value) {
  if (Array.isArray(value)) return value.map(normalize).filter(Boolean);
  if (typeof value === "string") return value.split(/[,;|]/).map(normalize).filter(Boolean);
  return [];
}
function courseId(course) {
  return String(course?._id || course?.id || "");
}
function courseTerms(course) {
  const category = course?.categoryId?.name || course?.category?.name || course?.category;
  return new Set([normalize(category), normalize(course?.level), ...list(course?.tags), ...normalize(course?.title).split(/\s+/)].filter(Boolean));
}
function preferredTerms(profile) {
  return new Set([...list(profile?.interests), ...list(profile?.preferredSubjects), ...list(profile?.preferred_subjects), ...list(profile?.skills), ...list(profile?.learningGoals), ...list(profile?.learning_goals)]);
}
function targetLevel(profile, attempts) {
  const current = normalize(profile?.currentLevel || profile?.current_level || "BEGINNER").toUpperCase();
  const latest = [...(attempts || [])].sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))[0];
  const score = Number(latest?.score);
  if (Number.isFinite(score) && score < 60) return "BEGINNER";
  if (Number.isFinite(score) && score >= 80) {
    return current === "BEGINNER" ? "INTERMEDIATE" : "ADVANCED";
  }
  return current || "BEGINNER";
}
function rankCourses({
  courses = [],
  profile = {},
  attempts = [],
  enrollments = [],
  limit = 6
}) {
  const level = targetLevel(profile, attempts);
  const preferences = preferredTerms(profile);
  const enrolled = new Set(enrollments.map(item => String(item.course_id || item.courseId || "")));
  return courses.filter(course => {
    const status = normalize(course?.status).toUpperCase();
    return course?.isActive !== false && (!status || status === "PUBLISHED" || status === "ACTIVE") && !enrolled.has(courseId(course));
  }).map(course => {
    let score = 35;
    const reasons = [];
    const terms = courseTerms(course);
    const matches = [...preferences].filter(term => terms.has(term));
    if (normalize(course?.level).toUpperCase() === level) {
      score += 35;
      reasons.push(`niveau ${level.toLowerCase()} adapté`);
    } else {
      score -= 10;
    }
    if (matches.length) {
      score += Math.min(matches.length * 8, 24);
      reasons.push(`correspond à vos intérêts : ${matches.slice(0, 3).join(", ")}`);
    }
    const rating = Number(course?.stats?.averageRating || 0);
    if (rating >= 4) {
      score += Math.min(Math.round(rating * 2), 10);
      reasons.push("bien évalué par les apprenants");
    }
    return {
      course,
      score: Math.max(0, Math.min(100, score)),
      reason: reasons.length ? `Recommandé car ce cours est ${reasons.join(" et ")}.` : "Recommandé pour diversifier votre parcours d’apprentissage."
    };
  }).sort((a, b) => b.score - a.score || courseId(a.course).localeCompare(courseId(b.course))).slice(0, Math.max(1, Math.min(Number(limit) || 6, 20)));
}
module.exports = {
  rankCourses,
  targetLevel
};
