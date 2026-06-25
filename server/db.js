const mongoose = require('mongoose');
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const memoryDb = require('./memoryDb');

let activeAdapter = 'memory';

// MongoDB Mongoose Models
let MongoTaskModel;
let MongoUserModel;
const initMongoModels = () => {
  if (MongoTaskModel) return;
  
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    rollNo: { type: String, required: true },
    branch: { type: String, required: true },
    college: { type: String, required: true },
    password: { type: String, required: true }
  }, { 
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
      }
    }
  });
  MongoUserModel = mongoose.model('User', userSchema);

  const taskSchema = new mongoose.Schema({
    studentEmail: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' }
  }, { 
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  });
  MongoTaskModel = mongoose.model('Task', taskSchema);
};

// PostgreSQL setup
let pgPool;
const initPgTables = async () => {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      rollNo VARCHAR(100) NOT NULL,
      branch VARCHAR(255) NOT NULL,
      college VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);

  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      studentEmail VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'Pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

// MySQL setup
let mysqlConnection;
const initMysqlTables = async () => {
  await mysqlConnection.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      rollNo VARCHAR(100) NOT NULL,
      branch VARCHAR(255) NOT NULL,
      college VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `);

  await mysqlConnection.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id VARCHAR(36) PRIMARY KEY,
      studentEmail VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'Pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);
};

// Connect & check DBs
const connectDb = async () => {
  // 1. Try MongoDB
  if (process.env.MONGODB_URI) {
    try {
      console.log('Attempting MongoDB connection...');
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000
      });
      initMongoModels();
      activeAdapter = 'mongodb';
      console.log('Successfully connected to MongoDB!');
      return;
    } catch (err) {
      console.error('MongoDB connection failed, trying fallback. Error:', err.message);
    }
  }

  // 2. Try PostgreSQL
  if (process.env.DATABASE_URL || process.env.PG_URL) {
    try {
      console.log('Attempting PostgreSQL connection...');
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.PG_URL,
        connectionTimeoutMillis: 3000
      });
      await pgPool.query('SELECT NOW()'); // Health check
      await initPgTables();
      activeAdapter = 'postgresql';
      console.log('Successfully connected to PostgreSQL!');
      return;
    } catch (err) {
      console.error('PostgreSQL connection failed, trying fallback. Error:', err.message);
      if (pgPool) await pgPool.end().catch(() => {});
    }
  }

  // 3. Try MySQL
  if (process.env.MYSQL_URL || (process.env.MYSQL_HOST && process.env.MYSQL_USER)) {
    try {
      console.log('Attempting MySQL connection...');
      const config = process.env.MYSQL_URL 
        ? process.env.MYSQL_URL 
        : {
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            port: process.env.MYSQL_PORT || 3306,
            connectTimeout: 3000
          };
      mysqlConnection = await mysql.createConnection(config);
      await mysqlConnection.ping(); // Health check
      await initMysqlTables();
      activeAdapter = 'mysql';
      console.log('Successfully connected to MySQL!');
      return;
    } catch (err) {
      console.error('MySQL connection failed, trying fallback. Error:', err.message);
      if (mysqlConnection) await mysqlConnection.end().catch(() => {});
    }
  }

  // 4. Default to In-Memory
  console.log('Initializing file-persisted In-Memory DB...');
  await memoryDb.init();
  activeAdapter = 'memory';
};

// Database Methods Router
const dbRouter = {
  connect: connectDb,
  getActiveAdapter: () => activeAdapter,

  // --- AUTH DB METHODS ---
  async getUserByEmail(email) {
    if (activeAdapter === 'mongodb') {
      const user = await MongoUserModel.findOne({ email: email.toLowerCase() });
      return user ? user.toJSON() : null;
    }
    if (activeAdapter === 'postgresql') {
      const result = await pgPool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      return result.rows[0] || null;
    }
    if (activeAdapter === 'mysql') {
      const [rows] = await mysqlConnection.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      return rows[0] || null;
    }
    return memoryDb.getUserByEmail(email);
  },

  async createUser(userData) {
    if (activeAdapter === 'mongodb') {
      const user = new MongoUserModel({
        name: userData.name,
        email: userData.email.toLowerCase(),
        rollNo: userData.rollNo,
        branch: userData.branch,
        college: userData.college || 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute',
        password: userData.password
      });
      await user.save();
      return user.toJSON();
    }
    if (activeAdapter === 'postgresql') {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      const college = userData.college || 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute';
      const query = `
        INSERT INTO users (id, name, email, rollNo, branch, college, password)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, name, email, rollNo, branch, college;
      `;
      const result = await pgPool.query(query, [
        id,
        userData.name,
        userData.email.toLowerCase(),
        userData.rollNo,
        userData.branch,
        college,
        userData.password
      ]);
      return result.rows[0];
    }
    if (activeAdapter === 'mysql') {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      const college = userData.college || 'Vel Tech Rangarajan Dr. Sagunthala R&D Institute';
      await mysqlConnection.execute(
        'INSERT INTO users (id, name, email, rollNo, branch, college, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, userData.name, userData.email.toLowerCase(), userData.rollNo, userData.branch, college, userData.password]
      );
      const [rows] = await mysqlConnection.execute('SELECT id, name, email, rollNo, branch, college FROM users WHERE id = ?', [id]);
      return rows[0];
    }
    return memoryDb.createUser(userData);
  },

  async verifyUser(email, password) {
    if (activeAdapter === 'mongodb') {
      const user = await MongoUserModel.findOne({ email: email.toLowerCase() });
      if (!user || user.password !== password) return null;
      return user.toJSON();
    }
    if (activeAdapter === 'postgresql') {
      const result = await pgPool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
      const user = result.rows[0];
      if (!user || user.password !== password) return null;
      const { password: _, ...details } = user;
      return details;
    }
    if (activeAdapter === 'mysql') {
      const [rows] = await mysqlConnection.execute('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      const user = rows[0];
      if (!user || user.password !== password) return null;
      const { password: _, ...details } = user;
      return details;
    }
    return memoryDb.verifyUser(email, password);
  },

  // --- TASK CRUD METHODS (WITH STUDENT EMAIL SCOPE) ---
  async getAll({ search = '', status = '', sort = 'newest' } = {}, studentEmail) {
    if (activeAdapter === 'mongodb') {
      const query = { studentEmail: studentEmail.toLowerCase() };
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      const sortOrder = sort === 'newest' ? -1 : 1;
      const tasks = await MongoTaskModel.find(query).sort({ createdAt: sortOrder });
      return tasks.map(t => t.toJSON());
    }

    if (activeAdapter === 'postgresql') {
      let query = 'SELECT * FROM tasks WHERE studentEmail = $1';
      const params = [studentEmail.toLowerCase()];
      let paramCount = 2;

      if (status) {
        query += ` AND status = $${paramCount++}`;
        params.push(status);
      }
      if (search) {
        query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      query += ` ORDER BY createdAt ${sort === 'newest' ? 'DESC' : 'ASC'}`;
      const result = await pgPool.query(query, params);
      return result.rows;
    }

    if (activeAdapter === 'mysql') {
      let query = 'SELECT * FROM tasks WHERE studentEmail = ?';
      const params = [studentEmail.toLowerCase()];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      if (search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` ORDER BY createdAt ${sort === 'newest' ? 'DESC' : 'ASC'}`;
      const [rows] = await mysqlConnection.execute(query, params);
      return rows;
    }

    return memoryDb.getAll({ search, status, sort }, studentEmail);
  },

  async getById(id, studentEmail) {
    if (activeAdapter === 'mongodb') {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const task = await MongoTaskModel.findOne({ _id: id, studentEmail: studentEmail.toLowerCase() });
      return task ? task.toJSON() : null;
    }

    if (activeAdapter === 'postgresql') {
      const result = await pgPool.query('SELECT * FROM tasks WHERE id = $1 AND studentEmail = $2', [id, studentEmail.toLowerCase()]);
      return result.rows[0] || null;
    }

    if (activeAdapter === 'mysql') {
      const [rows] = await mysqlConnection.execute('SELECT * FROM tasks WHERE id = ? AND studentEmail = ?', [id, studentEmail.toLowerCase()]);
      return rows[0] || null;
    }

    return memoryDb.getById(id, studentEmail);
  },

  async create(data, studentEmail) {
    if (activeAdapter === 'mongodb') {
      const task = new MongoTaskModel({
        studentEmail: studentEmail.toLowerCase(),
        title: data.title,
        description: data.description || '',
        status: data.status || 'Pending'
      });
      await task.save();
      return task.toJSON();
    }

    if (activeAdapter === 'postgresql') {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      const status = data.status || 'Pending';
      const desc = data.description || '';
      const query = `
        INSERT INTO tasks (id, studentEmail, title, description, status, createdAt, updatedAt)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *;
      `;
      const result = await pgPool.query(query, [id, studentEmail.toLowerCase(), data.title, desc, status]);
      return result.rows[0];
    }

    if (activeAdapter === 'mysql') {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      const status = data.status || 'Pending';
      const desc = data.description || '';
      await mysqlConnection.execute(
        'INSERT INTO tasks (id, studentEmail, title, description, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [id, studentEmail.toLowerCase(), data.title, desc, status]
      );
      const [rows] = await mysqlConnection.execute('SELECT * FROM tasks WHERE id = ?', [id]);
      return rows[0];
    }

    return memoryDb.create(data, studentEmail);
  },

  async update(id, data, studentEmail) {
    if (activeAdapter === 'mongodb') {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const updateData = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;

      const task = await MongoTaskModel.findOneAndUpdate(
        { _id: id, studentEmail: studentEmail.toLowerCase() },
        updateData,
        { new: true }
      );
      return task ? task.toJSON() : null;
    }

    if (activeAdapter === 'postgresql') {
      const existing = await this.getById(id, studentEmail);
      if (!existing) return null;

      const title = data.title !== undefined ? data.title : existing.title;
      const desc = data.description !== undefined ? data.description : existing.description;
      const status = data.status !== undefined ? data.status : existing.status;

      const query = `
        UPDATE tasks 
        SET title = $1, description = $2, status = $3, updatedAt = NOW()
        WHERE id = $4 AND studentEmail = $5
        RETURNING *;
      `;
      const result = await pgPool.query(query, [title, desc, status, id, studentEmail.toLowerCase()]);
      return result.rows[0];
    }

    if (activeAdapter === 'mysql') {
      const existing = await this.getById(id, studentEmail);
      if (!existing) return null;

      const title = data.title !== undefined ? data.title : existing.title;
      const desc = data.description !== undefined ? data.description : existing.description;
      const status = data.status !== undefined ? data.status : existing.status;

      await mysqlConnection.execute(
        'UPDATE tasks SET title = ?, description = ?, status = ?, updatedAt = NOW() WHERE id = ? AND studentEmail = ?',
        [title, desc, status, id, studentEmail.toLowerCase()]
      );
      const [rows] = await mysqlConnection.execute('SELECT * FROM tasks WHERE id = ?', [id]);
      return rows[0];
    }

    return memoryDb.update(id, data, studentEmail);
  },

  async delete(id, studentEmail) {
    if (activeAdapter === 'mongodb') {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const result = await MongoTaskModel.findOneAndDelete({ _id: id, studentEmail: studentEmail.toLowerCase() });
      return !!result;
    }

    if (activeAdapter === 'postgresql') {
      const result = await pgPool.query('DELETE FROM tasks WHERE id = $1 AND studentEmail = $2', [id, studentEmail.toLowerCase()]);
      return (result.rowCount || 0) > 0;
    }

    if (activeAdapter === 'mysql') {
      const [result] = await mysqlConnection.execute('DELETE FROM tasks WHERE id = ? AND studentEmail = ?', [id, studentEmail.toLowerCase()]);
      return result.affectedRows > 0;
    }

    return memoryDb.delete(id, studentEmail);
  },

  async getStats(studentEmail) {
    if (activeAdapter === 'mongodb') {
      const allTasks = await MongoTaskModel.find({ studentEmail: studentEmail.toLowerCase() });
      const stats = { total: allTasks.length, pending: 0, inProgress: 0, completed: 0 };
      allTasks.forEach(t => {
        if (t.status === 'Pending') stats.pending++;
        else if (t.status === 'In Progress') stats.inProgress++;
        else if (t.status === 'Completed') stats.completed++;
      });
      return stats;
    }

    if (activeAdapter === 'postgresql') {
      const result = await pgPool.query('SELECT status, COUNT(*) FROM tasks WHERE studentEmail = $1 GROUP BY status', [studentEmail.toLowerCase()]);
      const stats = { total: 0, pending: 0, inProgress: 0, completed: 0 };
      result.rows.forEach(row => {
        const count = parseInt(row.count, 10);
        stats.total += count;
        if (row.status === 'Pending') stats.pending = count;
        else if (row.status === 'In Progress') stats.inProgress = count;
        else if (row.status === 'Completed') stats.completed = count;
      });
      return stats;
    }

    if (activeAdapter === 'mysql') {
      const [rows] = await mysqlConnection.execute(
        'SELECT status, COUNT(*) as count FROM tasks WHERE studentEmail = ? GROUP BY status',
        [studentEmail.toLowerCase()]
      );
      const stats = { total: 0, pending: 0, inProgress: 0, completed: 0 };
      rows.forEach(row => {
        const count = parseInt(row.count, 10);
        stats.total += count;
        if (row.status === 'Pending') stats.pending = count;
        else if (row.status === 'In Progress') stats.inProgress = count;
        else if (row.status === 'Completed') stats.completed = count;
      });
      return stats;
    }

    return memoryDb.getStats(studentEmail);
  }
};

module.exports = dbRouter;
