import { Link } from "react-router";

const NavBar = () => {
  return (
    <nav className="w-full bg-slate-900/80 sticky top-0 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center py-2 relative">
        <p className="text-4xl font-bold mb-2">artRise</p>

        <div className="w-full relative flex justify-center items-center">
          <ul className="flex space-x-6">
            <li>
              <Link
                className="text-2xl hover:text-slate-500 transition duration-400"
                to="/"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                className="text-2xl hover:text-slate-500 transition duration-400"
                to="/auction"
              >
                Auction
              </Link>
            </li>
          </ul>

          <ul className="flex space-x-6 absolute right-0">
            <li>
              <Link
                className="text-2xl hover:text-slate-500 transition duration-400"
                to="/signup"
              >
                Sign Up
              </Link>
            </li>
            <li>
              <Link
                className="text-2xl hover:text-slate-500 transition duration-400"
                to="/login"
              >
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

// import { Link } from "react-router";
// export default function Navbar({ user, onLogout }) {
//   return (
//     <nav className="flex items-center justify-between p-4 bg-gray-900 text-white">
//       <div className="flex gap-6">
//         {/* Links according to role */}
//         {!user && (
//           <>
//             <Link to="/">Home</Link>
//             <Link to="/help">Help</Link>
//             <Link to="/login">Login</Link>
//             <Link to="/register">Register</Link>
//           </>
//         )}
//         {user && user.role === "seller" && (
//           <>
//             <Link to="/dashboard">Dashboard</Link>
//             <Link to="/">Home</Link>
//             <Link to="/help">Help</Link>
//             <button onClick={onLogout}>Logout</button>
//           </>
//         )}
//         {user && user.role === "buyer" && (
//           <>
//             <Link to="/warenkorb">Warenkorb</Link>
//             <Link to="/">Home</Link>
//             <Link to="/help">Help</Link>
//             <button onClick={onLogout}>Logout</button>
//           </>
//         )}
//       </div>
//     </nav>
//   );
// }
