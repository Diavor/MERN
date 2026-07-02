/**
 * Pizza Ordering Widget — standalone, zero-dependency
 *
 * Usage on any website:
 *   <div id="pizza-order-widget"></div>
 *   <script>window.PIZZA_WIDGET_API = 'https://your-server.com'</script>
 *   <script src="https://your-server.com/pizza-widget.js"></script>
 */
;(function (window) {
  'use strict'

  var API_BASE = (window.PIZZA_WIDGET_API || '').replace(/\/$/, '')

  var MENU = [
    { id: 1, name: 'Margherita', price: 8.5, description: 'Tomato, mozzarella, basil' },
    { id: 2, name: 'Diavola', price: 10.5, description: 'Tomato, mozzarella, spicy salami' },
    { id: 3, name: 'Quattro Formaggi', price: 11.0, description: 'Four cheese blend' },
    { id: 4, name: 'Prosciutto', price: 10.0, description: 'Tomato, mozzarella, ham' },
    { id: 5, name: 'Vegetariana', price: 9.5, description: 'Seasonal vegetables' },
    { id: 6, name: 'Capricciosa', price: 11.5, description: 'Ham, mushrooms, artichokes, olives' },
  ]

  var state = {
    cart: {},
    selectedDate: '',
    selectedSlot: '',
    slots: [],
    loadingSlots: false,
    submitting: false,
    error: '',
    success: null,
  }

  var container = null

  /* ── State helpers ─────────────────────────────────────────────── */

  function setState(patch) {
    for (var k in patch) state[k] = patch[k]
    render()
  }

  function totalQty() {
    return Object.values(state.cart).reduce(function (a, b) { return a + b }, 0)
  }

  function totalPrice() {
    return MENU.reduce(function (acc, p) {
      return acc + (state.cart[p.id] || 0) * p.price
    }, 0)
  }

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  /* ── Actions ───────────────────────────────────────────────────── */

  function addToCart(id) {
    var next = Object.assign({}, state.cart)
    next[id] = (next[id] || 0) + 1
    setState({ cart: next, error: '' })
  }

  function removeFromCart(id) {
    var next = Object.assign({}, state.cart)
    if (next[id] > 1) next[id]--
    else delete next[id]
    setState({ cart: next })
  }

  function selectSlot(time) {
    setState({ selectedSlot: time, error: '' })
  }

  function onDateChange(date) {
    setState({ selectedDate: date, selectedSlot: '', slots: [], error: '' })
    if (date) fetchSlots(date)
  }

  function fetchSlots(date) {
    setState({ loadingSlots: true })
    fetch(API_BASE + '/api/slots?date=' + date)
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load slots')
        return r.json()
      })
      .then(function (data) {
        setState({ slots: data, loadingSlots: false })
      })
      .catch(function () {
        setState({ loadingSlots: false, error: 'Could not load time slots.' })
      })
  }

  function checkout() {
    if (totalQty() === 0) return setState({ error: 'Your cart is empty.' })
    if (!state.selectedSlot) return setState({ error: 'Please select a delivery time slot.' })

    var items = MENU.filter(function (p) { return state.cart[p.id] }).map(function (p) {
      return { name: p.name, qty: state.cart[p.id], price: p.price }
    })

    setState({ submitting: true, error: '' })

    fetch(API_BASE + '/api/pizza-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items,
        deliveryDate: state.selectedDate,
        deliverySlot: state.selectedSlot,
      }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error(data.message || 'Order failed')
          return data
        })
      })
      .then(function (data) {
        setState({ success: data, submitting: false, cart: {}, selectedSlot: '' })
      })
      .catch(function (e) {
        setState({ submitting: false, error: e.message || 'Order failed. Please try again.' })
      })
  }

  function resetSuccess() {
    setState({ success: null })
  }

  /* ── Styles ────────────────────────────────────────────────────── */

  function injectStyles() {
    if (document.getElementById('_pw_styles')) return
    var s = document.createElement('style')
    s.id = '_pw_styles'
    s.textContent = [
      '.pw{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:1000px;margin:0 auto;padding:20px;color:#333;box-sizing:border-box}',
      '.pw *{box-sizing:border-box}',
      '.pw h2{font-size:1.7rem;font-weight:700;margin:0 0 20px;color:#c0392b}',
      '.pw-grid{display:grid;grid-template-columns:1fr 360px;gap:24px}',
      '@media(max-width:768px){.pw-grid{grid-template-columns:1fr}}',
      '.pw-menu{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-bottom:8px}',
      '.pw-card{border:1px solid #e0e0e0;border-radius:8px;padding:14px;background:#fff}',
      '.pw-card-name{font-weight:600;margin-bottom:3px}',
      '.pw-card-desc{color:#777;font-size:.8rem;margin-bottom:10px}',
      '.pw-card-foot{display:flex;justify-content:space-between;align-items:center}',
      '.pw-price{font-weight:700;color:#c0392b}',
      '.pw-qty{display:flex;align-items:center;gap:6px}',
      '.pw-btn{cursor:pointer;border:none;border-radius:4px;padding:4px 10px;font-size:.85rem;line-height:1.4}',
      '.pw-btn-add{background:#c0392b;color:#fff}.pw-btn-add:hover{background:#a93226}',
      '.pw-btn-sub{background:#eee;color:#333}.pw-btn-sub:hover{background:#ddd}',
      '.pw-panel{border:1px solid #e0e0e0;border-radius:8px;padding:16px;background:#fff;margin-bottom:16px}',
      '.pw-panel-head{font-weight:600;padding-bottom:10px;margin-bottom:12px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:8px}',
      '.pw-badge{background:#c0392b;color:#fff;border-radius:10px;padding:1px 8px;font-size:.72rem}',
      '.pw-order-row{display:flex;justify-content:space-between;font-size:.88rem;margin-bottom:5px}',
      '.pw-total{display:flex;justify-content:space-between;font-weight:700;border-top:1px solid #eee;padding-top:8px;margin-top:6px}',
      '.pw-empty{color:#aaa;font-size:.88rem}',
      '.pw-label{display:block;font-size:.82rem;font-weight:600;margin-bottom:6px}',
      '.pw-input{width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:4px;font-size:.9rem;margin-bottom:14px}',
      '.pw-slots{display:flex;flex-wrap:wrap;gap:5px}',
      '.pw-slot{padding:4px 9px;border-radius:4px;font-size:.76rem;cursor:pointer;border:1px solid #c0392b;background:#fff;color:#c0392b}',
      '.pw-slot:disabled{background:#f0f0f0;border-color:#ccc;color:#bbb;cursor:not-allowed}',
      '.pw-slot.active{background:#c0392b;color:#fff}',
      '.pw-slot:not(:disabled):not(.active):hover{background:#fdecea}',
      '.pw-error{background:#fdecea;color:#c0392b;padding:10px 12px;border-radius:6px;font-size:.85rem;margin-bottom:12px}',
      '.pw-checkout{width:100%;padding:12px;background:#c0392b;color:#fff;border:none;border-radius:6px;font-size:1rem;font-weight:600;cursor:pointer}',
      '.pw-checkout:hover:not(:disabled){background:#a93226}',
      '.pw-checkout:disabled{background:#ccc;cursor:not-allowed}',
      '.pw-success{background:#eafaf1;border:1px solid #a9dfbf;border-radius:8px;padding:32px;text-align:center}',
      '.pw-success h3{color:#1e8449;margin:0 0 10px}',
      '.pw-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:_pw_spin .7s linear infinite;vertical-align:middle;margin-right:6px}',
      '@keyframes _pw_spin{to{transform:rotate(360deg)}}',
    ].join('')
    document.head.appendChild(s)
  }

  /* ── Render ────────────────────────────────────────────────────── */

  function h(tag, attrs, inner) {
    var el = document.createElement(tag)
    for (var k in attrs) {
      if (k === 'className') el.className = attrs[k]
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), attrs[k])
      else el.setAttribute(k, attrs[k])
    }
    if (inner !== undefined) el.innerHTML = inner
    return el
  }

  function render() {
    if (!container) return
    injectStyles()
    container.innerHTML = ''

    var wrap = h('div', { className: 'pw' })

    if (state.success) {
      var o = state.success
      wrap.innerHTML =
        '<div class="pw-success">' +
        '<h3>Order Placed!</h3>' +
        '<p>Delivery on <strong>' + o.deliveryDate + '</strong> at <strong>' + o.deliverySlot + '</strong></p>' +
        '<p>Total: <strong>€' + o.totalPrice.toFixed(2) + '</strong></p>' +
        '</div>'
      var again = h('button', { className: 'pw-checkout', style: 'margin-top:14px;width:auto;padding:10px 28px' }, 'Order Again')
      again.addEventListener('click', resetSuccess)
      wrap.querySelector('.pw-success').appendChild(again)
      container.appendChild(wrap)
      return
    }

    wrap.appendChild(h('h2', {}, 'Order Pizza'))

    var grid = h('div', { className: 'pw-grid' })

    /* ── Menu column ── */
    var menuCol = h('div', {})
    var menuGrid = h('div', { className: 'pw-menu' })

    MENU.forEach(function (pizza) {
      var card = h('div', { className: 'pw-card' })
      card.innerHTML =
        '<div class="pw-card-name">' + pizza.name + '</div>' +
        '<div class="pw-card-desc">' + pizza.description + '</div>' +
        '<div class="pw-card-foot">' +
        '<span class="pw-price">€' + pizza.price.toFixed(2) + '</span>' +
        '<div class="pw-qty" id="qty-' + pizza.id + '"></div>' +
        '</div>'

      var qtyBox = card.querySelector('#qty-' + pizza.id)

      if (state.cart[pizza.id]) {
        var sub = h('button', { className: 'pw-btn pw-btn-sub' }, '−')
        sub.addEventListener('click', function (id) { return function () { removeFromCart(id) } }(pizza.id))
        qtyBox.appendChild(sub)

        var cnt = h('span', {}, String(state.cart[pizza.id]))
        qtyBox.appendChild(cnt)
      }

      var add = h('button', { className: 'pw-btn pw-btn-add' }, '+')
      add.addEventListener('click', function (id) { return function () { addToCart(id) } }(pizza.id))
      qtyBox.appendChild(add)

      menuGrid.appendChild(card)
    })

    menuCol.appendChild(menuGrid)
    grid.appendChild(menuCol)

    /* ── Sidebar column ── */
    var sidebar = h('div', {})

    // Order summary panel
    var summaryPanel = h('div', { className: 'pw-panel' })
    var qty = totalQty()
    var price = totalPrice()
    var summHead = h('div', { className: 'pw-panel-head' }, 'Your Order')
    if (qty > 0) summHead.innerHTML += '<span class="pw-badge">' + qty + '</span>'
    summaryPanel.appendChild(summHead)

    if (qty === 0) {
      summaryPanel.appendChild(h('div', { className: 'pw-empty' }, 'No items added yet'))
    } else {
      MENU.filter(function (p) { return state.cart[p.id] }).forEach(function (p) {
        var row = h('div', { className: 'pw-order-row' })
        row.innerHTML = '<span>' + p.name + ' × ' + state.cart[p.id] + '</span><span>€' + (p.price * state.cart[p.id]).toFixed(2) + '</span>'
        summaryPanel.appendChild(row)
      })
      var total = h('div', { className: 'pw-total' })
      total.innerHTML = '<span>Total (' + qty + ' pizza' + (qty !== 1 ? 's' : '') + ')</span><span>€' + price.toFixed(2) + '</span>'
      summaryPanel.appendChild(total)
    }

    sidebar.appendChild(summaryPanel)

    // Delivery panel
    var delivPanel = h('div', { className: 'pw-panel' })
    delivPanel.appendChild(h('div', { className: 'pw-panel-head' }, 'Delivery'))

    delivPanel.appendChild(h('label', { className: 'pw-label' }, 'Select Date'))

    var dateInput = h('input', { className: 'pw-input', type: 'date', min: today(), value: state.selectedDate })
    dateInput.addEventListener('change', function () { onDateChange(this.value) })
    delivPanel.appendChild(dateInput)

    if (state.selectedDate) {
      delivPanel.appendChild(h('label', { className: 'pw-label' }, 'Select Time Slot'))

      if (state.loadingSlots) {
        delivPanel.appendChild(h('div', {}, 'Loading slots...'))
      } else {
        var slotsWrap = h('div', { className: 'pw-slots' })
        state.slots.forEach(function (slot) {
          var btn = h(
            'button',
            {
              className: 'pw-slot' + (state.selectedSlot === slot.time ? ' active' : ''),
            },
            slot.time + (slot.available < 10 && slot.available > 0 ? ' (' + slot.available + ')' : '')
          )
          if (slot.available === 0) btn.disabled = true
          btn.addEventListener('click', function (t) { return function () { selectSlot(t) } }(slot.time))
          slotsWrap.appendChild(btn)
        })
        delivPanel.appendChild(slotsWrap)
      }
    }

    sidebar.appendChild(delivPanel)

    if (state.error) {
      sidebar.appendChild(h('div', { className: 'pw-error' }, state.error))
    }

    var checkoutBtn = h(
      'button',
      { className: 'pw-checkout' },
      state.submitting ? '<span class="pw-spinner"></span>Placing Order...' : 'Place Order'
    )
    if (state.submitting || qty === 0 || !state.selectedSlot) checkoutBtn.disabled = true
    checkoutBtn.addEventListener('click', checkout)
    sidebar.appendChild(checkoutBtn)

    grid.appendChild(sidebar)
    wrap.appendChild(grid)
    container.appendChild(wrap)
  }

  /* ── Init ──────────────────────────────────────────────────────── */

  function init() {
    container = document.getElementById('pizza-order-widget')
    if (!container) {
      console.error('[PizzaWidget] No element with id="pizza-order-widget" found.')
      return
    }
    render()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})(window)
