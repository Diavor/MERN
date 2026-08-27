import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "../../api/axiosConfig";
import Icon from "../ui/Icon";
import Loader from "../ui/Loader";
import Message from "../ui/Message";
import ProductImage from "../ui/ProductImage";
import { useToast } from "../ui/Toast";
import { AdminModal, AdminFieldText, AdminFieldArea, AdminFieldSelect } from "./kit";
import { updateProduct } from "../../store/actions/product";
import { PRODUCT_UPDATE_RESET } from "../../store/actionTypes";
import "./ProductEditModal.scss";

const CATEGORY_PRESETS = ["Pizza", "Bevande", "Dolci"];
const NEW_CATEGORY = "__new__";

// Repeatable name/price rows for a product's dough variants or extra toppings.
const VariantEditor = ({ label, hint, addLabel, rows = [], onChange }) => {
  const setRow = (i, patch) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => onChange([...rows, { name: "", price: "" }]);
  const removeRow = (i) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="product-modal__variants">
      <div className="product-modal__variants-head">
        <div className="product-modal__variants-label">{label}</div>
        {hint && <div className="mono product-modal__variants-hint">{hint}</div>}
      </div>

      {rows.length === 0 ? (
        <div className="mono product-modal__variants-empty">Nessuna voce.</div>
      ) : (
        <ul className="product-modal__variants-list">
          {rows.map((r, i) => (
            <li key={i} className="product-modal__variant-row">
              <input
                className="product-modal__variant-name"
                value={r.name}
                placeholder="Nome"
                onChange={(e) => setRow(i, { name: e.target.value })}
              />
              <div className="product-modal__variant-price">
                <span className="mono product-modal__variant-prefix">€</span>
                <input
                  className="product-modal__variant-price-input"
                  value={r.price}
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  onChange={(e) => setRow(i, { price: e.target.value })}
                />
              </div>
              <button
                type="button"
                className="product-modal__variant-remove"
                onClick={() => removeRow(i)}
                aria-label={`Rimuovi ${r.name || "voce"}`}
              >
                <Icon.close />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className="b-btn sm ghost product-modal__variant-add"
        onClick={addRow}
      >
        <Icon.plus /> {addLabel}
      </button>
    </div>
  );
};

const GalleryEditor = ({ images = [], uploading, onUpload, onChange }) => {
  const [url, setUrl] = useState("");

  const removeAt = (i) => onChange(images.filter((_, idx) => idx !== i));
  const makeCover = (i) =>
    onChange([images[i], ...images.filter((_, idx) => idx !== i)]);
  const addUrl = () => {
    const u = url.trim();
    if (!u) return;
    onChange([...images, u]);
    setUrl("");
  };

  return (
    <div className="product-modal__gallery">
      <div className="product-modal__variants-head">
        <div className="product-modal__variants-label">Foto</div>
        <div className="mono product-modal__variants-hint">
          La prima foto è la copertina · trascina no, usa ⭐
        </div>
      </div>

      <div className="product-modal__thumbs">
        {images.map((src, i) => (
          <div
            key={src + i}
            className={"product-modal__thumb" + (i === 0 ? " is-cover" : "")}
          >
            <ProductImage src={src} alt="" style={{ width: "100%", height: "100%" }} />

            {i === 0 && <span className="product-modal__thumb-badge">Copertina</span>}

            <div className="product-modal__thumb-actions">
              {i !== 0 && (
                <button
                  type="button"
                  className="product-modal__thumb-btn"
                  onClick={() => makeCover(i)}
                  aria-label="Imposta come copertina"
                  title="Imposta come copertina"
                >
                  <Icon.star />
                </button>
              )}
              <button
                type="button"
                className="product-modal__thumb-btn is-danger"
                onClick={() => removeAt(i)}
                aria-label="Rimuovi foto"
                title="Rimuovi foto"
              >
                <Icon.close />
              </button>
            </div>
          </div>
        ))}

        {/* Upload tile */}
        <label className="product-modal__thumb product-modal__thumb-add">
          {uploading ? (
            <Loader />
          ) : (
            <>
              <Icon.plus />
              <span className="mono product-modal__thumb-add-label">Aggiungi</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="product-modal__file-input"
            disabled={uploading}
            onChange={(e) => onUpload(e.target.files)}
          />
        </label>
      </div>

      {images.length === 0 && (
        <div className="mono product-modal__variants-empty">Nessuna foto.</div>
      )}

      {/* Add by URL (seed data uses /img/… paths) */}
      <div className="product-modal__gallery-url">
        <input
          className="product-modal__variant-name"
          value={url}
          placeholder="…oppure incolla un URL immagine"
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
        />
        <button
          type="button"
          className="b-btn sm ghost"
          onClick={addUrl}
          disabled={!url.trim()}
        >
          <Icon.plus /> Aggiungi URL
        </button>
      </div>
    </div>
  );
};

/**
 * Admin product editor rendered in an AdminModal (opened from the product list).
 *
 * @param {boolean}  open        - whether the modal is shown
 * @param {object}   product     - full product to edit (seeds the form)
 * @param {string[]} categories  - distinct catalog categories for the dropdown
 * @param {()=>void} onClose     - close without saving
 * @param {(p)=>void} onSaved    - called with the updated product after a save
 */
const ProductEditModal = ({ open, product, categories = [], onClose, onSaved }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { userInfo } = useSelector((s) => s.userLogin);
  const {
    loading: saving,
    error: saveError,
    success,
    product: saved,
  } = useSelector((s) => s.productUpdate);

  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [images, setImages] = useState([]);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState(false);
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState("");
  const [toppings, setToppings] = useState([]);
  const [doughVariants, setDoughVariants] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Seed the form whenever a new product opens in the modal.
  useEffect(() => {
    if (!open || !product) return;
    setName(product.name || "");
    setPrice(product.price ?? 0);
    // Seed the gallery from images[]; fall back to the legacy single cover.
    setImages(
      product.images && product.images.length
        ? product.images
        : product.img
          ? [product.img]
          : []
    );
    setBrand(product.brand || "");
    setCategory(product.category || "");
    setNewCategory(false);
    setCountInStock(product.countInStock ?? 0);
    setDescription(product.description || "");
    setToppings(product.toppings || []);
    setDoughVariants(product.doughVariants || []);
    setDirty(false);
  }, [open, product]);

  // Close + reset the update slice once a save lands.
  useEffect(() => {
    if (success) {
      toast("Prodotto aggiornato", "ok");
      dispatch({ type: PRODUCT_UPDATE_RESET });
      onSaved?.(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  // Known categories: presets ∪ catalog ∪ the current value, so the dropdown
  // always contains the product's own category even if it's off-preset.
  const categoryOptions = useMemo(() => {
    const known = [
      ...new Set([...CATEGORY_PRESETS, ...categories, category].filter(Boolean)),
    ];
    return [
      ...known.map((c) => ({ value: c, label: c })),
      { value: NEW_CATEGORY, label: "➕ Nuova categoria…" },
    ];
  }, [categories, category]);

  const touch = (setter) => (v) => {
    setDirty(true);
    setter(v);
  };

  const onCategorySelect = (v) => {
    setDirty(true);
    if (v === NEW_CATEGORY) {
      setNewCategory(true);
      setCategory("");
    } else {
      setNewCategory(false);
      setCategory(v);
    }
  };

  // Upload one or more files at once (POST /api/upload/multiple) and append the
  // returned URLs to the gallery.
  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    setUploading(true);
    try {
      const { data } = await axios.post("/api/upload/multiple", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${userInfo?.token}`,
        },
      });
      const urls = data?.urls || [];
      if (urls.length) {
        setImages((prev) => [...prev, ...urls]);
        setDirty(true);
      }
    } catch (err) {
      toast("Caricamento non riuscito", "info");
    } finally {
      setUploading(false);
    }
  };

  const onGalleryChange = (next) => {
    setDirty(true);
    setImages(next);
  };

  // Drop blank rows and coerce prices to numbers to match the backend schema.
  const cleanVariants = (rows) =>
    rows
      .map((r) => ({ name: (r.name || "").trim(), price: Number(r.price) || 0 }))
      .filter((r) => r.name);

  const save = () => {
    if (!product?._id) return;
    // Cover mirrors the first photo; keep the existing img if the gallery is
    // empty so the required field is never blanked.
    const cover = images[0] || product.img || "";
    dispatch(
      updateProduct({
        _id: product._id,
        name,
        price,
        img: cover,
        images,
        brand,
        category,
        countInStock,
        description,
        toppings: cleanVariants(toppings),
        doughVariants: cleanVariants(doughVariants),
      })
    );
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      dirty={dirty}
      title={product?.name || "Prodotto"}
      subtitle="Modifica prodotto"
      width={720}
      footer={
        <div className="product-modal__footer">
          <button className="b-btn ghost" onClick={onClose} disabled={saving}>
            Annulla
          </button>
          <button className="b-btn ember" onClick={save} disabled={saving || uploading}>
            <Icon.check /> {saving ? "Salvataggio…" : "Salva modifiche"}
          </button>
        </div>
      }
    >
      {saveError && <Message variant="danger">{saveError}</Message>}

      <div className="product-modal__grid">
        <div className="product-modal__col-full">
          <AdminFieldText
            label="Nome"
            value={name}
            onChange={touch(setName)}
            placeholder="Nome prodotto"
          />
        </div>

        <AdminFieldText
          label="Prezzo"
          type="number"
          value={price}
          onChange={touch(setPrice)}
          prefix="€"
          mono
        />
        <AdminFieldText
          label="Scorte"
          type="number"
          value={countInStock}
          onChange={touch(setCountInStock)}
          mono
        />

        <AdminFieldText
          label="Brand"
          value={brand}
          onChange={touch(setBrand)}
          placeholder="Brand"
        />

        {newCategory ? (
          <AdminFieldText
            label="Nuova categoria"
            value={category}
            onChange={touch(setCategory)}
            placeholder="Es. Antipasti"
            hint="Testo libero"
          />
        ) : (
          <AdminFieldSelect
            label="Categoria"
            value={category || CATEGORY_PRESETS[0]}
            options={categoryOptions}
            onChange={onCategorySelect}
            hint="Pizza · Bevande · Dolci"
          />
        )}

        <div className="product-modal__col-full">
          <GalleryEditor
            images={images}
            uploading={uploading}
            onUpload={uploadFiles}
            onChange={onGalleryChange}
          />
        </div>

        <div className="product-modal__col-full">
          <AdminFieldArea
            label="Descrizione"
            value={description}
            onChange={touch(setDescription)}
            rows={4}
            placeholder="Descrizione del prodotto"
          />
        </div>

        <div className="product-modal__col-full">
          <VariantEditor
            label="Impasti"
            hint="Varianti di impasto con eventuale sovrapprezzo (es. Senza glutine · +2)"
            addLabel="Aggiungi impasto"
            rows={doughVariants}
            onChange={touch(setDoughVariants)}
          />
        </div>

        <div className="product-modal__col-full">
          <VariantEditor
            label="Aggiunte"
            hint="Ingredienti extra ordinabili con supplemento (es. Bufala · +1.5)"
            addLabel="Aggiungi ingrediente"
            rows={toppings}
            onChange={touch(setToppings)}
          />
        </div>
      </div>
    </AdminModal>
  );
};

export default ProductEditModal;
