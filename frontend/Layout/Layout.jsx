import { Outlet } from "react-router";
import Footer from "../components/Footer.jsx";
import NavBar from "../components/NavBar.jsx";

const Layout = () => {
  return (
    <div className="flex flex-col h-screen">
      <NavBar className="flex justify-center" />
      <main className="grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
