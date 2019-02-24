const log = console.log;

const myImage = document.querySelector('#myImage');
const changePhoto = document.querySelector('#changePhoto');

const profilePicCircle = document.querySelector('#profilePicCircle');
const password = document.querySelector('#password');
const name = document.querySelector('#name');
const email = document.querySelector('#email');
const description = document.querySelector('#description');
$("#description").keyup(wordCount)
changePhoto.addEventListener('click', function(){document.getElementById('myImage').click()})

function wordCount(e) {
	const count = $(".wordCount")
	const word = $("#description")
	count.text(150 - word.val().length)
}

const loadUser = () => {
	return new Promise((resolve, reject) => {
		$.get('/profile/data').then((result) => {
			resolve(result)
		}).catch((error) => {
			reject(error)
		})
	})
}

loadUser().then((user) =>{
	// if user login expires, go back to index.html
	if (user === "unauthorized") {
		window.location.href = '/'
	} else {
		name.value = user.name
		email.value = user.email
		const image = user.image
		profilePicCircle.setAttribute("src", image)
		if (user.description) {
			description.value = user.description
		}	
		function submitProfile(e) {
			e.preventDefault()
			let pw = user.password;
			if (password.value) {
				pw = password.value
			} 
			const properties = { password: pw, name: name.value, email: email.value, description: description.value }
			$.ajax({
				url: "/profile/data",
				type: "PATCH",
				dataType: 'json',
				data: properties,
			})
			window.location = "/calendar"
		}
		myImage.addEventListener('change', uploadPhoto);
		function uploadPhoto(e) {
			const file = e.target.files[0];
			if(!/image\/\w+/.test(file.type)){ 
        		alert("Please choose a valid picture"); 
        		return false; 
    		} 
			const reader = new FileReader();
			reader.onload = (e) => {
				profilePicCircle.setAttribute("src", e.target.result)
			}
			reader.readAsDataURL(file)
			// update the profile picture to server
			const formData = new FormData()
			formData.append('image', file)
			$.ajax({
				url: "/profile/image",
				type: "POST",
				data: formData,
				processData: false,
				contentType: false
			}).then((result) => {
				if (user === "unauthorized") {
					window.location.href = '/'
				} else {
					const p = $("#message")
					p.css('visibility', 'visible')
					setTimeout(() => {
						p.css('visibility', 'hidden')
					}, 2000)
				}
			})
		}

		$("#profileAddForm").on("submit", submitProfile)

	}
	
}).catch((error) => {
	log(error)
})