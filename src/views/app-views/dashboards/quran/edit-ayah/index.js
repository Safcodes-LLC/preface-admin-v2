//src/views/app-views/dashboards/quran/edit-ayah/index.js
import React from "react";
import AyahForm from "../AyahForm/index";
import { useParams } from "react-router-dom";

const EditAyah = () => {
  const params = useParams();
  return <AyahForm mode="EDIT" view={false} param={params} />;
};

export default EditAyah;