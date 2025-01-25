import React from 'react'
import RoleForm from '../RoleForm';
import { useParams } from 'react-router-dom';

const EditRole = () => {
	const params = useParams();
	return (
		<RoleForm mode="EDIT" param={params}/>
	)
}

export default EditRole
