import pool from "../config/pool.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { jwtVerify, importJWK } from 'jose';

// OTP REGISTER
export const otpRegister = async (req, res) => {
  try {
    const { accessToken, phone_no, name, password } = req.body;
    console.log(req.body);

    if (!accessToken)
      return res.status(400).json({ error: "Token is required" });

    const response = await fetch(
      "https://control.msg91.com/api/v5/widget/verifyAccessToken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          authkey: process.env.MSG91_AUTH_KEY,
          "access-token": accessToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.log("Invalid token");
      return res.status(400).json({ error: "Invalid token" });
    }

    // encrypt password
    const encryptedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO User (phone_no, name, passwordHash) VALUES (?, ?, ?)`,
      [phone_no, name, encryptedPassword]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, phone_no },
      process.env.JWT_SECRET
    );
    console.log(token);

    res.status(200).json({
      token,
      userId: result.insertId,
      shopId: -1,
      phone_no,
      name,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Authentication failed" });
  }
};

// PASSWORD LOGIN
export const passwordLogin = async (req, res) => {
  try {
    const { phone_no, password } = req.body;
    console.log(req.body);

    if (!phone_no || !password)
      return res
        .status(400)
        .json({ error: "Phone number and password are required" });

    const [users] = await pool.query(`SELECT * FROM User WHERE phone_no = ?`, [
      phone_no,
    ]);

    if (!users.length) {
      return res.status(400).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      users[0].passwordHash
    );

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // check if he is a seller
    const [shops] = await pool.query(`SELECT * FROM Shop WHERE userId = ?`, [
      users[0].id,
    ]);
    if (shops.length) {
      users[0].shopId = shops[0].id;
    } else {
      users[0].shopId = -1;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: users[0].id, phone_no },
      process.env.JWT_SECRET
    );
    console.log(token);

    res.status(200).json({
      token,
      userId: users[0].id,
      shopId: users[0].shopId,
      phone_no,
      profilePicURL: users[0].profilePicURL,
      name: users[0].name,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Authentication failed" });
  }
};

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

    res.status(200).json({
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

export const appleAuth = async (req, res) => {
  try {
    const { idToken, name } = req.body;
    console.log(req.body);
    if (!idToken) return res.status(400).json({ error: "Token is required" });

    // Verify token using Apple public keys
    const appleResponse = await fetch(`https://appleid.apple.com/auth/keys`);
    const { keys } = await appleResponse.json();

    const jwtHeader = JSON.parse(Buffer.from(idToken.split('.')[0], 'base64').toString());
    const key = keys.find(k => k.kid === jwtHeader.kid);

    if (!key) {
      return res.status(400).json({ error: "Invalid Apple token key ID" });
    }

    // Verify token using jose (you can use jose or apple-signin-auth or similar libs)
    const { jwtVerify } = await import('jose');
    const publicKey = await jwtVerify.importJWK({
      kty: key.kty,
      kid: key.kid,
      use: key.use,
      alg: key.alg,
      n: key.n,
      e: key.e,
    });

    const { payload } = await jwtVerify.jwtVerify(idToken, publicKey);

    const email = payload.email;
    const isEmailVerified = payload.email_verified === 'true';

    if (!isEmailVerified || !email) {
      return res.status(400).json({ error: "Email not verified or missing" });
    }

    let [users] = await pool.query(`SELECT * FROM User WHERE email = ?`, [
      email,
    ]);

    if (users.length) {
      console.log("User exists");

      const [shops] = await pool.query(`SELECT * FROM Shop WHERE userId = ?`, [
        users[0].id,
      ]);

      if (shops.length) {
        users[0].shopId = shops[0].id;
      } else {
        users[0].shopId = -1;
      }
    } else {
      // Apple doesn't always provide name; use placeholder if missing
      const finalName = name || "Apple User";

      const [result] = await pool.query(
        `INSERT INTO User (name, email, profilePicURL) VALUES (?, ?, ?)`,
        [finalName, email, null] // Apple doesn't provide profile picture
      );

      users = [{ id: result.insertId, email, name: finalName, shopId: -1, profilePicURL: null }];
    }

    const token = jwt.sign({ id: users[0].id, email }, process.env.JWT_SECRET);

    res.status(200).json({
      token,
      userId: users[0].id,
      shopId: users[0].shopId,
      name: users[0].name,
      email,
      profilePicURL: users[0].profilePicURL,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Authentication failed" });
  }
};


// ADMIN LOGIN
export const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password)
      return res.status(400).json({ error: "Password is required" });

    if (password !== process.env.ADMIN_PASSWORD)
      return res.status(400).json({ error: "Invalid password" });

    // Generate JWT token
    const token = jwt.sign({ id: "admin" }, process.env.JWT_SECRET);
    console.log(token);

    res.status(200).json({ token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Authentication failed" });
  }
};
