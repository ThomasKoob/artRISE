import { Route, Routes } from "react-router";
import Home from "../pages/Home";
import Auction from "../pages/Auction.jsx";
import Layout from "../Layout/Layout.jsx";
import SignUp from "../pages/SignUp.jsx";
import Dashboard from "../pages/Dashboard.jsx";
// import CreateAuction from "../pages/CreateAuction.jsx"
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="auction" element={<Auction />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="signup" element={<SignUp />} />
      </Route>
      <Route path="*" element={<h1>Page not found</h1>} />
    </Routes>
  );
};
export default App;
