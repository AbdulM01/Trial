const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cors());


//Admin

app.post('/product/add', (req, res) => {
    const { product_name, description, category, quantity, best_before, image_url, store_id } = req.body;

    // Insert into Product table
    const insertProductQuery = "INSERT INTO Product (product_name, description, category, quantity, best_before, image_url) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(insertProductQuery, [product_name, description, category, quantity, best_before, image_url], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to add product");
        }

        const productId = result.insertId;

        // Insert into StoreProducts table
        const insertStoreProductQuery = "INSERT INTO StoreProducts (product_id, store_id, price) VALUES (?, ?, ?)";
        db.query(insertStoreProductQuery, [productId, store_id, 0], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Failed to add product to store");
            }

            res.status(201).send({ message: "Product added successfully", productId });
        });
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

//Managing Products
app.get('/products', (req, res) => {
    let { page, pageSize, category } = req.query;
    page = page || 1;
    pageSize = pageSize || 10;
    let query = "SELECT * FROM Product";
    let queryParams = [];

    if (category) {
        query += " WHERE category = ?";
        queryParams.push(category);
    }

    query += " LIMIT ? OFFSET ?";
    const offset = (page - 1) * pageSize;
    queryParams.push(parseInt(pageSize), offset);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Failed to retrieve products");
        }
        res.json(results);
    });
});

// View orders

app.get('/orders', (req, res) => {
    const { page, pageSize } = req.query;
    const limit = parseInt(pageSize) || 10;
    const offset = ((parseInt(page) || 1) - 1) * limit;

    const query = "SELECT * FROM orders LIMIT ? OFFSET ?";
    db.query(query, [limit, offset], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to retrieve orders");
        }
        res.json(results);
    });
});

// Edit customer details

app.put('/customer/update/:id', (req, res) => {
    const customerId = req.params.id;
    const { name, email, address } = req.body;
    const query = "UPDATE userregistration SET name = ?, email = ?, address = ? WHERE user_id = ?";
    db.query(query, [name, email, address, customerId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to update customer information");
        }
        res.send("Customer information updated successfully");
    });
});
//Update Inventory 

app.put('/inventory/update/:productId', (req, res) => {
    const productId = req.params.productId;
    const { stock } = req.body; // This is the new stock level
    const query = "UPDATE Product SET quantity = ? WHERE product_id = ?";
    db.query(query, [stock, productId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to update inventory");
        }
        res.send("Inventory updated successfully");
    });
});

//Process Orders

app.put('/orders/process/:id', (req, res) => {
    const orderId = req.params.id;
    const query = "UPDATE orders SET order_status = 'Processed' WHERE order_id = ?";
    db.query(query, [orderId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Failed to process order");
        }
        res.send("Order processed successfully");
    });
});

// Get price from store products
app.get('/product/price/:productId/:storeId', (req, res) => {
    const { productId, storeId } = req.params;
  
    const query = `
      SELECT p.product_name, sp.price
      FROM StoreProducts sp
      JOIN Product p ON sp.product_id = p.product_id
      WHERE sp.product_id = ? AND sp.store_id = ?;
    `;
  
    db.query(query, [productId, storeId], (err, result) => {
      if (err) {
        console.error('Failed to retrieve product price:', err);
        return res.status(500).send('Failed to retrieve product price');
      }
  
      if (result.length === 0) {
        return res.status(404).send('Product or store not found');
      }
  
      res.json(result[0]);
    });
  });