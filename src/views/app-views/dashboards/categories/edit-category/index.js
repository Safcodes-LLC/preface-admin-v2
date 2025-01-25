import React from 'react'
import CategoryForm from '../CategoryForm';
import { useParams } from 'react-router-dom';

const EditCategory = () => {
	const params = useParams();
	return (
		<CategoryForm mode="EDIT" param={params}/>
	)
}

export default EditCategory
