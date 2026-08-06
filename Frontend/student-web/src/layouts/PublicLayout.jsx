import { Outlet } from "react-router";

import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";

function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#f7f8fc]">
      <Navbar />

      <Outlet />

      <Footer />
    </div>
  );
}

export default PublicLayout;