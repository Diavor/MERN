import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axiosConfig";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Paginate from "../components/Paginate";
import { AdminStatusPill, AdminEmptyState } from "../brace/admin/kit";
import { listProducts } from "../store/actions/products";
import { deleteProduct, createProduct } from "../store/actions/product";
import { PRODUCT_CREATE_RESET } from "../store/actionTypes";
import "./ProductListScreen.scss";

const ProductListScreen = ({ history, match }) => {
  const pageNumber = match.params.pageNumber || 1;

  const dispatch = useDispatch();
  const { products, page, pages, loading, error } = useSelector(
    (state) => state.productList
  );
  const {
    success: successDelete,
    error: errorDelete,
    loading: loadingDelete,
  } = useSelector((state) => state.productDelete);

  const {
    success: successCreate,
    error: errorCreate,
    loading: loadingCreate,
    product: createdProduct,
  } = useSelector((state) => state.productCreate);

  const { userInfo } = useSelector((state) => state.userLogin);

  const [cat, setCat] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let alive = true;
    axios
      .get("/api/products/categories")
      .then(({ data }) => alive && setCategories(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET });
    if (!userInfo.isAdmin) {
      history.push("/login");
    }
    if (successCreate) {
      history.push(`/admin/product/${createdProduct._id}/edit`);
    } else {
      dispatch(listProducts("", pageNumber, cat));
    }
  }, [
    dispatch,
    history,
    userInfo,
    successDelete,
    successCreate,
    createdProduct,
    pageNumber,
    cat,
  ]);

  const deleteHandler = (id) => {
    if (window.confirm("Eliminare questo prodotto?")) {
      dispatch(deleteProduct(id));
    }
  };

  const createProductHandler = () => {
    dispatch(createProduct());
  };

  return (
    <div className="b-rise">
      <div className="product-list__toolbar">
        <div className="product-list__filters">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`product-list__filter${cat === c ? " is-active" : ""}`}
            >
              {c === "all" ? "Tutti" : c}
            </button>
          ))}
        </div>
        <button className="b-btn ember" onClick={createProductHandler}>
          <Icon.plus /> Nuovo prodotto
        </button>
      </div>

      {loadingDelete && <Loader />}
      {errorDelete && <Message variant="danger">{errorDelete}</Message>}
      {loadingCreate && <Loader />}
      {errorCreate && <Message variant="danger">{errorCreate}</Message>}

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : !products || products.length === 0 ? (
        <AdminEmptyState
          icon="◐"
          title="Catalogo vuoto"
          body="Crea il primo prodotto per iniziare."
          action={
            <button className="b-btn ember" onClick={createProductHandler}>
              <Icon.plus /> Nuovo prodotto
            </button>
          }
        />
      ) : (
        <>
          <div className="product-list__table-wrap">
            <table className="product-list__table admin-table">
              <thead>
                <tr className="product-list__head-row">
                  <th>Prodotto</th>
                  <th>Categoria</th>
                  <th>Brand</th>
                  <th>Scorte</th>
                  <th className="is-right">Prezzo</th>
                  <th className="is-w120"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="product-list__row">
                    <td>
                      <div className="product-list__cell-main">
                        <div className="pizza-plate product-list__plate">
                          <div className="crust-glow" />
                        </div>
                        <div>
                          <div className="product-list__name">{product.name}</div>
                          <div className="mono product-list__id">
                            {product._id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="is-dim">{product.category}</td>
                    <td className="is-dim">{product.brand}</td>
                    <td>
                      {product.countInStock > 0 ? (
                        <AdminStatusPill label={`${product.countInStock} pz`} color="var(--ok)" soft />
                      ) : (
                        <AdminStatusPill label="Esaurito" color="var(--accent)" soft />
                      )}
                    </td>
                    <td className="is-right is-mono is-gold">
                      {fmt(product.price)}
                    </td>
                    <td className="is-right">
                      <div className="product-list__actions">
                        <Link
                          to={`/admin/product/${product._id}/edit`}
                          className="b-btn sm ghost product-list__btn"
                          aria-label="Modifica"
                        >
                          Modifica
                        </Link>
                        <button
                          onClick={() => deleteHandler(product._id)}
                          className="b-btn sm ghost product-list__btn product-list__btn--del"
                          aria-label="Elimina"
                        >
                          <Icon.close />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="product-list__pagination">
            <Paginate page={page} pages={pages} isAdmin={true} />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductListScreen;
