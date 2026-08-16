import { Navigate, Route, Routes } from "react-router";
import PublicLayout from "../layouts/PublicLayout";
import HomePage from "../pages/public/HomePage";
import CoursesPage from "../pages/public/CoursesPage";
import CourseDetailPage from "../pages/public/CourseDetailPage";
import CartPage from "../pages/public/CartPage";
import CheckoutPage from "../pages/public/CheckoutPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import StudentCoursesPage from "../pages/student/StudentCoursesPage";
import StudentCoursePlayerPage from "../pages/student/StudentCoursePlayerPage";
import InstructorDashboardPage from "../pages/instructor/InstructorDashboardPage";
import InstructorCoursesPage from "../pages/instructor/InstructorCoursesPage";
import InstructorCreateCoursePage from "../pages/instructor/InstructorCreateCoursePage";
import InstructorCourseManagementPage from "../pages/instructor/InstructorCourseManagementPage";
import AdminLayout from "../components/admin/AdminLayout";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminCoursesPage from "../pages/admin/AdminCoursesPage";
import AdminPaymentsPage from "../pages/admin/AdminPaymentsPage";
import AdminCategoriesPage from "../pages/admin/AdminCategoriesPage";
import ProtectedRoute from "./ProtectedRoute";
function TemporaryPage({
  title
}) {
  return <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-16 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-3xl font-black text-slate-950">
          {title}
        </h1>

        <p className="mt-3 text-slate-500">
          Vous n’avez pas l’autorisation d’accéder à cette page.
        </p>
      </div>
    </main>;
}
function AppRoutes() {
  return <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />

        <Route path="/courses" element={<CoursesPage />} />

        <Route path="/courses/:courseId" element={<CourseDetailPage />} />

        <Route path="/cart" element={<CartPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />

      <Route path="/register" element={<RegisterPage />} />

      <Route path="/unauthorized" element={<TemporaryPage title="Accès non autorisé" />} />

      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentDashboardPage />
          </ProtectedRoute>} />

      <Route path="/student/courses" element={<ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentCoursesPage />
          </ProtectedRoute>} />

      <Route path="/student/courses/:courseId" element={<ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentCoursePlayerPage />
          </ProtectedRoute>} />

      <Route path="/checkout" element={<ProtectedRoute allowedRoles={["STUDENT"]}>
            <CheckoutPage />
          </ProtectedRoute>} />

      <Route path="/instructor/dashboard" element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"]}>
            <InstructorDashboardPage />
          </ProtectedRoute>} />

      <Route path="/instructor/courses" element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"]}>
            <InstructorCoursesPage />
          </ProtectedRoute>} />

      <Route path="/instructor/courses/new" element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"]}>
            <InstructorCreateCoursePage />
          </ProtectedRoute>} />

      <Route path="/instructor/courses/:courseId" element={<ProtectedRoute allowedRoles={["INSTRUCTOR", "ADMIN", "SUPER_ADMIN"]}>
            <InstructorCourseManagementPage />
          </ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />

        <Route path="dashboard" element={<AdminDashboardPage />} />

        <Route path="users" element={<AdminUsersPage />} />

        <Route path="courses" element={<AdminCoursesPage />} />

        <Route path="categories" element={<AdminCategoriesPage />} />

        <Route path="payments" element={<AdminPaymentsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>;
}
export default AppRoutes;
