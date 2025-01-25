import React from 'react'
import AuthorForm from '../AuthorForm';
import { useParams } from 'react-router-dom';

const EditAuthor = () => {
	const params = useParams();
	return (
		<AuthorForm mode="EDIT" param={params}/>
	)
}

export default EditAuthor
