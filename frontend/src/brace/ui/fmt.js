// Price formatter: €12.50, €14 (trailing .00 stripped)
const fmt = (n) => "€" + Number(n).toFixed(2).replace(/\.00$/, "");

export default fmt;
