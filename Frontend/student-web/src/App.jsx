import { BrowserRouter } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import AppRoutes from "./routes/AppRoutes";
function App() {
  return <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>;
}
export default App;
