/* server.js */
'use strict';
const log = console.log;
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const session = require('express-session')
const formidable = require('formidable')
const fs = require('fs')

// Mongoose
const { mongoose } = require('./db/mongoose');

// Express
const port = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.json());
// parse incoming parameters to req.body
app.use(bodyParser.urlencoded({ extended:true }))

// Import the models
const { User } = require('./models/user')
const { Event } = require('./models/event')

// static directory
app.use("/js", express.static(__dirname + '/public/js'))
app.use("/css", express.static(__dirname + '/public/css'))
app.use("/img", express.static(__dirname + '/public/img'))
app.use("/view", express.static(__dirname + '/public'))


/*-------------------- SESSION CHECKERS --------------------*/
// Add express sesssion middleware
app.use(session({
	secret: 'secret',
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires: 600000,
		httpOnly: true
	}
}))

// Add middleware to check for logged-in users
const sessionChecker = (req, res, next) => {
	if (req.session.user) {
		if (req.session.user.admin) {
			res.sendFile(__dirname + '/view/admin.html')
		} else {
			res.sendFile(__dirname + '/view/calendar.html')
		}
	} else {
		next()
	}
}

const calendarSessionChecker = (req, res, next) => {
	if (!req.session.user) {
		res.send("unauthorized")
	} else {
		next()
	}
}

const adminSessionChecker = (req, res, next) => {
	if (!req.session.user || !req.session.user.admin) {
		res.send("unauthorized")
	} else {
		next()
	}
}

/*-------------------- ROUTES --------------------*/
// route for root; redirect to index
app.get('/', sessionChecker, (req, res) => {
	res.redirect('/view/index.html')
})

// route for signup; redirect to signup
app.get('/signup', sessionChecker, (req, res) => {
	res.redirect('/view/signup.html')
})

// route for admin; redirect to index if session expired
app.get('/admin', sessionChecker, (req, res) => {
	res.redirect("/")
})

// route for calendar; redirect to index if session expired
app.get('/calendar', sessionChecker, (req, res) => {
	res.redirect("/")
})

// route for profile; redirect to index if session expired
app.get('/profile', (req, res) => {
	if (req.session.user) {
		res.sendFile(__dirname + '/view/profile.html')
	} else {
		res.redirect("/")
	}
})

/*-------------------- login -------------------------
Request body expects:
{
	name: <string>,
	password: <string>
}
if found the user, will redirect to calendar and
can access this user's file by attrs listed on user.js
*/
app.post('/login/testuser', (req, res) => {
	User.login(req.body.name, req.body.password).then((user) => {
		req.session.user = user
		if (user.admin) {
			res.send("admin")
		} else {
			res.send("user")
		}
	}).catch((error) => {
		if (error === "unknown" || error == "wrongpassword") {
			res.send(error)
		} else {
			res.status(500).send(error)
		}
	})

})


/*------------------------- sign up -------------------------
Request body expects:
{
	userName: <string>,
	password: <string>,
	email: <string>,
	name: <string>,
	gender: <string>
}
if found the user, will redirect to calendar and
can access this user's file by attrs listed on user.js
*/
app.post('/signup/testuser', (req, res) => {
	const newSignup = {
		userName: req.body.userName,
		password: req.body.password,
		email: req.body.email,
		name: req.body.name,
		gender: req.body.gender,
		admin: false,
		image: "/img/default.png"
	}
	User.find({userName: req.body.userName}).then((user) => {
		if (user.length) {
			res.send("user exists")
		} else {
			const newUser = new User(newSignup)
			newUser.save().then((result) => {
				res.send("success")
			}).catch((error) => {
				res.status(500).send(error)
			})
		}
	}).catch((error) => {
		res.status(500).send(error)
	})

})


// ---------------------------- Calender -----------------------------

/* if user exits, send the user UserSchema to server */
app.get('/calendar/info', calendarSessionChecker, (req, res) => {
	User.findById(req.session.user._id).then((user) => {
		res.send(user)
	}).catch((error) => {
		res.status(500).send(error)
	})
})


// for calendar page search events with same title
app.get('/calendar/search/:title', calendarSessionChecker, (req, res) => {
	const search = {title: req.params.title}
	Event.find(search).then((result) => {
		if (!result.length) {
			res.send("NoSuchEvent")
		} else {
			res.send(result)
		}
	}).catch((error) => {
		res.status(500).send(error)
	})
})


