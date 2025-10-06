import { Route, Routes } from "react-router";
import Home from "../pages/Home";
import Auction from "../pages/Auction.jsx";
import AuctionsList from "../pages/AuctionsList.jsx"; // Neue Seite für alle Auktionen
import Layout from "../Layout/Layout.jsx";
import SignUp from "../pages/SignUp.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import CheckEmail from "../pages/CheckEmail.jsx";
import VerifyEmail from "../pages/VerifyEmail.jsx";
import ShippingPage from "../pages/ShippingPage.jsx";

const App = () => {
  return (
    <div className="flex flex-col bg-whiteWarm">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="auction" element={<AuctionsList />} />
          <Route path="auction/:auctionId" element={<Auction />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="check-email" element={<CheckEmail />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="/shipping/:artworkId" element={<ShippingPage />} />
        </Route>
        <Route path="*" element={<h1>Page not found</h1>} />
      </Routes>
    </div>
  );
};

export default App;
