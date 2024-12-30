document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const bookingSection = document.getElementById("booking-section");
    const authSection = document.getElementById("auth-section");
  
    const seatsDiv = document.getElementById("seats");
    const seatCountInput = document.getElementById("seat-count");
    const reserveBtn = document.getElementById("reserve-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const seatIdsInput = document.getElementById("seat-ids");
  
    const API_URL = "http://localhost:3000";
  
    let token = null;
  
    // Handle login form submission
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (data.token) {
          token = data.token;
          authSection.style.display = "none";
          bookingSection.style.display = "block";
          fetchSeats();
        }
      } catch (error) {
        alert("Login failed");
      }
    });
  
    // Handle signup form submission
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("new-username").value;
      const password = document.getElementById("new-password").value;
      try {
        await fetch(`${API_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        alert("Signup successful! Please login.");
      } catch (error) {
        alert("Signup failed");
      }
    });
  
    // Fetch available seats from backend
    async function fetchSeats() {
      const res = await fetch(`${API_URL}/seats/available`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const seats = await res.json();
      seatsDiv.innerHTML = "";
      seats.forEach((seat) => {
        const seatDiv = document.createElement("div");
        seatDiv.className = `seat ${seat.IsBooked ? "booked" : ""}`;
        seatDiv.textContent = seat.SeatNumber;
        seatsDiv.appendChild(seatDiv);
      });
    }
  
    // Handle seat reservation
    reserveBtn.addEventListener("click", async () => {
      const seatCount = seatCountInput.value;
      try {
        await fetch(`${API_URL}/seats/reserve`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ seatCount }),
        });
        alert("Seats reserved successfully!");
        fetchSeats();
      } catch (error) {
        alert("Reservation failed");
      }
    });
  
    // Handle seat reservation cancellation
    cancelBtn.addEventListener("click", async () => {
      const seatIds = seatIdsInput.value.split(",").map((id) => id.trim());
      try {
        await fetch(`${API_URL}/seats/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ seatIds }),
        });
        alert("Reservation cancelled successfully!");
        fetchSeats();
      } catch (error) {
        alert("Cancellation failed");
      }
    });
  });
  