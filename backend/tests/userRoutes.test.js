const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const app = require("../server"); // Ensure server.js exports the app

// Connect to MongoDB before running tests
beforeAll(async () => {
  const url = `mongodb://127.0.0.1/testdb`; // Ensure this is your test DB URL
  await mongoose.connect(url);
  // Drop the database
  await mongoose.connection.db.dropDatabase();
});

// Disconnect from MongoDB after tests
afterAll(async () => {
  await mongoose.connection.close(); // This will disconnect the database
});

let authToken;
let testUser;

// Helper function to create a user and get an auth token
const createUserAndGetToken = async () => {
  testUser = new User({
    username: "testuser",
    email: "testuser@example.com",
    password: await bcrypt.hash("testpassword", 10),
  });
  await testUser.save();

  const response = await request(app)
    .post("/api/users/login")
    .send({ email: "testuser@example.com", password: "testpassword" });
  return response.body.token;
};

describe("User Routes Test", () => {
  beforeAll(async () => {
    authToken = await createUserAndGetToken();
  });

  // Test user login
  it("should login user and return token", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ email: "testuser@example.com", password: "testpassword" });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  // Test fetching user details
  it("should get user details", async () => {
    const response = await request(app)
      .get("/api/users/detail")
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.email).toBe("testuser@example.com");
  });

  // Test updating username
  it("should update username", async () => {
    const response = await request(app)
      .put("/api/users/update-username")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ username: "updatedusername" });
    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe("updatedusername");
  });

  // Test updating email
  it("should update email", async () => {
    const response = await request(app)
      .put("/api/users/update-email")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ email: "updatedemail@example.com" });
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("updatedemail@example.com");
  });

  // Test updating profile picture
  it("should update profile picture", async () => {
    const response = await request(app)
      .put("/api/users/update-avtar")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        profilePicture:
          "https://cdn.pixabay.com/photo/2016/10/10/14/46/icon-1728549_960_720.jpg",
      });
    expect(response.status).toBe(200);
    expect(response.body.user.profilePicture).toBe(
      "https://cdn.pixabay.com/photo/2016/10/10/14/46/icon-1728549_960_720.jpg"
    );
  });

  // Test user deletion
  it("should delete user account", async () => {
    const response = await request(app)
      .delete("/api/users")
      .set("Authorization", `Bearer ${authToken}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User account deleted successfully");
  });
});
