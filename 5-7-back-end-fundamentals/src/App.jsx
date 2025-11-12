/*
===================================================================
Back-end Lab — Node & Express
===================================================================

===================================================================
LAB SETUP INSTRUCTIONS
===================================================================

1. Navigate to the project directory:
   Open your terminal and run:
      cd 5-7-back-end-fundamentals

2. Install project dependencies:
   Run either of these commands:
      npm install
      npm install express cors

3. Start the front server server from 5-7-back-end-fundamentals-Dromarjh-main\5-7-back-end-fundamentals path:
   Run:
      npm run dev

4. Start the back-end server from a separate terminal, path: 5-7-back-end-fundamentals-Dromarjh-main\5-7-back-end-fundamentals\backend:
   Run:
      node server.js

  If your system blocks running npm commands (especially on Windows PowerShell),
   run this command first to allow script execution:
      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

============================== 
DATA FLOW UNDERSTANDING NOTES
==============================

FILE: backend/server.js
-----------------------------------------------------
Inside this file, we created routes such as:

app.get('/api/students', (req, res) => {
  res.json(students);
});

This means:
1) A browser or front-end can send a REQUEST to URL:
   http://localhost:3000/api/students

2) Express (Node) will catch that REQUEST
3) Express will send a RESPONSE using res.json(students)

So JSON travels "out" from back-end → to front-end.
We don’t render HTML here, only send JSON.

------------------------------------------------------

FILE: src/App.jsx  (Front-end React)
-------------------------------------------
Inside useEffect(), we wrote:

fetch("http://localhost:3000/api/students")
  .then((r) => r.json())
  .then((data) => setStudents(data))

This means:
1) React sends HTTP REQUEST to back-end route "/api/students"
2) Back-end responds with JSON array
3) That JSON is stored into React state: setStudents(data)
4) The UI renders the students in <li> elements.

Therefore:
Front-end → REQUEST --> Back-End
Back-End → RESPONSE (JSON) --> Front-End
Front-end → RENDERS the received JSON into the screen.

------------------------------------------------------

POST example:

When user types a student name and clicks Add button,
we run:

fetch(API, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name })
})

Meaning:
Front-end SENDS DATA to the server → back-end route that does POST
Server RECEIVES the JSON, adds new user into memory,
then sends back the updated new student object as JSON.

Front-end then updates state setStudents() and UI updates.

------------------------------------------------------

SUMMARY OF FLOW

React sends REQUEST  ---------->  Express server
React receives JSON RESPONSE <--  Express server

Front-end ALWAYS controls the UI.
Back-end ONLY supplies the data.

*/
import { useEffect, useState } from 'react';
import './index.css';

const API = 'http://localhost:3000/api/students';

export default function App() {
  const [students, setStudents] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // GET: request data from the server
  useEffect(() => {
    setLoading(true);
    fetch(API)
      .then((r) => r.json())
      .then((data) => setStudents(data))
      .finally(() => setLoading(false));
  }, []);

  // POST: send data to the server
  const addStudent = async (e) => {
    e.preventDefault();
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      const created = await res.json();
      setStudents((prev) => [created, ...prev]);
      setName('');
    } else {
      alert('Failed to add student');
    }
  };

  return (
    <main>
      <h1>Class Roster</h1>

      <form onSubmit={addStudent}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Student name"
          style={{ padding: '0.5rem', flex: 1 }}
        />
        <button type="submit" >Add</button>
      </form>

      {loading && <p>Loading…</p>}

      <ul>
        {students.map((s) => (
          <li key={s.id} >{s.name}</li>
        ))}
      </ul>
    </main>
  );
}

