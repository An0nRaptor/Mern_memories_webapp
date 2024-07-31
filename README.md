<h1>Introduction</h1>
<span>The Memories WebApp is a full-stack application built using the MERN stack. It allows users to create, view, update, and delete memories. Each memory contains a title, content, author, and a date. Users can also add tags to their memories for better categorization.</span>
<br/>

<h2>Features</h2>
<ul>
  <li>User Authentication (Register, Login, Logout)
  <li>Create, Read, Update, Delete (CRUD) Memories</li>
  <li>Add Tags to Memories</li>
  <li>Responsive Design for Mobile and Desktop</li>
</ul>

<h2>Technologies Used</h2>
<li><strong>Frontend</strong>: React, Redux, Material-UI</li>
<li><strong>Backend</strong>: Node.js, Express</li>
<li><strong>Database</strong>: MongoDB</li>
<li><strong>Authentication</strong>: JWT (JSON Web Tokens) </li>
<li><strong>Styling</strong>: CSS, Material-UI</li>

<h2>Usage</h2>
<li><strong>Register an Account:</strong></li>
<li><strong>Login: </strong>Use your credentials to log in.</li>
<li><strong>Create a Memory: </strong>Add a new memory by providing a title, content, and tags.</li>
<li><strong>View Memories: </strong>Browse through your memories.</li>
<li><strong>Update Memory: </strong> Edit the content of an existing memory.</li>
<li><strong>Delete Memory: </strong>Remove a memory from your collection.</li>
<li><strong>Search Memories: </strong>Use the search bar to find memories by title or tags.</li>


<h2>API Endpoints</h2>
<h3>Auth</h3>
<li>POST /api/auth/register: Register a new user</li>
<li>POST /api/auth/login: Login a user</li>

<h3>Memories</h3>
<li>GET /api/memories: Get all memories</li>
<li>GET /api/memories/</li>
: Get a single memory by ID
<li>POST /api/memories: Create a new memory</li>
<li>PUT /api/memories/</li>
: Update a memory by ID
<li>DELETE /api/memories/</li>
: Delete a memory by ID

