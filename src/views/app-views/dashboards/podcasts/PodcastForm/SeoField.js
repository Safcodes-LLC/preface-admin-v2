import React from 'react'
import { Input, Row, Col, Card, Form } from 'antd';

const rules = {
	meta_title: [
		{
			required: true,
			message: 'Please enter podcast meta title',
		}
	],
	meta_desc: [
		{
			required: true,
			message: 'Please enter podcast meta description',
		}
	],
	meta_tags: [
		{
			required: true,
			message: 'Please enter podcast meta tags',
		}
	]
}

const SeoField = props => (
	<Row gutter={16}>
		<Col xs={24} sm={24} md={17}>
			<Card>
				<Form.Item name="meta_title" label="Meta title" rules={rules.meta_title}>
					<Input placeholder="Meta title" />
				</Form.Item>
				<Form.Item name="meta_desc" label="Meta description" rules={rules.meta_desc}>
					<Input.TextArea rows={2} placeholder="Meta description" />
				</Form.Item>
				<Form.Item name="meta_tags" label="Meta tags (comma separated)" rules={rules.meta_tags}>
					<Input placeholder="Meta tags (comma separated)" />
				</Form.Item>
			</Card>
		</Col>
	</Row>
)

export default SeoField
