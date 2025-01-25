import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const Ebooks = () => (
	<Routes>
		<Route path="*" element={<Navigate to="listing" replace />} />
	</Routes>
);

export default Ebooks
