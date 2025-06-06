
const formBtn = document.getElementById('form-btn');
const cancelBtn = document.getElementById('cancel');
const form = document.getElementById('task-form');
const filterBtn = document.getElementById('filter-btn');
const filterOptions = document.getElementById('filter-options');
const filterButtons = document.querySelectorAll('.filter-option');

// add task button that shows form when clicked
formBtn.addEventListener('click', () => {
    if (form.style.display === 'none') {
        form.style.display = 'block';
        formBtn.style.display = 'none';
        filterBtn.style.display ='none';
    } else {
        form.style.display = 'none';
    }
})

// exits out of form
cancelBtn.addEventListener('click', () => {
    form.style.display = 'none';
    formBtn.style.display = 'block';
    filterBtn.style.display ='block';

})

// shows options when filter is clicked
filterBtn.addEventListener('click', () => {
   filterOptions.classList.toggle('show');
});


fetch('/tasks')
    .then(response => {
        console.log("Status:", response.status);
        if (!response.ok) {
            throw new Error('http error');
        }
        return response.json();
    })
    .then(data => {
        allTasks = data;
        displayTasks(data);
    })
      
    .catch (err => {
        console.error("Error fetching", err)
});

  
// filter tasks based on option
filterButtons.forEach(button => {
	button.addEventListener('click', () => {
	const id = button.id; // filter type
	let sortedTasks = Array.from(allTasks);
	
	if (id === 'done') {
		sortedTasks = sortedTasks.filter(task => task.status.toLowerCase() === 'done');
	} else if (id === 'in-progress') {
		sortedTasks = sortedTasks.filter(task => task.status.toLowerCase() === 'in progress');
	} else if (id === 'later') {
		sortedTasks.sort((taskA, taskB) => new Date(taskB.due_date) - new Date(taskA.due_date));
	} else if (id === 'soon') {
		sortedTasks.sort((taskA, taskB) => new Date(taskA.due_date) - new Date(taskB.due_date));
	} else if (id === 'overdue') {
		
		// show overdue tasks past today's date
		const today = new Date();

		sortedTasks = sortedTasks.filter(task => {
			const due = new Date(task.due_date);
			return due < today;
		});
	}

	// update with filtered tasks
	displayTasks(sortedTasks);
	filterOptions.classList.remove('show'); 	// hide options after selecting

	});
});


function displayTasks(tasks) {
	const taskList = document.getElementById('task-list');
	taskList.innerHTML ='';

	tasks.forEach(task => {
		const taskBox = document.createElement('div');
		taskBox.classList.add('task-card');

		// right side for checkbox
		const right = document.createElement("div");
		right.classList.add('right')

		// left side for info
		const left = document.createElement('div');
		left.classList.add('left')
		
		// for task name & delete x
		const top = document.createElement('div');

		// task name
		top.classList.add('top-container')
		const taskName = document.createElement('div');
		taskName.classList.add('task-name');
		taskName.textContent = task.title;
		top.appendChild(taskName);

		// date
		const dateObj = new Date(task.due_date);
		const month = String(dateObj.getMonth() + 1);
		const day = String(dateObj.getDate())
		const year = dateObj.getFullYear();;
		const taskDate = `${month}-${day}-${year}`;

		const date = document.createElement('div');
		date.classList.add('task-date')
		date.textContent = `Due: ${taskDate}`;
		

		// status
		const status = document.createElement('div');
		status.classList.add('task-status');
		status.textContent = task.status;

		// delete task
		const deleteBtn = document.createElement('button');
		deleteBtn.classList.add('delete-btn');

		// delte x image
		const deleteImg = document.createElement('img');
		deleteImg.src = '/img/x.svg';
		deleteImg.alt ='delete';
		deleteImg.classList.add('delete-img');

		deleteBtn.appendChild(deleteImg);
		top.appendChild(deleteBtn);

		deleteBtn.addEventListener('click', () => {
			fetch(`/todolist/${task.id}`, { 
				method: 'DELETE'
			})                                                      
			.then(response => {
				if (!response.ok) {
					throw new Error('response not ok');
				}
				return response.json();
			})
			.then(data => {
				console.log("Deleted: ", data)
				console.log(JSON.stringify(data)); 
				window.location.href = "/";
			})
			.catch(error => {
				console.error('problem deleting:', error);
			});
		}); // end addEventListener

		// checkbox for in progress/done
		const checkbox = document.createElement('input')
		checkbox.classList.add('checkbox');
		checkbox.type = 'checkbox';
		if (task.status === 'Done') checkbox.checked = true;

		checkbox.addEventListener('change', () => {
			let newStatus;
			if (checkbox.checked) {
				newStatus = 'Done';
			} else {
				newStatus = 'in progress'
			}
			
			fetch(`/todolist/${task.id}/status`, {
				method: 'PUT',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({ status: newStatus })
			})
			.then(response => {
				if (!response.ok) {
					throw new Error('update failed');
				}
				return response.json();
			})
			.then(data => {
				status.textContent = newStatus; 
				task.status = newStatus;
			})
			.catch(err => {
				console.error('error updating status:', err);
			});
		});
			

		left.appendChild(checkbox);
		right.appendChild(top);
		right.appendChild(date);
		right.appendChild(status);
		taskBox.appendChild(left);
		taskBox.appendChild(right);
		taskList.appendChild(taskBox);
  });
}