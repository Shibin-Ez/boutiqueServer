import pool from "../config/pool.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT COUNT(*) AS totalUsers FROM User`
    );

    const [shops] = await pool.query(
      `SELECT COUNT(*) AS totalShops FROM Shop`
    );

    const [posts] = await pool.query(
      `SELECT COUNT(*) AS totalPosts FROM Post`
    );

    res.status(200).json({
      totalUsers: users[0].totalUsers,
      totalShops: shops[0].totalShops,
      totalPosts: posts[0].totalPosts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
}