// for calendar page add event
/*
Request body expects:
{
	title: <string>,
	start: <string>,
	end: <string>,
	type: <string>,
	description: <string>
}
if found the user, will save the event if no duplicate event existing in Event, and calendar.js
will get the current events including the new added one.
*/
app.post('/calendar/add', calendarSessionChecker, (req, res) => {
	const event = {
		title: req.body.title,
		start: req.body.start,
		end: req.body.end,
		type: req.body.type,
		description: req.body.description
	}
	Event.find({title: event.title, start: event.start, end: event.end, type: event.type}).then((result) => {
		if (result.length) {
			// event already exists.
			res.send("Duplicate")
		} else {
			// add new event.
			const newEvent = new Event(event)
			User.findById(req.session.user._id).then((user) => {
				// save new event
				newEvent.users.push(user.userName)
				newEvent.save().then((event) => {
					user.events.push(event)
					return user.save()
				}).then((user) => {
				res.send(user.events)
				}).catch((e) => {
					res.status(500).send(e)
				})
			}).catch((error) => {
			res.status(400).send(error)
			})
		}
	})
})



// for calendar page get user detail when we want to add event by searching events modal
/*
Request body expects:
{
	users: <list>
}
Find users, and send a list of users UserSchema back followed by sent order
*/
app.post('/calendar/addEventBySearch', calendarSessionChecker, (req, res) => {
	const userlist = req.body.users;
	User.find({userName: {$in : userlist}}).then((user) => {
		const users = user.map((u) => {
			return {
				name: u.name,
				email: u.email,
				image: u.image
			}
		})
		res.send(users)
	}).catch((error) => {
		res.status(500).send(error)
	})
})


// for calendar page add event when searching events
/*
Request body expects:
{
	eventID: <string>
}
if user wants to add event that they found, add event if user does not already have it.
*/
app.post('/calendar/addSearch', calendarSessionChecker, (req, res) => {
	const event = { id: req.body.eventID }
	User.findOne({userName: req.session.user.userName}).then((user) => {
		const sameEvent = user.events.id(event.id)
		if (!sameEvent) {
			Event.findById(event.id).then((e) => {
				user.events.push(e)
				user.save()
				e.users.push(user.userName)
				e.save()
			}).then(() => res.send("Add"))
		} else {
			res.send("Duplicate")
		}
	}).catch((error) => {
			res.status(500).send(error)
	})
})


// for calendar page delete event
/*
Request body expects:
{
	title: <string>,
	start: <string>,
	end: <string>,
	type: <string>,
}
*/
app.post('/calendar/delete', calendarSessionChecker, (req, res) => {
	const event = {
		title: req.body.title,
		start: req.body.start,
		end: req.body.end,
		type: req.body.type,
	}
	const user = req.session.user
	// Update user's event list
	User.updateOne({userName: user.userName}, {$pull: {events: event}})
	.then((result) => {
		// Update event's user list
		Event.updateOne(event, {$pull: {users: user.userName}})
		.then((result) => {
			// if no more user in this event, remove this event
			Event.findOne(event)
			.then((e) => {
				if (!e.users.length) {
					e.remove()
				}
				res.send("done")
			})
		})
	}).catch((error) => {
		log(error)
		res.status(500).send(error)
	})
})

// for users to logout
app.get('/logout', (req, res) => {
	req.session.destroy((error) => {
		if (error) {
			res.status(500).send(error)
		} else {
			res.redirect('/')
		}
	})
})


// ------------------------- profile -------------------------
/* if user exits, send the user UserSchema to server */
app.get('/profile/data', (req, res) => {
	const user = req.session.user
	if (user) {
		User.findById(user._id).then((user1) => {
			res.send(user1)
		}).catch((error) => {
			res.status(400).send(error)
		})
	} else {
		res.send("unauthorized")
	}
})

