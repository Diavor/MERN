import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Route,
  Redirect,
  Switch,
  useLocation,
} from "react-router-dom";
import Nav from "./brace/ui/Nav";
import Footer from "./brace/ui/Footer";
import CartDrawer from "./brace/ui/CartDrawer";
import FloatingCart from "./brace/ui/FloatingCart";
import { ToastProvider } from "./brace/ui/Toast";
import { CartUIProvider } from "./brace/ui/CartUI";
import HomeScreen from "./screens/HomeScreen";
import MenuScreen from "./screens/MenuScreen";
import StoryScreen from "./screens/StoryScreen";
import CartScreen from "./screens/CartScreen";
import ProductScreen from "./screens/ProductScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ProfileScreen from "./screens/ProfileScreen";
import OrderScreen from "./screens/OrderScreen";
import OrderListScreen from "./screens/OrderListScreen";
import UserListScreen from "./screens/UserListScreen";
import UserEditScreen from "./screens/UserEditScreen";
import ProductListScreen from "./screens/ProductListScreen";
import ProductEditScreen from "./screens/ProductEditScreen";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import AdminRoute from "./brace/admin/AdminRoute";

// The embeddable /order-pizza widget still uses react-bootstrap. It is lazily
// loaded so its bootstrap.min.css only enters that chunk, never the main bundle.
const PizzaOrderStandalone = lazy(() =>
  import("./screens/PizzaOrderStandalone")
);

const Chrome = () => {
  const { pathname } = useLocation();
  const bare = pathname.startsWith("/admin") || pathname.startsWith("/order-pizza");

  return (
    <>
      <Nav />
      <main>
        <Suspense fallback={null}>
        <Switch>
          <Route path="/login" component={LoginScreen} />
          <Route path="/register" component={RegisterScreen} />
          <Route path="/profile" component={ProfileScreen} />
          <Redirect exact from="/shipping" to="/checkout" />
          <Redirect exact from="/payment" to="/checkout" />
          <Redirect exact from="/placeorder" to="/checkout" />
          <Route path="/order/:id" component={OrderScreen} />
          <Route path="/product/:id" component={ProductScreen} />
          <Route path="/story" exact component={StoryScreen} />

          <Route
            path="/admin"
            exact
            render={(props) => <AdminRoute component={AdminDashboardScreen} {...props} />}
          />
          <Route
            path="/admin/orderlist"
            render={(props) => <AdminRoute component={OrderListScreen} {...props} />}
          />
          <Route
            path="/admin/productlist/:pageNumber"
            exact
            render={(props) => <AdminRoute component={ProductListScreen} {...props} />}
          />
          <Route
            path="/admin/productlist"
            exact
            render={(props) => <AdminRoute component={ProductListScreen} {...props} />}
          />
          <Route
            path="/admin/product/:id/edit"
            render={(props) => <AdminRoute component={ProductEditScreen} {...props} />}
          />
          <Route
            path="/admin/user/:id/edit"
            render={(props) => <AdminRoute component={UserEditScreen} {...props} />}
          />
          <Route
            path="/admin/userlist"
            render={(props) => <AdminRoute component={UserListScreen} {...props} />}
          />

          <Route path="/cart/:id?" component={CartScreen} />

          {/* Storefront catalog (BRÀCE) */}
          <Route
            path="/menu/search/:keyword/page/:pageNumber"
            exact
            component={MenuScreen}
          />
          <Route path="/menu/search/:keyword" exact component={MenuScreen} />
          <Route path="/menu/page/:pageNumber" exact component={MenuScreen} />
          <Route path="/menu" exact component={MenuScreen} />

          {/* Legacy search/page URLs → redirect into /menu */}
          <Redirect
            exact
            from="/search/:keyword/page/:pageNumber"
            to="/menu/search/:keyword/page/:pageNumber"
          />
          <Redirect exact from="/search/:keyword" to="/menu/search/:keyword" />
          <Redirect exact from="/page/:pageNumber" to="/menu/page/:pageNumber" />

          <Route path="/order-pizza" component={PizzaOrderStandalone} />
          <Route path="/checkout" component={CheckoutScreen} />
          <Route path="/" exact component={HomeScreen} />
        </Switch>
        </Suspense>
      </main>
      {!bare && <Footer />}
      <CartDrawer />
      {!bare && <FloatingCart />}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <ToastProvider>
        <CartUIProvider>
          <Chrome />
        </CartUIProvider>
      </ToastProvider>
    </Router>
  );
};

export default App;
