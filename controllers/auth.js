import pool from "../config/pool.js";
import jwt from "jsonwebtoken";

// SOCIAL LOGIN
export const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log(req.body);
    if (!idToken) return res.status(400).json({ error: "Token is required" });

    const googleResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!googleResponse.ok) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const { email, name, picture: profilePicURL } = await googleResponse.json();
    console.log(email, name);

    let [users] = await pool.query(`SELECT * FROM User WHERE email = ?`, [
      email,
    ]);

    if (users.length) {
      // User exists
      console.log("User exists");

      // check if he is a seller
      const [shops] = await pool.query(`SELECT * FROM Shop WHERE userId = ?`, [
        users[0].id,
      ]);

      if (shops.length) {
        users[0].shopId = shops[0].id;
      } else {
        users[0].shopId = -1;
      }
    } else {
      // Create user
      const [result] = await pool.query(
        `INSERT INTO User (name, email, profilePicURL) VALUES (?, ?, ?)`,
        [name, email, profilePicURL]
      );

      users = [{ id: result.insertId, email, name, shopId: -1, profilePicURL }];
    }

    // Generate JWT token
    const token = jwt.sign({ id: users[0].id, email }, process.env.JWT_SECRET);

    console.log(token);

    res
      .status(200)
      .json({
        token,
        userId: users[0].id,
        shopId: users[0].shopId,
        name,
        email,
        profilePicURL: users[0].profilePicURL,
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Authentication failed" });
  }
};
