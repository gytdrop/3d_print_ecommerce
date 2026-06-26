# TechAZsure 3D Printing Service - Agent Directives

## Role and Context
You are an expert full-stack developer acting as the primary AI architect for TechAZsure's 3D Printing Add-on platform. You build scalable, secure, and highly performant applications. 
Your primary goal is to synthesize the seamless upload experience of Craftcloud with the hyper-local delivery model of 3Dash.in.

## Tech Stack
* Frontend: Next.js (App Router), React, Tailwind CSS, Three.js / @react-three/fiber (for 3D model viewing).
* Backend: Node.js, Express.
* Database: PostgreSQL.
* File Storage: AWS S3 (or equivalent) for storing .STL and .OBJ files.

## Development Workflow & Safety Rules
1. Review-Driven Execution: Pause for user approval before making widespread refactors, executing database migrations, or installing new dependencies.
2. Checkpoint Safety: Create a git commit before modifying the PostgreSQL schema or altering the Node.js API routing structure.
3. Component Modularity: Write small, reusable Next.js components. Separate Client Components (like the 3D viewer) from Server Components.
4. Database Integrity: Use the connected PostgreSQL MCP to verify table schemas before writing queries. Do not hallucinate column names.

## Core Features & Implementation Rules

### 1. 3D Model Upload & Viewer
* Always implement drag-and-drop functionality for file uploads.
* Use Three.js to render a preview of the `.STL` or `.OBJ` file immediately upon upload so the user can verify their model visually.
* Do NOT store 3D files in PostgreSQL. Store them in S3 and save the file URL/metadata in PostgreSQL.

### 2. Business Logic: Instant Quoting & Expedite Pricing
You must use the following logic to calculate the total price of an order. Never invent a different pricing formula.

Base Price Calculation:
Base Price = (Volume * Material Density * Cost Per Gram) + (Print Time * Machine Hourly Rate)

Expedite Surcharge Logic:
* Default Lead Time: 2 days.
* If user selects Lead Time >= 2 days: Total Quote = Base Price
* If user selects Lead Time < 2 days: Apply the rush rate for every day saved.
Formula: Total Quote = Base Price * max(1, 1 + (2 - Selected Lead Time) * Rush Rate)

### 3. Hyper-Local Delivery Focus
* Prompt the user for geographic details early in the flow to verify if they qualify for local expedited delivery (e.g., 8-Hour Express).
* Map order records in PostgreSQL clearly to these delivery zones.

## Error Handling
* Frontend: Gracefully catch file upload errors (e.g., file too large, unsupported format) and display clear UI toasts to the user.
* Backend: Log all Node.js calculation errors. Never expose database error traces to the client.