//update user profile
/*
Request body expects:
{
	password: <string>,
	name: <string>,
	email: <string>,
	description: <string>
}
*/
app.patch('/profile/data', (req, res) =>{
	const user = req.session.user
	if (user) {
		const { password, name, email, description } = req.body
		const properties = { password, name, email, description }
		User.findById(user._id).then((user1) => {
			user1.set(properties)
			user1.save().then((result) => {
				res.send({user1})
			})
		}).catch((error) => {
			res.status(500).send(error)
		})
	} else {
		res.send("unauthorized")
	}
})

//upload user profile image
app.post('/profile/image', (req, res) =>{
	const user = req.session.user
	if (user) {
		const form = new formidable.IncomingForm();
		form.parse(req, (error, fields, file) => {
			fs.writeFileSync('./public/img/'+req.session.user.userName+'.jpg', fs.readFileSync(file.image.path))
		})
		User.findById(user._id).then((user) => {
			user.image = 'img/' + user.userName + '.jpg'
			return user.save()
		}).then((user) => {
			res.send(user)
		}).catch((error) => {
			res.status(500).send(error)
		})
	} else {
		res.send("unauthorized")
	}
})

// -------------------- admin ---------------------
// admin get all users.
app.get('/admin/users', adminSessionChecker, (req, res) => {
	if (req.session.user && req.session.user.admin) {
		User.find({}).then((users) => {
			return res.send({users})
		}).catch((error) => {
			res.status(400).send(error)
		})
	} else {
		res.send("unauthorized")
	}
})

// admin get all events.
app.get('/admin/events', adminSessionChecker, (req, res) => {
	if (req.session.user && req.session.user.admin) {
		Event.find({}).then((events) => {
			return res.send({events})
		}).catch((error) => {
			res.status(400).send(error)
		})
	} else {
		res.send("unauthorized")
	}
})

// admin add user
/*
Request body expects:
{
	userName: <string>,
	email: <string>,
	password: <string>,
	name: <string>,
	gender: <string>,
	admin: <boolean>,
	image: <string>,
	events: Array
}
*/
app.post('/admin/user', adminSessionChecker, (req, res) => {
	const user = new User({
		userName: req.body.userName,
		email: req.body.email,
		password: req.body.userName + req.body.userName,
		name: req.body.name,
		gender: "unknown",
		admin: false,
		image: "",
		events: []
	})

	user.save().then((result) => {
		res.send({result});
	}, (error) => {
		res.status(400).send(error);
	});
})

// admin save edit user
/*
Request body expects:
{
	username: <string>,
	email: <string>,
	name: <string>
}
*/
app.post('/admin/editUser', adminSessionChecker, (req, res) => {
	const userName = req.body.userName
	User.updateOne({userName: userName}, {$set:{
		userName: req.body.userName,
		email: req.body.email,
		name: req.body.name
	}}, {new:true, upsert:true}).then((u) => {
		if (!(u.nModified === 1)) {
			res.status(400).send();
		} else {
			res.send('ok')
		}
	}).catch((error) => {
		res.status(400).send();
	});
})

// admin delete user
app.delete('/admin/user/:userName', adminSessionChecker, (req, res) => {
	const userName = parseInt(req.params.userName)
	if (req.session.user.userName === userName) {
		// cannot delete self.
		res.status(400).send()
	}

	User.deleteOne({userName: userName}).then((user) => {
		if (!user) {
			res.status(404).send();
		} else {
			res.send({ user });
		}
	}).catch((error) => {
		res.status(400).send();
	});
})

// admin delete event
app.post('/admin/deleteEvent', adminSessionChecker, (req, res) => {
	const event = {title: req.body.title, start: req.body.start, end: req.body.end, type: req.body.type}

	Event.findOne(event).then((event) => {
		User.updateMany({userName: {$in : event.users}}, {$pull: {events: event}}).then(() => {
			event.remove()
			res.send('')
		})
	}).catch((error) => {
		res.status(500).send(error)
	})
})

// init a admin for use.
function setUp() {
	User.find({admin: true}).countDocuments().then((admin) => {
		if (!admin) {
			const admin = new User({
				userName: "admin666",
				email: "example@gmail.com",
				password: "admin666",
				name: "team",
				gender: "unknown",
				admin: true,
				image: "/img/default.png"
			})
			admin.save()
		}
	}).catch((error) => {
		log("SetUp")
	})
}
setUp()
/// Listen

app.listen(port, () => {
	log(`Listening on port ${port}...`);
});
