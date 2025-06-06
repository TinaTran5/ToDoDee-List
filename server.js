
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const app = express();
var mysql = require("mysql2");
const PORT = 1149;

app.set("views", "views");
app.set("view engine", "pug");

app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false
}));


var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}).promise();

app.use(express.static('static'));
app.use(express.urlencoded({ extended: true}));
app.use(express.json());

// to do list page
app.get('/', async (req, res) => {
    const userId = req.session.userId;
    const username = req.session.username; 
    
    // if user is not loggedn in redirect to sign in page
    if (!userId) return res.redirect('/html/signin.html');

    try {
        // task by due date (asc)
        const [todos] = await connection.query("SELECT * FROM todolist WHERE user_id = ? ORDER BY due_date", [userId]);
        
        // render pug with data and username
        res.render('todo', { todos, username });
    } catch (err) {
        console.error('GET todolist error', err);
        res.status(500).send("Error loading todolist page");
    }
});


// get tasks from user
app.get('/tasks', async (req, res) => {
    const userId = req.session.userId;

    // user not loggned in
    if (!userId) {
        return res.status(401).json({error: "Not Logged In"});
    }

    try {
        // task by due date (asc)
        const [results] = await connection.query("SELECT * FROM todolist WHERE user_id = ? ORDER BY due_date ASC", [userId]);
        res.json(results); // Sends tasks to frontend
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});      

// add a new task
app.post('/add-task', async (req, res) => {
    const userId = req.session.userId;
    const task_name = req.body['task_name'];
    const due_date = req.body['due_date'];
    const status = req.body['status'];

    try {
        // add new tasks
        await connection.execute(
            "INSERT INTO todolist (title, due_date, status, user_id) VALUES (?, ?, ?, ?)",
            [task_name, due_date, status, userId]
        );
        res.redirect('/');
    } catch (err) {
        console.error("Error adding a task:", err);
        res.status(500).send("add task error");
    }
});

// update in progress/done status
app.put('/todolist/:id/status', async (req, res) => {
    const id = req.params.id;
    const status = req.body.status;
  
    try {
        await connection.execute("UPDATE todolist SET status = ? WHERE id = ?", [status, id]);
        res.json({ success: true });
    } catch (err) {
        console.error("Status update error:", err);
        res.status(500).json({ error: "Could not update status" });
    }
  });
  

// delete tasks
app.delete('/todolist/:id', async(req, res) => {
    const taskId = req.params.id;

    try {
        const [results] = await connection.execute('DELETE FROM todolist WHERE id=?', [taskId]);
        console.log('task deleted');
        res.json(results); 
    } catch (error) {
        console.error("DELETE error:", error);
        res.status(500).send(`Error deleting event with id ${taskId}: ${error}`);
    }
})

// signup user
app.post('/signup', async(req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {

        // hash password
        const SALT_ROUNDS_COUNT = 10;
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS_COUNT);
        console.log("Sucessfully created user");
        

        await connection.execute(
            'INSERT INTO users (username, password) VALUES (?,?)', [username, hashedPassword]
        );
        res.redirect('/html/signin.html');

    } catch (err) {
        console.error('signup error', err);
        res.status(500).send("signup failed")
    }
})

// login user
app.post('/login', async(req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {

        // find user with given username
        const [users] = await connection.execute(
            "SELECT * FROM users WHERE username=?", [username]
        );
        const user = users[0];

        // return error if user not found
        if (!user) {
            return res.send("Invalid username or password");
        }

        // checks if password is correct
        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
            return res.send("Invalid username or password");
        }

        // store innnn session
        req.session.userId = user.id;
        req.session.username = user.username;
        res.send('OK')
    
    } catch (err) {
        console.error('login error', err);
        res.status(500).send("server error during login")
    }
})

// logout user
app.post('/logout', async(req, res) => {
    req.session.destroy( err => {
        if (err) {
            console.error('logout error', err);
            return res.status(500).send("logout failed");
        }
        console.log("sucessfully logged out")
        res.redirect('/html/signin.html');
    });
});


// delete user account
app.post('/delete-account', async(req,res) => {
    const userId = req.session.userId;

    try {
        await connection.execute('DELETE FROM users WHERE id=?', [userId]);  // delete user
        await connection.execute('DELETE FROM todolist WHERE user_id =?', [userId]); // delete user's tasks

        // end session
        req.session.destroy(() => {
            console.log("sucessfully destroyed account")
            res.redirect('/html/signup.html');
        });
    } catch (err) {
        console.error("account deleting  error", err);
        res.status(500).send("failed to delete account");
    }
});


app.listen(PORT, () => {
    console.log(`Running at http://localhost:${PORT}`);
})


app.use((req, res, next) => {
    res.status(404).send("Route not found!")
})