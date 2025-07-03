import React from 'react'
import CategoryForm from '../CategoryForm';
import { useParams } from 'react-router-dom';

const ViewCategory = () => {
	const params = useParams();
	return (
		<CategoryForm mode="EDIT" view={true} param={params}/>
	)
}

export default ViewCategory 