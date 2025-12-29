import React from "react";
import { Route, Routes } from "react-router-dom";

const QuranList = React.lazy(() => import("./quran-list"));

const Quran = () => {
  return (
    <Routes>
      <Route path="listing" element={<QuranList />} />
    </Routes>
  );
};

export default Quran;
