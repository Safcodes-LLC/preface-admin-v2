import React from "react";
import BlogForm from "../BlogForm";
import { useParams } from "react-router-dom";

const EditBlog = () => {
  const params = useParams();
  return <BlogForm mode="EDIT" view={true} param={params} />;
};

export default EditBlog;
