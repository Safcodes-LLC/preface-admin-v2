import React from 'react'
import { Input, Row, Col, Card, Form, Upload, message, Select } from 'antd';

const rules = {
	title: [
		{
			required: true,
			message: 'Please enter podcast title',
		}
	],
	description: [
		{
			required: true,
			message: 'Please enter podcast description',
		}
	],
}


const GeneralSettingsFields = props => (
	<Row gutter={16}>
		<Col xs={24} sm={24} md={17}>
			<Card>
				<Form.Item name="title" label="Portal Title" rules={rules.title}>
					<Input placeholder="Portal Title" />
				</Form.Item>
				<Form.Item name="description" label="description" rules={rules.description}>
					<Input.TextArea rows={8} />
				</Form.Item>
			</Card>
		</Col>
	</Row>
)

export default GeneralSettingsFields
