const mongoose = require('mongoose')
const Schema = mongoose.Schema
mongoose.Promise = global.Promise
const md5 = require('md5') 
const validator = require('validator') 
const mongodbErrorHandler = require('mongoose-mongodb-errors')
const passportLocalMongoose = require('password-local-mongoose')

const userSchema = new Schema({
	email: {
		type: String,
		unique: true,
		lowercase: true,
		trim: true,
		validate: [validate.isEmail, 'Invalid Email address'],
		required: 'Please supply an email address'
	},
	name: {
		type: String,
		required: 'please supply a name'
		trim: true
	}
})

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' })
userSchema.plugin(mongodbErrorHandler)

module.exports = mongoose.model('User', userSchema) 