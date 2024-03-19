import bcrypt from 'bcrypt';
import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';

const router = express.Router();

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract the token from the 'Authorization' header
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    try {
      const decoded = jwt.verify(token, secretKey); // Verify and decode the token
      req.user = decoded; // Attach the decoded user information to the request object
      next(); // Proceed to the next middleware or route handler
    } catch (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
  };
  

router.get('/',(req,res)=>{
    const selectQuery = "SELECT * from userregistration"
    db.query(selectQuery,(err, result)=>{
        if(err) {console.log(err)};
        res.send(result)
    })
})

router.get('/user/:id', authMiddleware,(req, res) => {
    const userId = req.params.id;
    const tokenUserId = req.user.userId; // Assuming userId is stored in the token payload
    if (userId !== tokenUserId) {
        return res.status(403).json({ error: 'You are not authorized to update this user' });
      }
    
    const selectQuery = "SELECT * FROM userregistration WHERE user_id = ?";
    db.query(selectQuery, [userId], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Internal Server Error");
        } else {
            res.send(result);
        }
    });
});



router.post('/user/add', async (req, res) => {
    const { first_name, last_name, phone_number, email, address, MembershipTypeID, password } = req.body;
    
    try {
        // Generate a salt to use for hashing
        const salt = await bcrypt.genSalt(10);
        // Hash the password using the salt
        const hashedPassword = await bcrypt.hash(password, salt);

        const insertQuery = "INSERT INTO userregistration (first_name, last_name, phone_number, email, address, MembershipTypeID, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(insertQuery, [first_name, last_name, phone_number, email, address, MembershipTypeID, hashedPassword], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send("Failed to add user");
            } else {
                res.status(201).send("User added successfully");
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Failed to add user");
    }
});


router.put('/user/update/:id', async (req, res) => {
    const userId = req.params.id;
  const tokenUserId = req.user.userId; // Assuming userId is stored in the token payload

  // Check if the user ID from the token matches the user ID from the request parameters
  if (userId !== tokenUserId) {
    return res.status(403).json({ error: 'You are not authorized to access this user' });
  }

    const { first_name, last_name, phone_number, email, address, membership, start_date, end_date, password } = req.body;

    try {
        let hashedPassword = password; // Initialize hashedPassword with the password from request

        // Check if password is provided and hash it
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        const updateQuery = `
            UPDATE userregistration 
            SET first_name=?, last_name=?, phone_number=?, email=?, address=?, MembershipTypeID=?, start_date=?, end_date=?, password=?
            WHERE user_id=?
        `;
        db.query(updateQuery, [first_name, last_name, phone_number, email, address, membership, start_date, end_date, hashedPassword, userId], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send("Failed to update user information");
            } else {
                res.status(200).send("User information updated successfully");
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Failed to update user information");
    }
});
router.delete('/user/delete/:id', (req, res) => {
    const userId = req.params.id;
  const tokenUserId = req.user.userId; // Assuming userId is stored in the token payload

  // Check if the user ID from the token matches the user ID from the request parameters
  if (userId !== tokenUserId) {
    return res.status(403).json({ error: 'You are not authorized to access this user' });
  }

    const deleteQuery = "DELETE FROM userregistration WHERE user_id=?";
    db.query(deleteQuery, [userId], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Failed to delete user");
        } else {
            res.status(200).send("User deleted successfully");
        }
    });
});


// Sign In Route


router.post('/user/signin', (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find the user by email
      const findUserQuery = 'SELECT * FROM userregistration WHERE email = ?';
      const secretKey = crypto.randomBytes(32).toString('hex');
      db.query(findUserQuery, [email], (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal server error');
          return;
        }
  
        if (result.length === 0) {
          res.status(401).send('Invalid email or password');
          return;
        }
  
        const user = result[0];
        console.log(user);
        // Compare the provided password with the stored hashed password
        const validPassword = bcrypt.compare(password, user.password);
        if (!validPassword) {
          res.status(401).send('Invalid email or password');
          return;
        }
  
        const token = jwt.sign({ userId: user.user_id, email: user.email }, secretKey, { expiresIn: '1h' });
        res.status(200).json({ token: token, userId : user.user_id, fName : user.first_name, lName : user.last_name,});
        //res.status(200).send('Sign-in successful');
      });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal server error');
    }
  });


  router.put('/user/change-password/:id', async (req, res) => {
    const userId = req.params.id;
  const tokenUserId = req.user.userId; // Assuming userId is stored in the token payload

  // Check if the user ID from the token matches the user ID from the request parameters
  if (userId !== tokenUserId) {
    return res.status(403).json({ error: 'You are not authorized to access this user' });
  }

    const { oldPassword, newPassword } = req.body;

    // Extract user ID from token or session (assuming you're using JWT)
    //const tokenUserId = req.user.userId; // Assuming userId is stored in the token payload

    // Check if the user ID from the token matches the user ID from the request parameters
    if (userId !== tokenUserId) {
        return res.status(403).json({ error: "You are not authorized to change this user's password" });
    }

    try {
        // Check if oldPassword matches the current password in the database
        const user = await getUserById(userId); // Function to retrieve user details from the database
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid old password' });
        }

        // Generate a salt and hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password in the database
        const updateQuery = `
            UPDATE userregistration 
            SET password=?
            WHERE user_id=?
        `;
        db.query(updateQuery, [hashedPassword, userId], (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send("Failed to update password");
            } else {
                res.status(200).send("Password updated successfully");
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Failed to update password");
    }
});



export default router;