'use strict';
const log = console.log;

document.addEventListener('DOMContentLoaded', function() {
	// sample events
	// const eventsList = [{id: 0,title: 'Reading Week', start: '2018-11-05', end: '2018-11-10', type: 'study',
	// 		description: 'Relax!'}, 
	// 		{id: 1, title: 'Test', start: '2018-11-23', type: 'default', description:'CSC309'}];

	const loadUser = () => {
		return new Promise((resolve, reject) => {
			$.get('/calendar/info').then((result) => {
				resolve(result)
			}).catch((error) => {
				reject(error)
			})
		})
	}

	loadUser().then((user) => {
		// if user login expires, go back to index.html
		if (user === "unauthorized") {
			window.location.href = '/'
		}

		// update user info
		const infoName = document.querySelector('#infoName')
		infoName.innerText = user.name
		const infoUserName = document.querySelector('#infoUserName')
		infoUserName.innerText = '@' + user.userName
		const profileImage = document.querySelector('#profileImage')
		profileImage.src = user.image
		const infoDescription = document.querySelector('#infoDescription')
		if (user.description) {
			infoDescription.innerText = user.description
		}
		// warning message
		const message = document.querySelector('#message')

		// use Full Calendar to create div calender.
		$('#calendar').fullCalendar({
			height: 850,
		    eventLimit: true,
		    editable: false,
		    events: user.events.map((event) => {
		    	return {
		    		id: event._id,
		    		title: event.title,
		    		start: event.start,
		    		end: event.end,
		    		color: getColorByType(event.type),
		    		description: event.description
		    	}
		    }),

		    // pop over event description
	     	eventRender: function(event, element) {
	      		element.popover({
	      			animation: true,
	      			// call from server
	        		title: event.title,
	        		content: event.description,
	        		trigger: 'hover',
	        		placement: 'auto',
	        		container: 'body'
	      		});
	      		setTimeout(function() {element.popover('hide')}, 5000)
	    	},

	    	// delete when click
	    	eventClick: function(event, element) {
		    	if (confirm("Do you want to remove this event?")) {
		    		deleteEvent(event).then(() => {
			    		$('.popover').remove()
		    			$('#calendar').fullCalendar('removeEvents', event.id)
		    			message.innerText = 'Success: Event removed.'
						message.setAttribute("style", "color: green")
						setMessageTime()		    		
					}).catch((error) => {
		    			message.innerText = 'Could not remove event.'
						message.setAttribute("style", "color: red")
						setMessageTime()
		    		})
	    		}
	  		}
		});

		// add event modal
		$('#addNewEvent').on('click', function(e){
	     	$('#newEventDeatil').modal('show');
	     	e.preventDefault();
	  	});

		$("#inputDescription").keyup(wordCount)
		const eventsForm = document.querySelector('#eventsForm');
		const addNew = document.querySelector('#addNewForm');

		eventsForm.addEventListener('submit', searchEventFunc);
		addNew.addEventListener('submit', createEvent);

		// for search info and add event
		const searchModel = document.querySelector('#searchEventInfo');
		const prev = $('#prev');
		const next = $('#next');
		const add = $('#add');
		const sTitle = searchModel.querySelectorAll('span')[0];
		const sStart = searchModel.querySelectorAll('span')[1];
		const sEnd = searchModel.querySelectorAll('span')[2];
		const sType = searchModel.querySelectorAll('span')[3];
		const sDescription = searchModel.querySelectorAll('span')[4];
		const sUsers = searchModel.querySelector('#showUsersPic');

		let i = 0;
		let result = {};
		let eventNo = result.length;

		function searchEventFunc(e) {
			e.preventDefault();

			i = 0;
			result = {};
			eventNo = result.length;
			const eventInput = eventsForm.querySelector('#eventInput');
			$.get('/calendar/search/' + eventInput.value).then((r) => {
				if (r === "NoSuchEvent") {
					message.innerText = 'No such event exists'
					message.setAttribute("style", "color: red")
					setMessageTime()
				} else if (r === "unauthorized") {
					window.location.href = '/'
				} else {
					// update first event in the list
					result = r;
					eventNo = result.length;
					showSearchDetail(i, r)
					$('#showEvenetInfo').modal('show');
				}
			})
		}

		prev.on('click', () => {
			if (1 <= i) {
				i = i - 1
				sUsers.innerHTML = '';
				showSearchDetail(i, result);
			}
		})

		next.on('click', () => {
			if (i < eventNo - 1) {
				i = i + 1
				sUsers.innerHTML = '';
				showSearchDetail(i, result);
			}
		})

		add.on('click', () => {
			$.post('/calendar/addSearch', {eventID: result[i]._id}).then((r) => {
				if (r === "Add") {
					$('#calendar').fullCalendar('renderEvents', [result[i]].map((event) => {
				    	return {
				    		id: event._id,
				    		title: event.title,
				    		start: event.start,
				    		end: event.end,
				    		color: getColorByType(event.type),
				    		description: event.description
				    	}}), true);
					message.innerText = 'Success: Added an event.'
					message.setAttribute("style", "color: green")
					setMessageTime()
					$('#showEvenetInfo').modal('hide');
				} else if (r === "unauthorized") {
					window.location.href = '/'
				} else {
					message.innerText = 'Fail: Event already exists in calendar.'
					message.setAttribute("style", "color: red")
					setMessageTime()
					$('#showEvenetInfo').modal('hide');
				}
			})
		})

		function showSearchDetail(i, result) {
			sTitle.innerText = eventInput.value;
			sStart.innerText = result[i].start;
			sEnd.innerText = result[i].end;
			sType.innerText = result[i].type;
			if (result[i].description) {
				sDescription.innerText = result[i].description;
			} else {
				sDescription.innerText = "No description."
			}
			// clear sUsers innerHTML first.
			sUsers.innerHTML = '';
			$.post('/calendar/addEventBySearch', {users: result[i].users}).then((userlst) => {
				if (userlst === "unauthorized") {
					window.location.href = '/'
				}
				for (let userNo = 0; userNo < userlst.length; userNo++) {
					const newPic = document.createElement('img')
					newPic.setAttribute("id", "smallPics")
					newPic.setAttribute("data-toggle", "popover")
					newPic.src = userlst[userNo].image
					sUsers.appendChild(newPic)
					newPic.setAttribute("title", userlst[userNo].name)
					newPic.setAttribute("data-content", userlst[userNo].email)
				}
				$("[data-toggle='popover']").popover()
			})
		}

		function wordCount(e) {
			const count = $(".wordCount")
			const word = $("#inputDescription")
			count.text(150 - word.val().length)
		}

		function createEvent(e) {
			// appears the added event, and avioding the refresh
			e.preventDefault();

			const titleIn = addNew.querySelector('#inputTitle').value;
			const startDate = addNew.querySelector('#inputDate').value;
			const endDate = addNew.querySelector('#endDate').value;
			const typeIn = addNew.querySelector('#inputType').value;
			const description = addNew.querySelector('#inputDescription').value;

			const event = {title: titleIn, start: startDate, end: endDate, type: typeIn, description: description};
			$.post('/calendar/add', event).then((result) => {
				if (result === "unauthorized") {
					window.location.href = '/'
				} else if (result === "Duplicate") {
					message.innerText = 'Fail: the same event had been created.'
					message.setAttribute("style", "color: red")
					setMessageTime()
				} else {
				 	$('#calendar').fullCalendar('removeEvents')
				 	$('#calendar').fullCalendar('addEventSource', result.map((event) => {
				    	return {
				    		id: event._id,
				    		title: event.title,
				    		start: event.start,
				    		end: event.end,
				    		color: getColorByType(event.type),
				    		description: event.description
				    	}
					}))
				 	$('#calendar').fullCalendar('rerenderEvents')
					message.innerText = 'Success: Added an event.'
					message.setAttribute("style", "color: green")
					setMessageTime()	
				}
			}).catch((error) => {
				log(error)
			})
			// clear and close pop up window
			$(':input').val('')
			$('#newEventDeatil').modal('hide')
		}

		function deleteEvent(event) {
			return new Promise((resolve, reject) => {
				const target = {
					title: event.title,
					start: event.start._i,
					end: event.end._i,
					type: getTypeByColor(event.color)
				}
			    $.post('/calendar/delete', target).then((result) => {
					if (result === "done") {
						resolve()
					} else if (result === "unauthorized") {
						window.location.href = '/'
					} else {
						console.log(result)
						reject()
					}
				})
			})
		}

		function setMessageTime() {
			setTimeout(() => {
				message.innerText = ''
			}, 3000)
		}

		function getColorByType(typeText) {
			if (typeText === 'default') {
				return 'lightblue';
			} else if (typeText === 'study') {
				return '#ccffcc'; //light green
			} else if (typeText === 'exam') {
				return '#ff9999' //light red
			} else if (typeText === 'event') {
				return 'lightyellow'
			} else if (typeText === 'holiday') {
				return '#ffd9c9' //light salmon
			}
		}

		function getTypeByColor(typeText) {
			if (typeText === 'lightblue') {
				return 'default';
			} else if (typeText === '#ccffcc') {
				return 'study'; //light green
			} else if (typeText === '#ff9999') {
				return 'exam'; //light red
			} else if (typeText === 'lightyellow') {
				return 'event';
			} else if (typeText === '#ffd9c9') {
				return 'holiday'; //light salmon
			}
		}
	}).catch((error) => {
		console.log(error)
	})
});

