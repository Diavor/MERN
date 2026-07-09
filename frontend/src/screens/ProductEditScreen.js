import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Message from "../brace/ui/Message";
import Loader from "../brace/ui/Loader";
import Icon from "../brace/ui/Icon";
import { AdminFieldText, AdminFieldArea } from "../brace/admin/kit";
import { listProductDetails, updateProduct } from "../store/actions/product";
import { PRODUCT_UPDATE_RESET } from "../store/actionTypes";

const ProductEditScreen = ({ match, history }) => {
  const productId = match.params.id;
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [img, setImg] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  const dispatch = useDispatch();

  const { loading, error, product } = useSelector(
    (state) => state.productDetails
  );

  const {
    error: errorUpdate,
    success: successUpdate,
    loading: loadingUpdate,
  } = useSelector((state) => state.productUpdate);

  const {
    userLogin: { userInfo },
  } = useSelector((state) => state);

  useEffect(() => {
    if (successUpdate) {
      dispatch({ type: PRODUCT_UPDATE_RESET });
      history.push("/admin/productlist");
    } else {
      if (!product || !product.name || product._id !== productId) {
        dispatch(listProductDetails(productId));
      } else {
        setName(product.name);
        setPrice(product.price);
        setImg(product.img);
        setBrand(product.brand);
        setCategory(product.category);
        setCountInStock(product.countInStock);
        setDescription(product.description);
      }
    }
  }, [dispatch, productId, history, product, successUpdate]);

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("img", file);
    setUploading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const { data } = await axios.post("/api/upload", formData, config);

      // Upload route now returns { url }; keep back-compat with the old bare-string body.
      setImg(typeof data === "string" ? data : data.url);
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(
      updateProduct({
        _id: productId,
        name,
        price,
        img,
        brand,
        category,
        countInStock,
        description,
      })
    );
  };

  return (
    <div className="b-rise" style={{ maxWidth: 760 }}>
      <Link
        to="/admin/productlist"
        className="mono"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "var(--text-dim)",
          textDecoration: "none",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 28,
        }}
      >
        ← Torna al catalogo
      </Link>

      {loadingUpdate && <Loader />}
      {errorUpdate && <Message variant="danger">{errorUpdate}</Message>}

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <form onSubmit={submitHandler}>
          <div
            style={{
              background: "var(--bg-2)",
              border: "1px solid var(--line)",
              padding: 32,
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 20,
            }}
          >
            <div style={{ gridColumn: "span 2" }}>
              <AdminFieldText label="Nome" value={name} onChange={setName} placeholder="Nome prodotto" />
            </div>
            <AdminFieldText label="Prezzo" type="number" value={price} onChange={setPrice} prefix="€" mono />
            <AdminFieldText
              label="Scorte"
              type="number"
              value={countInStock}
              onChange={setCountInStock}
              mono
            />
            <AdminFieldText label="Brand" value={brand} onChange={setBrand} placeholder="Brand" />
            <AdminFieldText label="Categoria" value={category} onChange={setCategory} placeholder="Categoria" />

            <div style={{ gridColumn: "span 2" }}>
              <AdminFieldText label="Immagine (URL)" value={img} onChange={setImg} placeholder="/images/..." mono />
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  cursor: "pointer",
                }}
                className="b-btn sm ghost"
              >
                <Icon.plus /> Carica file
                <input type="file" onChange={uploadFileHandler} style={{ display: "none" }} />
              </label>
              {uploading && <Loader />}
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <AdminFieldArea
                label="Descrizione"
                value={description}
                onChange={setDescription}
                rows={4}
                placeholder="Descrizione del prodotto"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button type="submit" className="b-btn ember">
              <Icon.check /> Salva modifiche
            </button>
            <Link to="/admin/productlist" className="b-btn ghost">
              Annulla
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProductEditScreen;
