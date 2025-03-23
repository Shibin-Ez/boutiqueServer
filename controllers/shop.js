import pool from "../config/pool.js";

// CREATE
export const createShop = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);
    console.log(req.body);

    // // authorize
    // const [shops] = await pool.query(`SELECT * FROM Shop WHERE userId = ?`, [
    //   userId,
    // ]);

    // if (shops.length) {
    //   return res.status(400).json({ message: "User already has a shop" });
    // }

    const { name, type, address, whatsapp_no, latitude, longitude } = req.body;

    console.log(req.file);
    const profilePicURL = req.file ? req.file.filename : null;

    const [rows] = await pool.query(
      `INSERT INTO Shop (name, type, profilePicURL, userId, address, whatsapp_no, location) 
      VALUES (?, ?, ?, ?, ?, ?, ST_GeomFromText(?))`,
      [
        name,
        type,
        profilePicURL,
        userId,
        address,
        whatsapp_no,
        `POINT(${longitude} ${latitude})`,
      ]
    );

    res.status(201).json({
      id: rows.insertId,
      message: "shop created successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// READ
export const getShops = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Shop");
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

export const getShopDetails = async (req, res) => {
  try {
    const shopId = req.params.id;

    const [shops] = await pool.query(`SELECT * FROM Shop WHERE id = ?`, [
      shopId,
    ]);

    const [postsResponse] = await pool.query(
      `SELECT COUNT(*) AS totalPosts FROM Post WHERE shopId = ?`,
      [shopId]
    );

    const [followersResponse] = await pool.query(
      `SELECT COUNT(*) AS totalFollowers FROM Follow WHERE shopId = ?`,
      [shopId]
    );

    const updatedShop = {
      ...shops[0],
      profilePicURL: `${process.env.SERVER_URL}/public/assets/shops/${shops[0].profilePicURL}`,
      postsCount: postsResponse[0].totalPosts,
      followersCount: followersResponse[0].totalFollowers,
    };

    res.status(200).json(updatedShop);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const getShopsNearby = async (req, res) => {
  try {
    const { lat: latitude, lng: longitude } = req.query;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const [shops] = await pool.query(
      `SELECT *, 
      ST_Distance_Sphere(location, POINT(?, ?)) AS distance 
      FROM Shop 
      ORDER BY distance ASC`,
      [longitude, latitude] // MySQL uses (longitude, latitude) in POINT()
    );

    const [updatedShops] = shops.map((shop) => {
      return {
        ...shop,
        profilePicURL: `${process.env.SERVER_URL}/public/assets/posts/${shop.profilePicURL}`,
      };
    });

    res.status(200).json(shops);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};
