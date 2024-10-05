const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server"); // Adjust the path to your app
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Connect to MongoDB before running tests
beforeAll(async () => {
  const url = "mongodb://127.0.0.1/testdb"; // Ensure this is your test DB URL
  await mongoose.connect(url);
});

// Disconnect from MongoDB after tests
afterAll(async () => {
  await mongoose.connection.close(); // This will disconnect the database
});

describe("User Controller Tests", () => {
  let userId;
  let authToken;

  beforeEach(async () => {
    // Drop the users collection to ensure no duplicate keys
    await mongoose.connection.collection("users").deleteMany({});

    const hashedPassword = await bcrypt.hash("password123", 10);

    const user = await User.create({
      username: "testuser",
      email: "testuser@example.com",
      password: hashedPassword, // Store hashed password
    });

    userId = user._id;

    // Simulate login to get a token
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: "testuser@example.com", password: "password123" });
    authToken = response.body.token; // Assuming the token is returned in the response
  });

  // Test getUserDetails
  it("should fetch user details", async () => {
    const response = await request(app)
      .get("/api/users/detail")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("username", "testuser");
    expect(response.body).toHaveProperty("email", "testuser@example.com");
    expect(response.body).not.toHaveProperty("password");
  });

  // Test deleteUserAccount
  it("should delete user account", async () => {
    const response = await request(app)
      .delete("/api/users/delete")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      "User account deleted successfully"
    );

    // Verify user is deleted
    const user = await User.findById(userId);
    expect(user).toBeNull();
  });

  // Test getAllUsers
  it("should fetch all users", async () => {
    const response = await request(app)
      .get("/api/users/admin/getAll")
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body[0]).toHaveProperty("username", "testuser");
    expect(response.body[0]).toHaveProperty("email", "testuser@example.com");
    expect(response.body[0]).not.toHaveProperty("password");
  });
});
