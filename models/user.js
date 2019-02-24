/* Users model */
const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const { EventSchema } = require('./event')


const UserSchema = new mongoose.Schema({
	userName: {
		type: String,
		required: true,
		trim: true,
		unique: true,
		minlength: 1,
		validate: {
			validator: validator.isAlphanumeric,
			message: 'Not valid username'
		}
	},
	email: {
		type: String,
		required: true,
		minlength: 1,
		trim: true,
		validate: {
			validator: validator.isEmail,
			message: 'Not valid email'
		}
	},
	password: {
		type: String,
		required: true,
		minlength: 6
	},
	name: {
		type: String,
		required: true,
	},
	gender: {
		type: String,
		required: true
	},
	admin: {
		type: Boolean,
		required: true
	},
	description: {
		type: String,
		maxlength:150
	},
	image: {
		type: String
	},
	events: [EventSchema]
})

UserSchema.pre('save', function(next) {
	const user = this

	if (user.isModified('password')) {
		bcrypt.genSalt(7, (error, salt) => {
			bcrypt.hash(user.password, salt, (error, hash) => {
				user.password = hash
				next()
			})
		})
	} else {
		next();
	}
})

UserSchema.statics.login = function(userName, password) {
	const User = this

	return User.findOne({userName: userName}).then((user) => {
		if (!user) {
			return Promise.reject("unknown")
		}

		return new Promise((resolve, reject) => {
			bcrypt.compare(password, user.password, (error, result) => {
				if (result) {
					resolve(user);
				} else {
					reject("wrongpassword");
				}
			})
		})
	})
}

const User = mongoose.model('User', UserSchema)

module.exports = { User }
