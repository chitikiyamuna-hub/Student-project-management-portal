const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

class MemoryDb {
  constructor() {
    this.tasks = [];
    this.users = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });

      // 1. Initialize Users
      try {
        const usersContent = await fs.readFile(USERS_FILE, 'utf8');
        this.users = JSON.parse(usersContent);
      } catch (err) {
        // Seed default evaluator student
        this.users = [
          {
            id: 'default-student-1',
            name: 'Manoj Kumar S',
            email: 'student@veltech.edu.in',
            rollNo: 'VT2026-3853',
            branch: 'B.Tech Computer Science & Eng.',
            college: 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute',
            password: 'password123' // Plaintext for evaluation ease
          }
        ];
        await this.saveUsers();
      }

      // 2. Initialize Tasks
      try {
        const fileContent = await fs.readFile(TASKS_FILE, 'utf8');
        this.tasks = JSON.parse(fileContent);
      } catch (err) {
        this.tasks = [];
      }

      // Pre-seed tasks if database is empty
      if (this.tasks.length === 0) {
        console.log('Seeding 10 sample student mini-projects assigned to student@veltech.edu.in...');
        const seedTasks = [
          {
            id: 'seed-task-1',
            studentEmail: 'student@veltech.edu.in',
            title: 'E-Commerce Microservices Engine',
            description: 'Designed an asynchronous ordering system with RabbitMQ messages, Express.js gateways, and Docker environments.',
            status: 'Completed',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'seed-task-2',
            studentEmail: 'student@veltech.edu.in',
            title: 'Smart Parking IoT Controller',
            description: 'Deploys ultrasonic sensors to detect vehicle occupancy and publish status keys via MQTT to an interactive React visual map.',
            status: 'In Progress',
            createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'seed-task-3',
            studentEmail: 'student@veltech.edu.in',
            title: 'AI-Powered Medical Chatbot',
            description: 'A retrieval-augmented generation NLP pipeline running on Python Flask to diagnose symptom queries and advise health tips.',
            status: 'Pending',
            createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'seed-task-4',
            studentEmail: 'student@veltech.edu.in',
            title: 'Decentralized Voting System (Web3)',
            description: 'Solidity smart contracts running on Ethereum local chains. Guarantees anonymous ballot castings and verified tallies.',
            status: 'Completed',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'seed-task-5',
            studentEmail: 'student@veltech.edu.in',
            title: 'Autonomous Delivery Drone Navigator',
            description: 'Designed dynamic pathfinding logic in Unity. Optimizes flight routes while steering around structural coordinates.',
            status: 'In Progress',
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'seed-task-6',
            studentEmail: 'student@veltech.edu.in',
            title: 'Real-time Collaborative Whiteboard',
            description: 'Multiplayer drawing canvas powered by Socket.io, supporting canvas sync, vector brushes, and export states.',
            status: 'Completed',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'seed-task-7',
            studentEmail: 'student@veltech.edu.in',
            title: 'AR Campus Navigation Mobile App',
            description: 'Unity AR Foundation application overlaying virtual directional vectors on live cameras to direct campus visitors.',
            status: 'Pending',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'seed-task-8',
            studentEmail: 'student@veltech.edu.in',
            title: 'Cryptocurrency Portfolio Tracker',
            description: 'Tracks market valuations by pulling public prices from CoinGecko API. Compiles charts with visual line animations.',
            status: 'In Progress',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'seed-task-9',
            studentEmail: 'student@veltech.edu.in',
            title: 'Machine Learning Image Classifier',
            description: 'Convolutional neural network model trained on CIFAR-10 to classify aircraft, vehicles, and wildlife inputs.',
            status: 'Completed',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'seed-task-10',
            studentEmail: 'student@veltech.edu.in',
            title: 'Mental Health Companion App',
            description: 'Mood diary utilizing sentiment analysis models to identify user stress levels and recommend breathing routines.',
            status: 'Pending',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        this.tasks = seedTasks;
        await this.saveTasks();
      }

      this.initialized = true;
      console.log('In-memory database initialized. Tasks Path:', TASKS_FILE, 'Users Path:', USERS_FILE);
    } catch (err) {
      console.error('Failed to initialize in-memory database:', err);
      this.tasks = [];
      this.users = [];
      this.initialized = true;
    }
  }

  async saveTasks() {
    try {
      await fs.writeFile(TASKS_FILE, JSON.stringify(this.tasks, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing tasks to disk:', err);
    }
  }

  async saveUsers() {
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing users to disk:', err);
    }
  }

  // --- USER API METHODS ---
  async getUserByEmail(email) {
    await this.init();
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async createUser(userData) {
    await this.init();
    const existing = await this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error('Email is already registered');
    }

    const newUser = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      rollNo: userData.rollNo,
      branch: userData.branch,
      college: userData.college || 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute',
      password: userData.password // Plaintext for demo simplicity
    };

    this.users.push(newUser);
    await this.saveUsers();
    
    // Return student details without password
    const { password, ...details } = newUser;
    return details;
  }

  async verifyUser(email, password) {
    await this.init();
    const user = await this.getUserByEmail(email);
    if (!user || user.password !== password) {
      return null;
    }
    const { password: _, ...details } = user;
    return details;
  }

  // --- TASK CRUD METHODS (FILTERED BY STUDENT) ---
  async getAll({ search = '', status = '', sort = 'newest' } = {}, studentEmail) {
    await this.init();
    
    // Filter by task owner
    let filtered = this.tasks.filter(t => t.studentEmail && t.studentEmail.toLowerCase() === studentEmail.toLowerCase());

    // Search query
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        t => (t.title && t.title.toLowerCase().includes(q)) || 
             (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }

    // Sort by created date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }

  async getById(id, studentEmail) {
    await this.init();
    const task = this.tasks.find(t => t.id === id);
    if (!task || task.studentEmail.toLowerCase() !== studentEmail.toLowerCase()) return null;
    return task;
  }

  async create(data, studentEmail) {
    await this.init();
    const newTask = {
      id: uuidv4(),
      studentEmail: studentEmail.toLowerCase(),
      title: data.title,
      description: data.description || '',
      status: data.status || 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.tasks.push(newTask);
    await this.saveTasks();
    return newTask;
  }

  async update(id, data, studentEmail) {
    await this.init();
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    // Verify task ownership
    const task = this.tasks[index];
    if (task.studentEmail.toLowerCase() !== studentEmail.toLowerCase()) {
      throw new Error('Unauthorized task update request');
    }

    const updatedTask = {
      ...task,
      title: data.title !== undefined ? data.title : task.title,
      description: data.description !== undefined ? data.description : task.description,
      status: data.status !== undefined ? data.status : task.status,
      updatedAt: new Date().toISOString()
    };

    this.tasks[index] = updatedTask;
    await this.saveTasks();
    return updatedTask;
  }

  async delete(id, studentEmail) {
    await this.init();
    const index = this.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;

    // Verify task ownership
    const task = this.tasks[index];
    if (task.studentEmail.toLowerCase() !== studentEmail.toLowerCase()) {
      throw new Error('Unauthorized task delete request');
    }

    this.tasks.splice(index, 1);
    await this.saveTasks();
    return true;
  }

  async getStats(studentEmail) {
    await this.init();
    const stats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0
    };

    this.tasks.forEach(t => {
      if (t.studentEmail && t.studentEmail.toLowerCase() === studentEmail.toLowerCase()) {
        stats.total++;
        if (t.status === 'Pending') stats.pending++;
        else if (t.status === 'In Progress') stats.inProgress++;
        else if (t.status === 'Completed') stats.completed++;
      }
    });

    return stats;
  }
}

module.exports = new MemoryDb();
