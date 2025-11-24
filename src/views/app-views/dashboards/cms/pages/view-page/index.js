import React from "react";
import { useParams } from "react-router-dom";
import PageForm from "../PageForm";

const EditPage = () => {
  const params = useParams();
  return <PageForm mode="EDIT" view={true} param={params} />;
};

export default EditPage;
