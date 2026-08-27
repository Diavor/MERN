import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "../api/axiosConfig";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import fmt from "../brace/ui/fmt";
import Paginate from "../components/Paginate";
import { AdminStatusPill, AdminEmptyState } from "../brace/admin/kit";
import ProductEditModal from "../brace/admin/ProductEditModal";
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
  const [editing, setEditing] = useState(null); // product being edited | null

  // Admin guard.
  useEffect(() => {
    if (!userInfo?.isAdmin) history.push("/login");
  }, [userInfo, history]);

  // Category filter chips.
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

  // (Re)load the catalog on filter/page change, and after a delete.
  useEffect(() => {
    dispatch(listProducts("", pageNumber, cat));
  }, [dispatch, pageNumber, cat, successDelete]);

  // A freshly-created sample product opens straight in the editor modal.
  useEffect(() => {
    if (successCreate && createdProduct) {
      setEditing(createdProduct);
      dispatch({ type: PRODUCT_CREATE_RESET });
    }
  }, [successCreate, createdProduct, dispatch]);

  const deleteHandler = (id) => {
    if (window.confirm("Eliminare questo prodotto?")) {
      dispatch(deleteProduct(id));
    }
  };

  const createProductHandler = () => dispatch(createProduct());

  const handleSaved = () => {
    setEditing(null);
    dispatch(listProducts("", pageNumber, cat));
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
                    <td className="is-lead">
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
                    <td data-label="Categoria" className="is-dim">
                      {product.category}
                    </td>
                    <td data-label="Brand" className="is-dim">
                      {product.brand}
                    </td>
                    <td data-label="Scorte">
                      {product.countInStock > 0 ? (
                        <AdminStatusPill label={`${product.countInStock} pz`} color="var(--ok)" soft />
                      ) : (
                        <AdminStatusPill label="Esaurito" color="var(--accent)" soft />
                      )}
                    </td>
                    <td data-label="Prezzo" className="is-right is-mono is-gold">
                      {fmt(product.price)}
                    </td>
                    <td className="is-right">
                      <div className="product-list__actions">
                        <button
                          onClick={() => setEditing(product)}
                          className="b-btn sm ghost product-list__btn"
                          aria-label="Modifica"
                        >
                          Modifica
                        </button>
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

      <ProductEditModal
        open={!!editing}
        product={editing}
        categories={categories}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default ProductListScreen;
