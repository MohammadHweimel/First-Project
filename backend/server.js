// Expense Tracker - backend (Express API + PostgreSQL)
//
// PHASE 1

const express = require ('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

app.get('/api/expenses', async (req, res) => {
    try{
        const query =`SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date FROM expenses ORDER BY id ASC`;

        const result = await pool.query(query);
        res.status(200).json(result.rows);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error:'Database query failed'});
    }
});

app.get('/api/expenses/:id', async (req, res) => {
    
    const {id} = req.params;

    if(isNaN(parseInt(id, 10))){
      return res.status(400).json({ error: 'Invalid expense ID. It must be an integer.'}) ; 
    }

    try{
        const query =`SELECT id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date FROM expenses WHERE id = $1`;

        const result = await pool.query(query, [id]);

        if(result.rows.length === 0){
            return res.status(404).json({ error:'Expense not found' }); 
        }

        res.status(200).json(result.rows[0]);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

const allowedCategories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Other'];

app.post('/api/expenses', async (req, res) => {

    const { title, amount, category, date } = req.body;

    if(!title || typeof title !== 'string' || title.trim() === ''){
        return res.status(400).json({ error: 'Title is required and cannot be empty'});
    }

    const numericAmount = parseFloat(amount);
    if(isNaN(numericAmount) || numericAmount <= 0){
        return res.status(400).json({ error: 'Amount must be a number greater than 0'});
    }

    if(!category || !allowedCategories.includes(category)){
        return res.status(400).json({ error: `Category must be one of: ${allowedCategories.join(', ')}`});
    }

    if(!date || isNaN(Date.parse(date))){
        return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required'})
    }

    try{
        const query = `INSERT INTO expenses (title, amount, category, date) VALUES ($1, $2, $3, $4) 
        RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date`;
        
        const values = [title.trim(), numericAmount, category, date];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    }catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database query failed'});
    }
});

app.put('/api/expenses/:id', async (req, res) => {

    const {id} = req.params;

    if(isNaN(parseInt(id,10))){
        return res.status(400).json({ error: 'Invalid expense ID. It must be an integer.'});
    }

    const { title, amount, category, date} = req.body;

    if(!title || typeof title !== 'string' || title.trim() ===''){
        return res.status(400).json({ error: 'Title is required and cannot be empty'});
    }

    const numericAmount = parseFloat(amount);
    if(isNaN(numericAmount) || numericAmount <=0){
        return res.status(400).json({ error: 'Amount must be a number greater than 0'});
    }

    if(!category || !allowedCategories.includes(category)) {
        return res.status(400).json({ error: `Category must be one of: ${allowedCategories.join(', ')}`});
    }   

    if (!date || isNaN(Date.parse(date))) {
        return res.status(400).json({ error: 'A valid date (YYYY-MM-DD) is required' });
    }

    try{
        const query = `UPDATE expenses SET title = $1, amount = $2, category = $3, date = $4 WHERE id = $5
        RETURNING id, title, amount::float8, category, to_char(date, 'YYYY-MM-DD') AS date`;

        const values = [title.trim(), numericAmount, category, date, id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database query failed' });
    }
});

app.delete('/api/expenses/:id', async (req, res) => {
    const {id} = req.params;

    if(isNaN(parseInt(id, 10))){
        return res.status(400).json({ error: 'Invalid expense ID. It must be an integer.'})
    }

    try{
        const query = `DELETE FROM expenses WHERE id = $1 RETURNING id`;
        const result = await pool.query(query, [id]);

        if(result.rows.length === 0){
            return res.status(404).json({ error: 'Expense not found'});
        }

        res.status(200).json({ message: 'Expense deleted successfully', id: result.rows[0].id});
    }catch ( error ){
        console.error(error);
        res.status(500).json({ error: 'Database query failed'}); 
    } 
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});