const express = require('express')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const braintree = require('braintree')
const cors = require('cors')


const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cors());

app.listen(3001, (req, res)=>{
    console.log("Server is running at port 3001");
})

const db = mysql.createPool({
    host: 'localhost',
    user: "root",
    password: "password",
    database: "unikartdatabase"
})

app.get('/',(req,res)=>{
    const selectQuery = "SELECT * from userregistration"
    db.query(selectQuery,(err, result)=>{
        if(err) {console.log(err)};
        res.send(result)
    })
})

app.get('/user/:id', (req, res) => {
    const userId = 1;
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

app.post('/user/add', (req, res) => {
    const { first_name, last_name, phone_number, email, address, MembershipTypeID } = req.body;
    const insertQuery = "INSERT INTO userregistration (first_name, last_name, phone_number, email, address, MembershipTypeID) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(insertQuery, [first_name, last_name, phone_number, email, address, MembershipTypeID], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Failed to add user");
        } else {
            res.status(201).send("User added successfully");
        }
    });
});

app.put('/user/update/:id', (req, res) => {
    const userId = req.params.id;
    const { first_name, last_name, phone_number, email, address, membership, start_date, end_date } = req.body;
    const updateQuery = "UPDATE userregistration SET first_name=?, last_name=?, phone_number=?, email=?, address=?, membership=?, start_date=?, end_date=? WHERE user_id=?";
    db.query(updateQuery, [first_name, last_name, phone_number, email, address, membership, start_date, end_date, userId], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).send("Failed to update user information");
        } else {
            res.status(200).send("User information updated successfully");
        }
    });
});

app.delete('/user/delete/:id', (req, res) => {
    const userId = req.params.id;
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
// Route to get user's basket with product prices
router.get('/api/user-basket/:user_id', (req, res) => {
    const userId = req.params.user_id;

    // Query to find users basket
    const selectQuery = `
        SELECT b.basket_id, b.user_id, b.created_at,
               bi.basket_item_id, bi.store_product_id, bi.quantity,
               sp.price AS product_price
        FROM basket b
        LEFT JOIN basketitems bi ON b.basket_id = bi.basket_id
        LEFT JOIN storeproducts sp ON bi.store_product_id = sp.store_product_id
        WHERE b.user_id = ?
    `;

    // Prepare response 
    db.query(selectQuery, [userId], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(result);
        }
    });
});
    
    // Route to get all store addresses
app.get('/api/store-addresses', (req, res) => {
    const selectQuery = 'SELECT * FROM store_addresses';
    
    db.query(selectQuery, (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(result);
        }
    });
});

// Endpoint to get price comparisons for a specific product
router.get('/api/price-comparison/:productId', (req, res) => {
    const productId = req.params.productId;

    // Query to fetch prices from storeproducts table for the given product
    const selectQuery = `
        SELECT s.store_name, sp.price
        FROM storeproducts sp
        JOIN stores s ON sp.store_id = s.store_id
        WHERE sp.product_id = ?;
    `;

    db.query(selectQuery, [productId], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            // Prepare response object
            const prices = result.map(row => ({
                store_name: row.store_name,
                price: row.price
            }));

            res.json(prices);
        }
    });
});
//  Grocery products by price range
router.get('/api/grocery-by-price/:minPrice/:maxPrice', (req, res) => {
    const minPrice = parseFloat(req.params.minPrice);
    const maxPrice = parseFloat(req.params.maxPrice);

    // Query to fetch grocery products within the specified price range
    const selectQuery = `
        SELECT p.product_name, p.description, p.category, sp.price
        FROM product p
        JOIN storeproducts sp ON p.product_id = sp.product_id
        WHERE sp.price BETWEEN ? AND ?;
    `;
    db.query(selectQuery, [minPrice, maxPrice], (err, result) => {
        if (err) {
            console.log(err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            // Prepare response object
            const groceryList = result.map(row => ({
                product_name: row.product_name,
                description: row.description,
                category: row.category,
                price: row.price
            }));

            res.json(groceryList);
        }
    });
});
});

//Add Products

app.post('/product/add', (req, res) => {
    const { product_name, description, category, quantity, best_before } = req.body;
    const insertQuery = "INSERT INTO Product (product_name, description, category, quantity, best_before) VALUES (?, ?, ?, ?, ?)";
    db.query(insertQuery, [product_name, description, category, quantity, best_before], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to add product");
        }
        res.status(201).send({message: "Product added successfully", productId: result.insertId});
    });
});

//update products

app.put('/product/update/:id', (req, res) => {
    const productId = req.params.id;
    const { product_name, description, category, quantity, best_before } = req.body;
    const updateQuery = "UPDATE Product SET product_name = ?, description = ?, category = ?, quantity = ?, best_before = ? WHERE product_id = ?";
    db.query(updateQuery, [product_name, description, category, quantity, best_before, productId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to update product");
        }
        res.status(200).send("Product updated successfully");
    });
});

