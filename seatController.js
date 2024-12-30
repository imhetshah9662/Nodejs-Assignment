const { pool } = require("./models/db");

//for seat management

//available seats api
exports.getAvailableSeats = async (req, res) => {
  try {
    const result = await pool.request()
      .query("SELECT * FROM Seats WHERE IsBooked = 0 ORDER BY RowNumber, SeatNumber");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Error fetching available seats." });
  }
};

//reserveseat api
exports.reserveSeats = async (req, res) => {
  const { seatCount } = req.body;
  const userId = req.user.id;
  if (seatCount < 1 || seatCount > 7) {
    return res.status(400).json({ error: "You can book between 1 and 7 seats." });
  }
  try {
    const result = await pool.request()
      .query("SELECT * FROM Seats WHERE IsBooked = 0 ORDER BY RowNumber, SeatNumber");

    const availableSeats = result.recordset;
    if (availableSeats.length < seatCount) {
      return res.status(400).json({ error: "Not enough seats available." });
    }

    let reservedSeats = availableSeats.slice(0, seatCount);
    for (const seat of reservedSeats) {
      await pool.request()
        .input("SeatID", seat.SeatID)
        .input("BookedBy", userId)
        .query("UPDATE Seats SET IsBooked = 1, BookedBy = @BookedBy WHERE SeatID = @SeatID");
    }

    res.json({ message: "Seats reserved successfully!", reservedSeats });
  } catch (err) {
    res.status(500).json({ error: "Error reserving seats." });
  }
};

//cancel reservation api
exports.cancelReservation = async (req, res) => {
  const { seatIds } = req.body;
  const userId = req.user.id;
  try {
    for (const seatId of seatIds) {
      await pool.request()
        .input("SeatID", seatId)
        .input("UserID", userId)
        .query("UPDATE Seats SET IsBooked = 0, BookedBy = NULL WHERE SeatID = @SeatID AND BookedBy = @UserID");
    }
    res.json({ message: "Reservation cancelled successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Error cancelling reservation." });
  }
};
