import React from "react";
import PodcastForm from "../PodcastForm";
import { useParams } from "react-router-dom";

const EditPodcast = () => {
  const params = useParams();
  return <PodcastForm mode="EDIT" view={true} param={params} />;
};

export default EditPodcast;