//List Products
app.get('/products', (req, res) => {
    const selectQuery = "SELECT * FROM Product";
    db.query(selectQuery, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to retrieve products");
        }
        res.json(results);
    });
});

//Delete Product

app.delete('/product/delete/:id', (req, res) => {
    const productId = req.params.id;
    console.log(productId)
    const deleteQuery = "DELETE FROM Product WHERE product_id = ?";
    db.query(deleteQuery, [productId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to delete product");
        }
        res.status(200).send("Product deleted successfully");
    });
});

//Add products to store

app.post('/storeproduct/add', (req, res) => {
    const { product_id, store_id, price } = req.body;
    const insertQuery = "INSERT INTO StoreProducts (product_id, store_id, price) VALUES (?, ?, ?)";
    db.query(insertQuery, [product_id, store_id, price], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to add product to store");
        }
        res.status(201).send({message: "Product added to store successfully", storeProductId: result.insertId});
    });
});

//Update Product in Store

app.put('/storeproduct/update/:id', (req, res) => {
    const storeProductId = req.params.id;
    const { price } = req.body; // Assuming you might want to update the price
    const updateQuery = "UPDATE StoreProducts SET price = ? WHERE store_product_id = ?";
    db.query(updateQuery, [price, storeProductId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to update product in store");
        }
        res.status(200).send("Product in store updated successfully");
    });
});

//List Products in a Store

app.get('/storeproducts/:store_id', (req, res) => {
    const storeId = req.params.store_id;
    const selectQuery = "SELECT p.*, sp.price, sp.store_product_id FROM StoreProducts sp JOIN Product p ON sp.product_id = p.product_id WHERE sp.store_id = ?";
    db.query(selectQuery, [storeId], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to retrieve products for store");
        }
        res.json(results);
    });
});

//Delete Products from a Store

app.delete('/storeproduct/delete/:id', (req, res) => {
    const storeProductId = req.params.id;
    const deleteQuery = "DELETE FROM StoreProducts WHERE store_product_id = ?";
    db.query(deleteQuery, [storeProductId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to delete product from store");
        }
        res.status(200).send("Product removed from store successfully");
    });
});

// Filter Products

app.get('/products/category/:category', (req, res) => {
    const { category } = req.params;
    const selectQuery = "SELECT * FROM Product WHERE category = ?";
    db.query(selectQuery, [category], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Failed to filter products by category");
        }
        res.json(results);
    });
});

// Search Products Route
app.get('/products/search', (req, res) => {
    const { search } = req.query;

    // Check if the search parameter is missing or empty
    if (!search || search.trim() === '') {
        return res.status(400).json({ error: "Search parameter is missing or empty" });
    }

    const searchQuery = "SELECT * FROM Product WHERE LOWER(product_name) LIKE LOWER(?)";
    const sqlParams = [`%${search}%`];

    console.log("Query:", searchQuery);
    console.log("Parameters:", sqlParams);

    db.query(searchQuery, sqlParams, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to search for products" });
        }

        console.log("Results:", results);

        res.json(results);
    });
});

/* Sign up and sign in*/

// Sign Up Route
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = "INSERT INTO users (email, password) VALUES (?, ?)";
        db.query(insertQuery, [email, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Sign In Route

const crypto = require('crypto');

const secretKey = crypto.randomBytes(32).toString('hex');

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const selectQuery = "SELECT * FROM users WHERE email = ?";
        db.query(selectQuery, [email], async (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            if (result.length === 0) {
                return res.status(401).json({ error: 'Authentication failed. User not found.' });
            }
            const user = result[0];
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Authentication failed. Invalid password.' });
            }
            const token = jwt.sign({ userId: user.id, email: user.email }, secretKey, { expiresIn: '1h' });
            res.status(200).json({ token: token });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Protected Route Example
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Protected Route Accessed Successfully' });
});



function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.status(401).json({ error: 'Authentication failed. Token not provided.' });
    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).json({ error: 'Authentication failed. Invalid token.' });
        req.user = user;
        next();
    });
}

/*Payment  gateway integration*/


const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: 'rppzqr3dvsk2xbst',
    publicKey: 'xd9v7ggwgj862p6n',
    privateKey: 'd9c9af7064b85534a5d13e4ea349f38f'
});

// Endpoint to generate a client token for the Braintree client
app.get('/client_token', async (req, res) => {
    try {
        const response = await gateway.clientToken.generate({});
        res.send(response.clientToken);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to generate client token');
    }
});

// Endpoint to process a payment
app.post('/checkout', async (req, res) => {
    const { amount, payment_method_nonce } = req.body;

    try {
        const saleRequest = {
            amount: amount,
            paymentMethodNonce: payment_method_nonce,
            options: {
                submitForSettlement: true
            }
        };

        const result = await gateway.transaction.sale(saleRequest);

        if (result.success || result.transaction) {
            res.status(200).send("Payment successful");
        } else {
            res.status(400).send("Payment failed");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to process payment');
    }
});
