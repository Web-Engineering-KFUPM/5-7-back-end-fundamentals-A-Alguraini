[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/dPJyHr9V)
# Lab: Full-Stack Web Developement Fundamentals (Node.js + React)

# Note
Follow the App.jsx file to run the code.

## Overview of the Lab

In this lab, you will learn the fundamentals of how data flows
between the back-end (server) and the front-end (client). The back-end
will be built using Node.js + Express and the front-end using React +
Vite. You will be able to make a request from the front-end and
receive data from the back-end.

------------------------------------------------------------------------

## Reading Assignment

### 6.1 Full-stack development (Node)

https://learn.zybooks.com/zybook/SWE363Fall2025/chapter/6/section/1

------------------------------------------------------------------------

## Fundamentals of Full-Stack Development

### Overview of front-end and back-end development

-   **Front-end (client-side)**: code that runs in the browser (React)
-   **Back-end (server-side)**: code that runs on the server (Node.js +
    Express)

### What is Node.js?

Node is JavaScript runtime environment. It allows us to run JavaScript
outside the browser. This makes it possible to write back-end logic
using JavaScript.

### How does Node help back-end development?

-   It handles server requests
-   It can read/write files
-   It can respond with data to the browser

### What is Express?

Express is a minimal framework built on top of Node.js. It makes it
easier to create routes, handle requests and send responses.

### Why use Express in the back-end?

-   Simple to create APIs
-   Handles JSON easily
-   Less code than raw Node

### What is a Request and Response?

-   **Request:** when the front-end (browser) asks the server for some
    information. Example: "give me all students"
-   **Response:** when the server sends back the answer. Example: server
    responds with JSON data: `[ {id:1, name:'Ali'} ]`

### How to Create Routes in Express?

A route is a path on server that handles requests. Example routes:

``` js
app.get('/students', (req, res) => {
  res.json(students);
});
```

-   `GET` → request data
-   `POST` → send data to server

### How to Test Back-End URL to See JSON Output?

1)  First run server:

``` bash
node server.js
```

2)  Open browser and type URL:

```{=html}
<!-- -->
```
    http://localhost:3000/api/students

If everything is correct, you will see JSON data directly in browser.

------------------------------------------------------------------------

### Flow of data from back-end to front-end

1.  Front-end sends request →
    `fetch("http://localhost:3000/api/students")`
2.  Back-end receives request and processes it
3.  Back-end sends JSON response → `res.json(data)`
4.  Front-end receives response and displays it

------------------------------------------------------------------------

## Checklist before submitting the lab

-   [ ] Does the server run without errors?
-   [ ] Does the client run without errors?
-   [ ] Did you test hitting the API in the browser and see JSON?
-   [ ] Did you test fetching data from React?
-   [ ] Did you understand the flow of request → response?
-   [ ] Can you explain what is back-end and what is front-end?
-   [ ] Can you explain what is request and what is response?

------------------------------------------------------------------------
