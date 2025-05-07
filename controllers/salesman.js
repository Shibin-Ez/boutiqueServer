import pool from "../config/pool.js";

// CREATE
export const createSalesman = async (req, res) => {
  try {
    const { name, email, phone_no, code } = req.body;

    if (req.user.userId != "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // change to to upper case
    const upperCode = code && code.toUpperCase();

    if (!name || !upperCode) {
      return res.status(400).json({ message: "Name and code are required" });
    }

    // Optional: validate email format if email is provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const [result] = await pool.query(
      `INSERT INTO Salesman (name, email, phone_no, code) VALUES (?, ?, ?, ?)`,
      [name, email, phone_no, upperCode]
    );
    const salesmanId = result.insertId;

    res.status(201).json({
      message: "Salesman created successfully",
      salesman: {
        id: salesmanId,
        name,
        email,
        phone: phone_no,
        code: upperCode,
      },
    });
  } catch (err) {
    console.log(err);

    // Handling Duplicate Entry Error
    if (err.code === "ER_DUP_ENTRY") {
      // The error message typically looks like: "Duplicate entry 'XYZ' for key 'Salesman.code'"
      if (err.message.includes("'code'")) {
        return res
          .status(400)
          .json({ message: "Salesman code already exists" });
      } else if (err.message.includes("'email'")) {
        return res
          .status(400)
          .json({ message: "Salesman email already exists" });
      }
      // fallback
      return res.status(400).json({ message: "Duplicate entry detected" });
    }

    res.status(500).send({ message: err.message });
  }
};

// READ
export const getSalesmen = async (req, res) => {
  try {

    if (req.user.userId != "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const [salesmen] = await pool.query(`
      SELECT sa.*, sa.phone_no AS phone, sa.code AS salesmanCode, COUNT(sh.id) AS shopsCreated 
      FROM Salesman sa
      LEFT JOIN Shop sh ON sa.id = sh.salesmanId
      GROUP BY sa.id`);

    res.status(200).json(salesmen);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
};

export const getSalesman = async (req, res) => {
  try {
    const salesmanId = req.params.id;

    const [salesmen] = await pool.query(
      `SELECT * FROM Salesman WHERE id = ?`,
      [salesmanId]
    );

    if (salesmen.length === 0) {
      return res.status(404).json({ message: "Salesman not found" });
    }

    // find shops created by this salesman
    const [shops] = await pool.query(
      `SELECT s.*, COUNT(p.shopId) AS totalPosts FROM Shop s
      LEFT JOIN Post p ON s.id = p.shopId
      WHERE s.salesmanId = ?
      GROUP BY s.id`,
      [salesmanId]
    );

    const salesman = {
      ...salesmen[0],
      phone: salesmen[0].phone_no,
      salesmanCode: salesmen[0].code,
      createdShops: shops,
    }

    res.status(200).json(salesman);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
};
