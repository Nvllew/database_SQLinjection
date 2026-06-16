import express from "express";
import cors from "cors";
import helmet from "helmet";

import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import proveedorRoutes from './routes/proveedor.routes.js';
import ventaRoutes from './routes/ventas.routes.js';
import clienteRoutes from './routes/customers.routes.js';
import evaluacionesRoutes from "./routes/evaluations.routes.js";
import { generalLimiter } from './middlewares/rateLimit.middleware.js';
import { verifyToken } from './middlewares/auth.middleware.js';

import { preventGuestWrites } from './middlewares/role.middleware.js';

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173", 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600
};
app.use(cors(corsOptions));

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
  },
}));
app.use(express.json({ limit: '10kb' }));

app.use(generalLimiter);

app.get("/", (req, res) => {
  res.status(200).json({ status: "API funcionando 🚀" });
});

app.use('/auth', authRoutes);

app.use('/clientes', verifyToken, preventGuestWrites, clienteRoutes);
app.use('/ventas', verifyToken, preventGuestWrites, ventaRoutes);
app.use('/proveedores', verifyToken, preventGuestWrites, proveedorRoutes);
app.use("/products", verifyToken, preventGuestWrites, productRoutes);
app.use("/evaluaciones", evaluacionesRoutes);

app.use(errorHandler);

export default app;
