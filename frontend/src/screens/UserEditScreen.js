import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import { AdminFieldText, AdminToggle } from "../brace/admin/kit";
import { getUserDetails, updateUser } from "../store/actions/user";
import { USER_UPDATE_ADMIN_RESET } from "../store/actionTypes";
import "./UserEditScreen.scss";

const UserEditScreen = ({ match, history }) => {
  const userId = match.params.id;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const dispatch = useDispatch();

  const { loading, error, user } = useSelector((state) => state.userDetails);
  const {
    success: successUpdate,
    loading: loadingUpdate,
    error: errorUpdate,
  } = useSelector((state) => state.userUpdate);

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: USER_UPDATE_ADMIN_RESET });
      history.push("/admin/userlist");
    } else {
      if (!user.name || user._id !== userId) {
        dispatch(getUserDetails(userId));
      } else {
        setName(user.name);
        setEmail(user.email);
        setIsAdmin(user.isAdmin);
      }
    }
  }, [dispatch, userId, user, history, successUpdate]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(
      updateUser({
        _id: userId,
        name,
        email,
        isAdmin,
      })
    );
  };

  return (
    <div className="b-rise user-edit">
      <Link to="/admin/userlist" className="mono user-edit__back">
        ← Torna agli utenti
      </Link>

      {loadingUpdate && <Loader />}
      {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <form onSubmit={submitHandler}>
          <div className="user-edit__card">
            <AdminFieldText label="Nome" value={name} onChange={setName} placeholder="Nome" />
            <AdminFieldText label="Email" type="email" value={email} onChange={setEmail} placeholder="email@..." mono />
            <AdminToggle
              label="Amministratore"
              value={isAdmin}
              onChange={setIsAdmin}
              hint="Accesso completo alla console"
            />
          </div>

          <div className="user-edit__actions">
            <button type="submit" className="b-btn ember">
              <Icon.check /> Salva modifiche
            </button>
            <Link to="/admin/userlist" className="b-btn ghost">
              Annulla
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserEditScreen;
