import express from "express";

const router = express.Router();

const shortURL = (req, res) => {
  try {
    // get the request URL
    const url = req.params[0];
    console.log(url);

    // example incoming url: "https://shop.pmkinventories.tech/share/post/:id"
    // here, url will be "post/:id"

    res.redirect(`botiq://shop.app/${url}`);
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
};

router.get("/*", shortURL);

export default router;