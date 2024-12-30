import sql from 'mssql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import msnodesqlv8 from 'msnodesqlv8';
import dotenv from 'dotenv';

dotenv.config();
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  'server': process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    trustedConnection : true,
    encrypt : true,
    trustServerCertificate : true,
    //encrypt: true, // for Azure SQL
    //trustServerCertificate: true, // change to false in production
  },
  driver : process.env.DB_DRIVER
};

// var config = {
//     server : process.env.DB_SERVER,
//     user : process.env.DB_USER,
//     password : process.env.DB_PASSWORD,
//     database : process.env.DB_DATABASE,
//     options : {
//         trustedConnection : true,
//         encrypt : true,
//         trustServerCertificate : true,
//         //MultipleActiveResultSets : true
//     },
//     driver : process.env.DB_DRIVER
// }


const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect();

pool.on('error', (err) => {
  console.error('SQL Pool Error', err);
});

async function getAvailableSeats() {
  try {
    const result = await pool.request().query('SELECT Id, SeatNumber, IsBooked FROM Seats WHERE IsBooked = 0');
    return result.recordset;
  } catch (err) {
    console.error('Error fetching available seats', err);
    throw err;
  }
}

async function getAllSeats() {
  try {
    const result = await pool.request().query('SELECT Id, SeatNumber, IsBooked, BookedByUserId FROM Seats');
    return result.recordset;
  } catch (err) {
    console.error('Error fetching all seats', err);
    throw err;
  }
}

async function reserveSeats(userId, seatCount) {
  try {
    const availableSeats = await getAvailableSeats();

    if (availableSeats.length < seatCount) {
      throw new Error('Not enough available seats');
    }

    const seatIds = availableSeats.slice(0, seatCount).map(seat => seat.Id);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    for (let seatId of seatIds) {
      await transaction.request()
        .input('userId', sql.Int, userId)
        .input('seatId', sql.Int, seatId)
        .query('UPDATE Seats SET IsBooked = 1, BookedByUserId = @userId WHERE Id = @seatId');
    }

    await transaction.commit();
    return seatIds;
  } catch (err) {
    console.error('Error reserving seats', err);
    throw err;
  }
}

async function cancelReservation(userId, seatIds) {
  try {
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    for (let seatId of seatIds) {
      await transaction.request()
        .input('userId', sql.Int, userId)
        .input('seatId', sql.Int, seatId)
        .query('UPDATE Seats SET IsBooked = 0, BookedByUserId = NULL WHERE Id = @seatId AND BookedByUserId = @userId');
    }

    await transaction.commit();
    return seatIds;
  } catch (err) {
    console.error('Error canceling reservation', err);
    throw err;
  }
}

async function registerUser(username, password) {
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, hash)
      .query('INSERT INTO Users (Username, PasswordHash) VALUES (@username, @password)');
    return result.recordset;
  } catch (err) {
    console.error('Error registering user', err);
    throw err;
  }
}

async function loginUser(username, password) {
  try {
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT Id, Username, PasswordHash FROM Users WHERE Username = @username');
    const user = result.recordset[0];
    if (!user) {
      throw new Error('User not found');
    }

    const match = await bcrypt.compare(password, user.PasswordHash);
    if (!match) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign({ userId: user.Id, username: user.Username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return { token };
  } catch (err) {
    console.error('Error logging in user', err);
    throw err;
  }
}

export { getAvailableSeats, getAllSeats, reserveSeats, cancelReservation, registerUser, loginUser };
