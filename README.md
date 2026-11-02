# Custom E-commerce Platform

A simple, ready-to-use, full-stack e-commerce web application built with React (JavaScript) and Vite.

This project is made for **students and startups** who need a working online store as a starting point. It is open source, so you can clone it, run it locally, and add your own features to your copy.

## Why This Project

- **Simple:** Clear structure that is easy to read and understand.
- **Full stack:** Frontend and backend included in one repository.
- **Ready to use:** Install, run, and start working in a few minutes.
- **Open source:** Free to use, modify, and extend for learning or for your own product.

## Tech Stack

- **Frontend:** React (JavaScript) + Vite
- **Backend:** Node.js + Express

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm (comes with Node.js)
- Git

## Getting Started

The frontend and backend run separately, so you need **two terminal tabs**.

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/custom-ecommerce-platform.git
cd custom-ecommerce-platform
```

### 2. Run the backend (Terminal 1)

```bash
cd backend
npm install
npm run dev
```

### 3. Run the frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Each folder has its own `package.json`, so `npm install` must be run in **both** `frontend` and `backend`.

Once both are running, open the local URL shown in the frontend terminal (Vite usually uses `http://localhost:5173`).

## Customizing Your Copy

1. Fork or clone the repository.
2. Create a new branch for your changes.
3. Add or modify features in your local copy (products, payments, authentication, admin tools, etc.).
4. Test both frontend and backend before deploying.

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a pull request.

## License

This project is open source. Add your license here (for example, MIT) and include a `LICENSE` file in the repository.