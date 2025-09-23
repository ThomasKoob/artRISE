import { Outlet } from "react-router";
import Footer from "../components/Footer.jsx";
import NavBar from "../components/NavBar.jsx";
import { LoginModalProvider } from "../context/LoginModalContext.jsx";

const Layout = () => {
  return (
    <LoginModalProvider>
      <div className="flex flex-col h-screen">
        <NavBar className="flex justify-center" />
        <main className="grow">
          <Outlet />
        </main>
        <Footer />
      </div>
    </LoginModalProvider>
  );
};

export default Layout;
