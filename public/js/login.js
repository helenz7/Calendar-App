/* Login js */

'use strict';

$(document).ready(function(){
	$("#sign-up").click(signUpFunction)
	$("#login-button").click(loginCheck)

	function signUpFunction(e) {
		window.location.href = '/signup'
	}

	function loginCheck(e) {
		e.preventDefault()
		/* Do something to login, require backend connection
		*/
		const name = $("#name").val()
		const password = $("#password").val()
		$.post('/login/testuser', {
			name: name,
			password: password
		}).then((result) => {
			if (result === "admin") {
				window.location.href = '/admin'
			} else if (result === "user") {
				window.location.href = '/calendar'
			} else {
				if (result === "wrongpassword") {
					const p = $("#passwordMessage")
					p.css('visibility', 'visible')
					setTimeout(() => {
						p.css('visibility', 'hidden')
					}, 2000)
				}	
				else if (result === "unknown") {
					const p = $("#nameMessage")
					p.css('visibility', 'visible')
					setTimeout(() => {
						p.css('visibility', 'hidden')
					}, 2000)
				}
			}
		}).catch((error) => {
			console.log(error)
		})
	}

})