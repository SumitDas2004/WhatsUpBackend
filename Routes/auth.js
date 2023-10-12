const express = require("express");
const app = express.Router();
const User = require("../Modules/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authenticate = require("../middleWare/authentication");
const { check, validationResult } = require("express-validator");

const salt = bcrypt.genSaltSync(10);

app.get("/isloggedin", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.id);
    return res
      .status(200)
      .json({
        email: user.email,
        username: user.username,
        picture: user.picture,
        notification: user.notifications.length,
        friendRequest: user.friendRequests.length,
        description: user.description,
      });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

app.post(
  "/signup",
  [
    check("email", "Invalid email format.").isEmail(),
    check("password", "Invalid password format.Password must contain atleast one Uppercase letter, one lower case letter, one number and one special character. Password must contain atleast 8 characters.").isStrongPassword(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ message: errors.errors[0].msg });
      }
      const { username, password, email } = req.body;
      const find_user = await User.findOne({ email: email });
      if (find_user) {
        return res
          .status(409)
          .send({ message: "User with the same E-mail already exists" });
      }
      const hashedPassword = bcrypt.hashSync(password, salt);
      const user = await User.create({
        username: username,
        email: email,
        password: hashedPassword,
      });
      const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "240m",
      });
      res
        .status(200)
        .json({
          username: username,
          email: email,
          picture: user.picture,
          token: authToken,
          notification: user.notifications.length,
          friendRequest: user.friendRequests.length,
          description: user.description,
        });
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  }
);

app.post(
  "/login",
  [
    check("email", "Invalid email format.").isEmail(),
    check("password", "Invalid password format.").isStrongPassword(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ message: errors.errors[0].msg });
      }
      const { password, email, picture } = req.body;
      const user = await User.findOne({ email: email });
      if (!user) {
        return res
          .status(404)
          .send({ message: "Email does not exist. Signup first." });
      }
      if (!bcrypt.compareSync(password, user.password))
        return res
          .status(404)
          .send({ message: "Your email or Password doesn't match" });
      const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
        expiresIn: "240m",
      });
      res
        .status(200)
        .json({
          email: user.email,
          username: user.username,
          picture: picture,
          token: authToken,
          notification: user.notifications.length,
          friendRequest: user.friendRequests.length,
          description: user.description,
        });
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  }
);

app.post("/googlesignup", async (req, res) => {
  try {
    const { username, email, picture } = req.body;
    const find_user = await User.findOne({ email: email });
    if (find_user) {
      return res
        .status(409)
        .send({ message: "User with the same E-mail already exists" });
    }
    const user = await User.create({
      username: username,
      email: email,
      picture: picture,
    });
    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "240m",
    });
    res
      .status(200)
      .json({
        username: username,
        email: email,
        picture: picture,
        token: authToken,
        notification: user.notifications.length,
        friendRequest: user.friendRequests.length,
        description: user.description,
      });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

app.post("/googlelogin", async (req, res) => {
  try {
    const { picture, email } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(404)
        .send({ message: "Email does not exist. Signup first." });
    }
    const authToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "240m",
    });
    return res
      .status(200)
      .json({
        email: user.email,
        username: user.username,
        picture: user.picture,
        token: authToken,
        notification: user.notifications.length,
        friendRequest: user.friendRequests.length,
        description: user.description,
      });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

app.post("/uploaddp", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.id);
    if (!user) {
      res.status(500).json("User authentication failed. Login again.");
      return;
    }
    user.picture = req.body.file;
    await user.save();
    res
      .status(200)
      .json({
        message: "Profile picture updated. Reload the page to view changes.",
      });
  } catch (e) {
    res.status(500).json({ message: "Somtehing went wrong :(" });
  }
});

app.put("/updateusername", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.id);
    if (!user) {
      res.status(401).json("User authentication failed. Login again.");
      return;
    }
    const existing = await User.findOne({ username: req.body.username });
    if (existing) {
      res.status(409).send({ message: "User name not available." });
      return;
    }
    user.username = req.body.username;
    await user.save();
    res.status(200).send({ message: "Username updated successfully" });
  } catch (e) {
    res.status(500).json({ message: "Somtehing went wrong :(" });
  }
});

app.put("/updatedescription", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.id);
    if (!user) {
      res.status(401).json("User authentication failed. Login again.");
      return;
    }
    user.description = req.body.description;
    await user.save();
    res.status(200).send({ message: "Description changed successfully" });
  } catch (e) {
    res.status(500).json({ message: "Somtehing went wrong :(" });
  }
});

module.exports = app;
