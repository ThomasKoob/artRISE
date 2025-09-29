// Layout/Layout.jsx
import { Outlet } from "react-router";
import Footer from "../components/Footer.jsx";
import NavBar from "../components/NavBar.jsx";
import { LoginModalProvider } from "../context/LoginModalContext.jsx";
import { FavoritesProvider } from "../context/FavoritesContext.jsx";

const Layout = () => {
  return (
    <LoginModalProvider>
      <FavoritesProvider>
        <div className="flex flex-col min-h-screen"> {/* ⟵ min-h-screen (mouch h-screen) */}
          <NavBar className="flex justify-center" />
          <main className="grow">
            <Outlet />
          </main>
          <Footer />
        </div>
      </FavoritesProvider>
    </LoginModalProvider>
  );
};

export default Layout;

