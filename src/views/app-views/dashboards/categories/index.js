import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const Categories = () => (
	<Routes>
		<Route path="*" element={<Navigate to="articles" replace />} />
	</Routes>
);

export default Categories
