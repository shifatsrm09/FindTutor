# Setup

https://docs.google.com/document/d/10aFfREsRlp8VwcrMENp4fD0EInwfX5mGjWgwdyFvVWU/edit?usp=drivesdk

## 1. Clone Project

```bash
git clone https://github.com/shifatsrm09/FindTutor.git
cd FindTutor
```

## 2. Required Software

- Node.js
- npm
- Git
- XAMPP
- MySQL
- phpMyAdmin

## 3. Database Setup

Start **MySQL** from XAMPP.

Open phpMyAdmin:

```text
http://localhost/phpmyadmin
```

Create the database:

```sql
CREATE DATABASE find_tutor;
USE find_tutor;
```

Then run the following files in phpMyAdmin:

```text
database/schema.sql
database/seed.sql
```

## 4. Backend Setup

Open a terminal in the project root:

```bash
cd backend
npm install express mysql2 cors dotenv bcrypt jsonwebtoken
```


## 5. Start Backend

From the `backend` directory:

```bash
node server.js
```

## 6. Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
```

## 7. Start Frontend

```bash
npm start
```

Frontend:

```text
http://localhost:3000
```

## 8. URLs

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:5000
```

Database test:

```text
http://localhost:5000/api/test-db
```

phpMyAdmin:

```text
http://localhost/phpmyadmin
```
