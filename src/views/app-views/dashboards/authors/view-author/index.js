import React from "react";
// import VideoForm from "../VideoForm";
import AuthorForm from "../AuthorForm";
import { useParams } from "react-router-dom";

const EditAuthor = () => {
  const params = useParams();
  
  return <AuthorForm mode="EDIT" view={true} param={params} />
};

export default EditAuthor;
