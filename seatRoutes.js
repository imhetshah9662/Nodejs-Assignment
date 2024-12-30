import express from 'express';
import { getAvailableSeats, reserveSeats, cancelReservation } from '../models/queries.js';

const router = express.Router();

// Get available seats
router.get('/available', async (req, res) => {
  try {
    const seats = await getAvailableSeats();
    res.status(200).json(seats);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching available seats', error: err.message });
  }
});

// Reserve seats
router.post('/reserve', async (req, res) => {
  const { seatCount } = req.body;
  const userId = req.user.userId;

  try {
    const seatIds = await reserveSeats(userId, seatCount);
    res.status(200).json({ message: 'Seats reserved successfully', seatIds });
  } catch (err) {
    res.status(500).json({ message: 'Error reserving seats', error: err.message });
  }
});

// Cancel reservation
router.post('/cancel', async (req, res) => {
  const { seatIds } = req.body;
  const userId = req.user.userId;

  try {
    await cancelReservation(userId, seatIds);
    res.status(200).json({ message: 'Reservation cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error canceling reservation', error: err.message });
  }
});

export default router;
