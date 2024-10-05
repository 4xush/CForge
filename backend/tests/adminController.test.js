const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server"); // Your Express app
const Room = require("../models/Room");
const User = require("../models/User");

let user;
let admin;
let room;
console.log("Mongo URI Test:", process.env.MONGO_URI_TEST);

beforeAll(async () => {
  const url = "mongodb://127.0.0.1/testdb"; // Ensure this is your test DB URL
  await mongoose.connect(url);

  // Create test users and room
  user = await User.create({
    username: "testuser",
    email: "testuser@example.com",
    password: "password",
  });
  admin = await User.create({
    username: "adminuser",
    email: "adminuser@example.com",
    password: "password",
  });
  room = await Room.create({
    roomId: "room1",
    name: "Test Room",
    admins: [admin._id],
    members: [user._id],
    joinRequests: [{ _id: new mongoose.Types.ObjectId(), user: user._id }],
    maxMembers: 10,
    isPublic: true,
  });
});

afterAll(async () => {
  // Disconnect from MongoDB and clean up
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("Admin Room Controller", () => {
  // Helper function to get the auth token
  const getAuthToken = () => `Bearer ${admin._id}`;

  it("should approve a join request", async () => {
    const requestId = room.joinRequests[0]._id;
    const res = await request(app)
      .post(`/rooms/${room.roomId}/approve-join-request/${requestId}`)
      .set("Authorization", getAuthToken());

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Join request approved successfully");
    const updatedRoom = await Room.findOne({ roomId: room.roomId });
    expect(updatedRoom.members).toContain(user._id);
  });

  it("should decline a join request", async () => {
    const requestId = room.joinRequests[0]._id;
    const res = await request(app)
      .post(`/rooms/${room.roomId}/decline-join-request/${requestId}`)
      .set("Authorization", getAuthToken());

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Join request declined successfully");
    const updatedRoom = await Room.findOne({ roomId: room.roomId });
    expect(updatedRoom.joinRequests).not.toContainEqual(
      expect.objectContaining({ _id: requestId })
    );
  });

  it("should update room details", async () => {
    const res = await request(app)
      .put(`/rooms/${room.roomId}/update`)
      .set("Authorization", getAuthToken())
      .send({
        name: "Updated Room Name",
        description: "Updated Description",
        isPublic: false,
        maxMembers: 20,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Room updated successfully");
    const updatedRoom = await Room.findOne({ roomId: room.roomId });
    expect(updatedRoom.name).toBe("Updated Room Name");
    expect(updatedRoom.description).toBe("Updated Description");
    expect(updatedRoom.isPublic).toBe(false);
    expect(updatedRoom.maxMembers).toBe(20);
  });

  it("should add an admin", async () => {
    const res = await request(app)
      .post(`/rooms/${room.roomId}/add-admin`)
      .set("Authorization", getAuthToken())
      .send({ userId: user._id });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Admin added successfully");
    const updatedRoom = await Room.findOne({ roomId: room.roomId });
    expect(updatedRoom.admins).toContain(user._id);
  });

  it("should remove an admin", async () => {
    const res = await request(app)
      .post(`/rooms/${room.roomId}/remove-admin`)
      .set("Authorization", getAuthToken())
      .send({ userId: admin._id });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Admin removed successfully");
    const updatedRoom = await Room.findOne({ roomId: room.roomId });
    expect(updatedRoom.admins).not.toContain(admin._id);
  });
});
