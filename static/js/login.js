const loginForm = document.getElementById('login-form')

// check if login works
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // prevent reload
	
	// get username & password
    const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;

	// obj to send to server
    const loginInfo = {
		username: username,
		password: password
    };
  
	// send login info to server
	try {
		const response = await fetch('/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(loginInfo)
		});
	
		// response from server
		const result = await response.text();
		
		// if login works, go to homepage
		if (response.ok && result === 'OK') {
			window.location.href = '/'; 
		} else {
			alert(result); 
		}
	} catch (err) {
		console.error(err);
	}
});
  