import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const Admin = () => (
	<Routes>
		<Route path="*" element={<Navigate to="user-roles/listing" replace />} />
	</Routes>
);

export default Admin
