const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");
const app = require("../server"); // Import the app from your server.js

jest.mock("axios");

describe("Auth Controller", () => {
  beforeAll(async () => {
    const url = "mongodb://127.0.0.1/testdb"; // Ensure this is your test DB URL
  await mongoose.connect(url);
  });

  afterEach(async () => {
    // Clear the database after each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect from the test database
    await mongoose.disconnect();
  });

  describe("POST /api/users/register", () => {
    it("should register a new user successfully", async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          data: {
            matchedUser: { username: "leetcodeUser" },
          },
        },
      });

      const response = await request(app).post("/api/users/register").send({
        username: "testuser",
        email: "testuser@example.com",
        password: "password123",
        leetcodeUsername: "leetcodeUser",
      });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe("User registered successfully");

      const user = await User.findOne({ email: "testuser@example.com" });
      expect(user).not.toBeNull();
      expect(user.username).toBe("testuser");
      expect(user.platforms.leetcode.username).toBe("leetcodeUser");
      expect(await bcrypt.compare("password123", user.password)).toBe(true);
    });

    it("should return error if email is already registered", async () => {
      await User.create({
        username: "existinguser",
        email: "existing@example.com",
        password: "password123",
      });

      const response = await request(app).post("/api/users/register").send({
        username: "newuser",
        email: "existing@example.com",
        password: "password123",
        leetcodeUsername: "leetcodeUser",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Email is already registered");
    });

    it("should return error if LeetCode username is already registered", async () => {
      await User.create({
        username: "existinguser",
        email: "existing@example.com",
        password: "password123",
        platforms: {
          leetcode: {
            username: "leetcodeUser",
          },
        },
      });

      const response = await request(app).post("/api/users/register").send({
        username: "newuser",
        email: "newuser@example.com",
        password: "password123",
        leetcodeUsername: "leetcodeUser",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'LeetCode username "leetcodeUser" is already registered with another email. Please use a different LeetCode username.'
      );
    });

    it("should return error if LeetCode username is not found", async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          data: {
            matchedUser: null,
          },
        },
      });

      const response = await request(app).post("/api/users/register").send({
        username: "newuser",
        email: "newuser@example.com",
        password: "password123",
        leetcodeUsername: "nonexistentUser",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("LeetCode username not found");
    });
  });

  describe("POST /api/users/login", () => {
    it("should login user with correct credentials", async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      const user = await User.create({
        username: "testuser",
        email: "testuser@example.com",
        password: hashedPassword,
      });

      const response = await request(app).post("/api/users/login").send({
        email: "testuser@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("User logged in successfully");

      const decodedToken = jwt.verify(
        response.body.token,
        process.env.JWT_SECRET
      );
      expect(decodedToken.id).toBe(user._id.toString());
    });

    it("should return error if user is not found", async () => {
      const response = await request(app).post("/api/users/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    it("should return error if password is incorrect", async () => {
      await User.create({
        username: "testuser",
        email: "testuser@example.com",
        password: await bcrypt.hash("password123", 10),
      });

      const response = await request(app).post("/api/users/login").send({
        email: "testuser@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Invalid credentials");
    });
  });
});
