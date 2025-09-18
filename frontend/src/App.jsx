import { Route, Routes } from "react-router";
import Home from "../pages/Home";
import About from "../pages/About.jsx";
import Layout from "../Layout/Layout.jsx";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
      </Route>
      <Route path="*" element={<h1>Page not found</h1>} />
    </Routes>
  );
};

export default App;
