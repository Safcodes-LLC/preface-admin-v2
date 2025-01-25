import React from "react";
import ArticleForm from "../ArticleForm/index";
import { useParams } from "react-router-dom";

const EditArticle = () => {
  const params = useParams();
  return <ArticleForm mode="EDIT" view={true} param={params} />;
};

export default EditArticle;
