import React from 'react'
import VideoForm from '../VideoForm';
import { useParams } from 'react-router-dom';

const EditVideo = () => {
	const params = useParams();
	return (
		<VideoForm mode="EDIT" param={params}/>
	)
}

export default EditVideo
