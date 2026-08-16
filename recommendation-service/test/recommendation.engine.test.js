const test = require("node:test");
const assert = require("node:assert/strict");
const { rankCourses, targetLevel } = require("../src/services/recommendation.engine");

test("adapte le niveau après un quiz faible", () => {
  assert.equal(targetLevel({ currentLevel: "ADVANCED" }, [{ score: 42 }]), "BEGINNER");
});

test("classe les cours par niveau et préférences", () => {
  const result = rankCourses({
    profile: { currentLevel: "BEGINNER", interests: ["javascript"] },
    courses: [
      { _id: "2", title: "Histoire", level: "ADVANCED", tags: ["histoire"], status: "PUBLISHED" },
      { _id: "1", title: "JavaScript", level: "BEGINNER", tags: ["javascript"], status: "PUBLISHED" },
    ],
  });
  assert.equal(result[0].course._id, "1");
  assert.ok(result[0].score > result[1].score);
});

test("exclut les cours déjà suivis", () => {
  const result = rankCourses({
    courses: [{ _id: "owned", title: "Déjà suivi", status: "PUBLISHED" }],
    enrollments: [{ course_id: "owned" }],
  });
  assert.deepEqual(result, []);
});
