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
import HomeCmsScreen from "./screens/HomeCmsScreen";
import MenuScreen from "./screens/MenuScreen";
import StoryScreen from "./screens/StoryScreen";
import CollezioneScreen from "./screens/CollezioneScreen";
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
import AdminOrderDetailScreen from "./screens/AdminOrderDetailScreen";
import KitchenScreen from "./screens/KitchenScreen";
import DeliveryScreen from "./screens/DeliveryScreen";
import AdminZonesScreen from "./screens/AdminZonesScreen";
import AdminCouponsScreen from "./screens/AdminCouponsScreen";
import AdminPagesScreen from "./screens/AdminPagesScreen";
import AdminCustomersScreen from "./screens/AdminCustomersScreen";
import AdminSettingsScreen from "./screens/AdminSettingsScreen";
import CheckoutScreen from "./screens/CheckoutScreen";
import PageScreen from "./screens/PageScreen";
import AdminRoute from "./brace/admin/AdminRoute";

// The embeddable /order-pizza widget still uses react-bootstrap. It is lazily
// loaded, and injects its vendored Bootswatch theme from /vendor as a <link> on
// mount, so that CSS never enters the main bundle or the Tailwind pipeline.
const PizzaOrderStandalone = lazy(() =>
  import("./screens/PizzaOrderStandalone")
);

const Chrome = () => {
  const { pathname } = useLocation();
  const admin = pathname.startsWith("/admin");
  const bare = admin || pathname.startsWith("/order-pizza");

  return (
    <>
      {/* The admin console ships its own chrome (AdminLayout); the storefront
          nav would just overflow small screens there. */}
      {!admin && <Nav />}
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
          <Route path="/collezione" exact component={CollezioneScreen} />

          <Route
            path="/admin"
            exact
            render={(props) => <AdminRoute component={AdminDashboardScreen} {...props} />}
          />
          <Route
            path="/admin/kitchen"
            render={(props) => <AdminRoute component={KitchenScreen} {...props} />}
          />
          <Route
            path="/admin/delivery"
            render={(props) => <AdminRoute component={DeliveryScreen} {...props} />}
          />
          <Route
            path="/admin/orders/:id"
            render={(props) => <AdminRoute component={AdminOrderDetailScreen} {...props} />}
          />
          <Route
            path="/admin/orderlist"
            render={(props) => <AdminRoute component={OrderListScreen} {...props} />}
          />
          <Route
            path="/admin/zones"
            render={(props) => <AdminRoute component={AdminZonesScreen} {...props} />}
          />
          <Route
            path="/admin/coupons"
            render={(props) => <AdminRoute component={AdminCouponsScreen} {...props} />}
          />
          <Route
            path="/admin/pages"
            render={(props) => <AdminRoute component={AdminPagesScreen} {...props} />}
          />
          <Route
            path="/admin/customers"
            render={(props) => <AdminRoute component={AdminCustomersScreen} {...props} />}
          />
          <Route
            path="/admin/settings"
            render={(props) => <AdminRoute component={AdminSettingsScreen} {...props} />}
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

          {/* Storefront catalog (Grani Antichi) */}
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
          <Route path="/" exact component={HomeCmsScreen} />

          {/* Catch-all: CMS pages authored in the admin Pages module, matched by
              slug. Kept LAST so every known route above wins first; only an
              otherwise-unmatched single-segment path is treated as a page slug. */}
          <Route path="/:slug" component={PageScreen} />
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
