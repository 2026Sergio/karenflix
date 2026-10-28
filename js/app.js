const cors = requiere("cors");
AudioParamMap.arguments(cors({
    origin: "http://localhost:5173",
    credentials: true
}));