
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const Todo = require('./Todo');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.send('To-Do Backend is running!');
});

// Get all tasks from MongoDB
app.get('/items', async (req, res) => {
    try {
        console.log('GET /items request received');

        const todos = await Todo.find().sort({ _id: -1 });

        console.log('Database:', mongoose.connection.name);
        console.log('Tasks from MongoDB:', todos);

        res.json(
            todos.map(todo => ({
                id: todo._id.toString(),
                text: todo.task,
                completed: todo.completed
            }))
        );
    } catch (err) {
        console.error('Fetch tasks error:', err.message);
        res.status(500).json({ message: 'Could not fetch tasks' });
    }
});

// Add a task
app.post('/add-item', async (req, res) => {
    try {
        const text = req.body.text;

        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({
                message: 'Please enter a valid task'
            });
        }

        const todo = await Todo.create({
            task: text.trim()
        });

        console.log('Task added:', todo.task);

        res.status(201).json({
            message: 'Task added successfully',
            todo: {
                id: todo._id.toString(),
                text: todo.task,
                completed: todo.completed
            }
        });
    } catch (err) {
        console.error('Add task error:', err.message);
        res.status(500).json({ message: 'Could not add task' });
    }
});

// Edit a task
app.put('/items/:id', async (req, res) => {
    try {
        const text = req.body.text;

        if (typeof text !== 'string' || !text.trim()) {
            return res.status(400).json({
                message: 'Please enter a valid task'
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const todo = await Todo.findByIdAndUpdate(
            req.params.id,
            { task: text.trim() },
            { new: true, runValidators: true }
        );

        if (!todo) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({
            message: 'Task updated successfully',
            todo: {
                id: todo._id.toString(),
                text: todo.task,
                completed: todo.completed
            }
        });
    } catch (err) {
        console.error('Update task error:', err.message);
        res.status(500).json({ message: 'Could not update task' });
    }
});

// Delete a task
app.delete('/items/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid task ID' });
        }

        const todo = await Todo.findByIdAndDelete(req.params.id);

        if (!todo) {
            return res.status(404).json({ message: 'Task not found' });
        }

        console.log('Task deleted:', todo.task);

        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        console.error('Delete task error:', err.message);
        res.status(500).json({ message: 'Could not delete task' });
    }
});

// Connect to MongoDB first, then start server
async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is missing from backend/.env');
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log('MongoDB connected successfully!');
        console.log('Connected database:', mongoose.connection.name);
        console.log('Using collection:', Todo.collection.name);

        app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Startup error:', err.message);
        process.exit(1);
    }
}

startServer();
