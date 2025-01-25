import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const Cms = () => (
	
	<Routes>
		<Route path="*" element={<Navigate to="popular-article" replace />} />
	</Routes>
);

export default Cms
