import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

//initializing variables for env var check
const reqEnvVars = ["DB_HOST","DB_USER","DB_PASSWORD","DB_NAME"]
//look through the required env vars and find if any are missing in your .env
const missingVars = reqEnvVars.filter((varName) => !process.env[varName]);

//reports if any .env variables are missing and exits
if (missingVars.length > 0){
  console.error(`Missing the following required .env variable(s): ${missingVars.join(", ")}`);
  process.exit(1);
};

//actual connection piece, breaking into parts so @ works properly
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized:true
  }
});

//testing connection
try{
  await pool.query("SELECT 1");
  console.log("Successfully connected to Library Database");
} catch(err){
    console.log("Connection failed with message:", err.message);
    process.exit(1);
};