const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server"); // Your Express app
const Room = require("../models/Room");
const User = require("../models/User");

let user;
let room;
let authToken;

beforeAll(async () => {
  // Connect to the test database
  const url = "mongodb://127.0.0.1/testdb"; // Ensure this is your test DB URL
  await mongoose.connect(url);

  // Create test user and room
  user = await User.create({
    username: "testuser",
    email: "testuser@example.com",
    password: "password",
  });

  room = await Room.create({
    roomId: "room1",
    name: "Test Room",
    creator: user._id,
    isPublic: true,
    maxMembers: 10,
    admins: [user._id],
    members: [user._id],
  });

  // Generate auth token (replace with your actual token generation logic)
  authToken = `Bearer ${user._id}`;
});

afterAll(async () => {
  // Disconnect from MongoDB and clean up
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("Room Routes", () => {
  it("should get all rooms for the user", async () => {
    const res = await request(app)
      .get("/rooms")
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.rooms).toBeDefined();
    expect(res.body.rooms.length).toBeGreaterThan(0);
  });

  it("should create a new room", async () => {
    const res = await request(app)
      .post("/rooms")
      .set("Authorization", authToken)
      .send({
        name: "New Room",
        description: "Room description",
        isPublic: true,
        maxMembers: 20,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Room created successfully");
    expect(res.body.room.name).toBe("New Room");
  });

  it("should search public rooms", async () => {
    const res = await request(app)
      .get("/rooms/search")
      .query({ search: "Test", page: 1, limit: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body.rooms).toBeDefined();
    expect(res.body.rooms.length).toBeGreaterThan(0);
  });

  it("should get room details", async () => {
    const res = await request(app)
      .get(`/rooms/${room.roomId}`)
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.roomId).toBe(room.roomId);
    expect(res.body.name).toBe("Test Room");
  });

  it("should delete a room", async () => {
    const res = await request(app)
      .delete(`/rooms/${room.roomId}`)
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Room deleted successfully");
  });

  it("should get the leaderboard for a room", async () => {
    const res = await request(app)
      .get(`/rooms/${room.roomId}/leaderboard`)
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.leaderboardData).toBeDefined();
    expect(res.body.currentPage).toBe(1);
  });

  it("should send a join request", async () => {
    const res = await request(app)
      .post(`/rooms/${room.roomId}/join`)
      .set("Authorization", authToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("You have joined the room successfully");
  });
});
