const mongoose = require("mongoose");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Connect to MongoDB before running tests
beforeAll(async () => {
  const url = "mongodb://127.0.0.1/testdb"; // Ensure this is your test DB URL
  await mongoose.connect(url);
});

// Disconnect from MongoDB after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe("User Model Test", () => {
  let testUser;

  // Create a new user
  it("should create a new user", async () => {
    testUser = new User({
      username: "testuser",
      email: "testuser@example.com",
      password: await bcrypt.hash("testpassword", 10),
      profilePicture: "http://example.com/pic.jpg",
    });
    const savedUser = await testUser.save();
    expect(savedUser._id).toBeDefined();
    expect(savedUser.email).toBe("testuser@example.com");
  });

  // Test email uniqueness
  it("should not allow duplicate email", async () => {
    const duplicateUser = new User({
      username: "anotheruser",
      email: "testuser@example.com",
      password: await bcrypt.hash("anotherpassword", 10),
    });
    await expect(duplicateUser.save()).rejects.toThrow();
  });

  // Test username uniqueness
  it("should create a user with unique username", async () => {
    const uniqueUser = new User({
      username: "uniqueuser",
      email: "uniqueuser@example.com",
      password: await bcrypt.hash("uniquepassword", 10),
    });
    const savedUser = await uniqueUser.save();
    expect(savedUser.username).toBe("uniqueuser");
  });

  // Test updating user email
  it("should update user email", async () => {
    const updatedUser = await User.findByIdAndUpdate(
      testUser._id,
      { email: "updatedemail@example.com" },
      { new: true }
    );
    expect(updatedUser.email).toBe("updatedemail@example.com");
  });
});
