const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");
const routes = require("./routes");
const path = require('path');

require("./config/db")(); // connect DB

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
const publicDir = path.join(__dirname, 'public');
const invoicesDir = path.join(__dirname, 'invoices');
app.use('/invoices', express.static(invoicesDir, { maxAge: '1h' }));
app.use('/public', express.static(publicDir, { maxAge: '1h' }));

app.use("/api", routes);

module.exports = app;
