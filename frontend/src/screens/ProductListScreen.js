import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Paginate from "../components/Paginate";
import { AdminStatusPill, adminTh, adminTd, AdminEmptyState } from "../brace/admin/kit";
import { listProducts } from "../store/actions/products";
import { deleteProduct, createProduct } from "../store/actions/product";
import { PRODUCT_CREATE_RESET } from "../store/actionTypes";

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

  useEffect(() => {
    dispatch({ type: PRODUCT_CREATE_RESET });
    if (!userInfo.isAdmin) {
      history.push("/login");
    }
    if (successCreate) {
      history.push(`/admin/product/${createdProduct._id}/edit`);
    } else {
      dispatch(listProducts("", pageNumber));
    }
  }, [
    dispatch,
    history,
    userInfo,
    successDelete,
    successCreate,
    createdProduct,
    pageNumber,
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
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: 24,
          gap: 16,
        }}
      >
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
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "var(--text-faint)",
                  }}
                >
                  <th style={adminTh}>Prodotto</th>
                  <th style={adminTh}>Categoria</th>
                  <th style={adminTh}>Brand</th>
                  <th style={adminTh}>Scorte</th>
                  <th style={{ ...adminTh, textAlign: "right" }}>Prezzo</th>
                  <th style={{ ...adminTh, width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={adminTd}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div className="pizza-plate" style={{ width: 40, height: 40, flexShrink: 0 }}>
                          <div className="crust-glow" />
                        </div>
                        <div>
                          <div style={{ fontSize: 15 }}>{product.name}</div>
                          <div
                            className="mono"
                            style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.1em", marginTop: 3 }}
                          >
                            {product._id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...adminTd, color: "var(--text-dim)" }}>{product.category}</td>
                    <td style={{ ...adminTd, color: "var(--text-dim)" }}>{product.brand}</td>
                    <td style={adminTd}>
                      {product.countInStock > 0 ? (
                        <AdminStatusPill label={`${product.countInStock} pz`} color="var(--ok)" soft />
                      ) : (
                        <AdminStatusPill label="Esaurito" color="var(--accent)" soft />
                      )}
                    </td>
                    <td style={{ ...adminTd, textAlign: "right", fontFamily: "var(--mono)", color: "var(--gold)" }}>
                      {fmt(product.price)}
                    </td>
                    <td style={{ ...adminTd, textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <Link
                          to={`/admin/product/${product._id}/edit`}
                          className="b-btn sm ghost"
                          style={{ padding: "6px 12px" }}
                          aria-label="Modifica"
                        >
                          Modifica
                        </Link>
                        <button
                          onClick={() => deleteHandler(product._id)}
                          className="b-btn sm ghost"
                          style={{ padding: "6px 12px", color: "var(--accent)", borderColor: "var(--accent)" }}
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
          <div style={{ marginTop: 28 }}>
            <Paginate page={page} pages={pages} isAdmin={true} />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductListScreen;
