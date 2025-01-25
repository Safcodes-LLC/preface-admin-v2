import React from "react";
import UserForm from "../UserForm";
import { useParams } from "react-router-dom";

const EditUser = () => {
  const params = useParams();
  return <UserForm mode="EDIT" view={true} param={params} />;
};

export default EditUser;
