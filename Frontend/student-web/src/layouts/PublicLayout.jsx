import { Outlet } from "react-router";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
function PublicLayout() {
  return <div className="min-h-screen bg-[#fffbf5]">
      <Navbar />

      <Outlet />

      <Footer />
    </div>;
}
export default PublicLayout;
