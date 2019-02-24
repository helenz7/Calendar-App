/* Sign up js */

'use strict';

$(document).ready(function(){
	$("#password").keyup(checkPasswordMatch)
	$("#passwordconfirm").keyup(checkPasswordMatch)
	$('form').submit(createAccount)

	function checkPasswordMatch(e) {
		const inputList = $("input").toArray()
		/*check password match*/
		if (inputList[1].value !== inputList[2].value) {
			inputList[2].setCustomValidity("Password does not match!")
		} else {
			inputList[2].setCustomValidity("")
		}
	}

	function createAccount(e) {
		e.preventDefault()
		const info = $(":input")
		const checkbox = $("[name = 'gender']")
		let gender = null
		if (checkbox[0].checked) {
			gender = "male"
		} else if (checkbox[1].checked) {
			gender = "female"
		} else {
			gender = "other"
		}
		const newUser = {
			userName: info[0].value,
			password: info[1].value,
			email: info[3].value,
			name: info[4].value + ' ' + info[5].value,
			gender: gender
		}
		$.post('/signup/testuser', newUser).then((result) => {
			if (result === "user exists") {
				alert("Username already exists!")
			}
			if (result === "success") {
				window.location.href = '/'
			}
		}).catch((error) => {
			console.log(error)
		})
	}
})
