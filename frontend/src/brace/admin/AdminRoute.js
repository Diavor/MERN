import React from "react";
import { Redirect } from "react-router-dom";
import { useSelector } from "react-redux";
import AdminLayout from "./AdminLayout";

// Guard for every /admin* route. Redirects non-admins to /login, otherwise
// renders the screen inside the admin chrome. Route props (history/match/
// location) are forwarded to the wrapped screen.
const AdminRoute = ({ component: Component, ...rest }) => {
  const { userInfo } = useSelector((s) => s.userLogin);

  if (!userInfo || !userInfo.isAdmin) {
    return <Redirect to="/login" />;
  }

  return (
    <AdminLayout>
      <Component {...rest} />
    </AdminLayout>
  );
};

export default AdminRoute;
