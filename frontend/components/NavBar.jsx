import { Link } from "react-router";

const NavBar = () => {
  return (
    <nav className="w-full bg-slate-900/80 sticky top-0 backdrop-blur">
      <div>
        <p className="text-4xl flex justify-center">artRise</p>
        <p></p>
        <ul>
          <li className="flex justify-center">
            <Link
              className="text-2xl m-4 hover:text-slate-500 transition duration-400"
              to="/"
            >
              Home
            </Link>
            <Link
              className="text-2xl m-4 hover:text-slate-500 transition duration-400"
              to="about"
            >
              About
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavBar;
