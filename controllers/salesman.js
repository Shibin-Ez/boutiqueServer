import pool from '../models/pool.js';

// CREATE
export const createSalesman = async (req, res) => {
  try {
    const { name, email, phone, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }

    // Optional: validate email format if email is provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const [result] = await pool.query(
      `INSERT INTO Salesman (name, email, phone, code) VALUES (?, ?, ?, ?)`,
      [name, email, phone, code]
    );
    const salesmanId = result.insertId;

    res.status(201).json({
      message: 'Salesman created successfully',
      salesman: {
        id: salesmanId,
        name,
        email,
        phone,
        code,
      },
    });
  } catch (err) {
    console.log(err);

    // Handling Duplicate Entry Error
    if (err.code === 'ER_DUP_ENTRY') {
      // The error message typically looks like: "Duplicate entry 'XYZ' for key 'Salesman.code'"
      if (err.message.includes("'code'")) {
        return res.status(400).json({ message: 'Salesman code already exists' });
      } else if (err.message.includes("'email'")) {
        return res.status(400).json({ message: 'Salesman email already exists' });
      } 
      // fallback
      return res.status(400).json({ message: 'Duplicate entry detected' });
    }
    

    res.status(500).send({ message: err.message });
  }
}

// READ
export const getSalesmen = async (req, res) => {
  try {
    const [salesmen] = await pool.query(
      `
      SELECT 
      `
    );
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
}

export const getSalesman = async (req, res) => {
  try {
    const userId = req.params.userId;

    const [salesman] = await pool.query(
      `SELECT u.*, s.* FROM User u
      LEFT JOIN Salesman s ON u.id = s.userId
      WHERE u.id = ?`,
      [userId]
    );

    if (salesman.length === 0) {
      return res.status(404).json({ message: 'Salesman not found' });
    }

    res.status(200).json(salesman[0]);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
}