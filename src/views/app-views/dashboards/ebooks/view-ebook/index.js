import React from "react";
import EbookForm from "../EbookForm";
import { useParams } from "react-router-dom";

const EditEbook = () => {
  const params = useParams();
  return <EbookForm mode="EDIT" view={true} param={params} />;
};

export default EditEbook;
