/* Events model */
const mongoose = require('mongoose')
const validator = require('validator')

const EventSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	start: {
		type: String,
		required: true
	},
	end: {
		type: String,
		required: true
	},
	type: {
		type: String,
		required: true
	},
	description: {
		type: String,
		maxlength:150
	},
	users: [String]
})

const Event = mongoose.model('Event', EventSchema)

module.exports = { Event, EventSchema }