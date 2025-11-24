import React from "react";
import { useParams } from "react-router-dom";
import PageForm from "../PageForm";


const EditPage = () => {
  const params = useParams();
  return <PageForm mode="EDIT" type="view" param={params} />;
};

export default EditPage;
