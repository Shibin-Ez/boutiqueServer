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

    const {
      name,
      type,
      address,
      whatsapp_no,
      latitude,
      longitude,
      salesmanCode,
    } = req.body;

    console.log(req.file);
    const profilePicURL = req.file ? req.file.filename : null;

    let salesman = null;

    if (salesmanCode) {
      const [salesmen] = await pool.query(
        `SELECT * FROM Salesman WHERE code = ?`,
        [salesmanCode]
      );

      if (!salesmen.length) {
        return res.status(400).json({ message: "Invalid salesman code" });
      }

      salesman = salesmen[0];
    }

    const [rows] = await pool.query(
      `INSERT INTO Shop (name, type, profilePicURL, userId, address, whatsapp_no, location, salesmanId) 
      VALUES (?, ?, ?, ?, ?, ?, ST_GeomFromText(?), ?)`,
      [
        name,
        type,
        profilePicURL,
        userId,
        address,
        whatsapp_no,
        `POINT(${longitude} ${latitude})`,
        salesman ? salesman.id : null,
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
    const userId = req.query.userId;

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

    const [ratingObjList] = await pool.query(
      `
      SELECT AVG(c.rating) AS avgRating
      FROM Comment c
      LEFT JOIN Post p ON c.postId = p.id
      WHERE p.shopId = ?`,
      [shopId]
    );

    const shopRating = ratingObjList[0].avgRating
      ? ratingObjList[0].avgRating
      : 0;

    let isFollowing = false;

    if (userId && userId != -1) {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS count FROM Follow WHERE userId = ? AND shopId = ?`,
        [userId, shopId]
      );

      if (rows[0].count > 0) isFollowing = true;
    }

    const updatedShop = {
      ...shops[0],
      profilePicURL: `${process.env.SERVER_URL}/public/assets/shops/${shops[0].profilePicURL}`,
      postsCount: postsResponse[0].totalPosts,
      followersCount: followersResponse[0].totalFollowers,
      rating: parseFloat(shopRating),
      isFollowing,
    };

    res.status(200).json(updatedShop);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

export const getShopDetailsFromUserId = async (userId) => {
  try {
    const [shops] = await pool.query(`SELECT * FROM Shop WHERE userId = ?`, [
      userId,
    ]);

    if (!shops.length) {
      return;
    }

    const updatedShop = {
      ...shops[0],
      profilePicURL: `${process.env.SERVER_URL}/public/assets/shops/${shops[0].profilePicURL}`,
    };

    return updatedShop;
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

    const updatedShops = shops.map((shop) => {
      return {
        ...shop,
        profilePicURL: `${process.env.SERVER_URL}/public/assets/shops/${shop.profilePicURL}`,
      };
    });

    res.status(200).json(updatedShops);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};
