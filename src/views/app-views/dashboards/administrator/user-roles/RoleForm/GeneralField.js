import React from 'react'
import { Input, Row, Col, Card, Form} from 'antd';

const rules = {
	title: [
		{
			required: true,
			message: 'Please enter Role name',
		}
	],
	description: [
		{
			required: true,
			message: 'Please enter Role description',
		}
	]
}


const GeneralField = props => (
	<Row gutter={16}>
		<Col xs={24} sm={24} md={17}>
			<Card title="Basic Info">
				<Form.Item name="title" label="Role title" rules={rules.title}>
					<Input placeholder="Role Name" />
				</Form.Item>
				<Form.Item name="description" label="Role description" rules={rules.description}>
					<Input.TextArea rows={4} />
				</Form.Item>
			</Card>
		</Col>
	</Row>
)

export default GeneralField
