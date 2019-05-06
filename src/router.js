import express from 'express'
import moment from 'moment'

import { Exercise, User } from './models'

const Router = express.Router()

const isValidDate = date => moment(date).isValid()

const getValidUser = (req, res, user, callback) =>
	User.findById(user, (err, data) => {
		err ? res.json('Error: Invalid User ID') : callback(data)
	})

// I can create a user by posting form data username to /api/exercise/new-user
// and an object with username and id will be returned.
Router.post('/new-user', (req, res, next) => {
	const { username } = req.body
	// create new user
	const user = new User({ username })
	user.save((err, data) => {
		// does username exist in db already?
		err && err.code === 11000
			? res.json('Error: That username is taken. Try a different one.')
			: res.json({ username: data.username, _id: data._id })
	})
})

// I can get an array of all users by getting api/exercise/users
// with the same info as when creating a user.
Router.get('/users', (req, res, next) => {
	User.find()
		.select('username _id')
		.exec((err, data) => {
			// console.log(data)
			return res.json(data)
		})
})

// I can add an exercise to any user by posting form data containing the userId, description, duration,
// and date (optional) to /api/exercise/add. If no date supplied it will use current date.
// Return the the user object with the exercise fields added.
Router.post('/add', (req, res, next) => {
	const { userId, description, duration, date } = req.body

	if (!userId || !description || !duration) {
		res.json('Error: You have not entered any information.')
	}

	let datetime
	if (!date) {
		datetime = new Date()
	} else if (!isValidDate(date)) {
		return res.json('Error: Invalid date')
	} else {
		datetime = new Date(date)
	}

	getValidUser(req, res, userId, user => {
		const exercise = new Exercise({
			userId,
			description,
			duration,
			date: datetime
		})

		exercise.save((err, data) => {
			err
				? res.json('Error: There was an error saving your exercise')
				: res.json({
						_id: user._id,
						username: user.username,
						description: data.description,
						duration: data.duration,
						date: moment(data.date).format('ddd, DD MMM YYYY')
				  })
		})
	})
})

// I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(\_id).
// Return will be the user object with added array log and count (total exercise count).
// I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)
Router.get('/log', (req, res, next) => {
	const { userId, from, to, limit } = req.query

	getValidUser(req, res, userId, user => {
		Exercise.find({ userId: user._id })
			.limit(parseInt(limit))
			.select('-_id description duration date')
			.exec((err, data) => {
				res.json({
					_id: user._id,
					username: user.username,
					count: data.length,
					log: data
				})
			})
	})
})

export default Router
