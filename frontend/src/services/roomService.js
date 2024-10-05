// src/services/roomService.js

export const fetchRooms = async () => {
  const token = localStorage.getItem("token"); // Get JWT token

  if (!token) {
    // Redirect user to login page
    window.location.href = "/login"; // Redirect to login if no token
  }

  const response = await fetch("http://localhost:5000/api/rooms", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`, // Include JWT token in header
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rooms");
  }

  return await response.json(); // Return room data
};
