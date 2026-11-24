import React, { useEffect, useMemo, useState } from "react";
import api from "./api";

const money = n => "₹" + Number(n || 0).toFixed(2);
const messageOf = e => e.response?.data?.message || "Something went wrong. Please check that the backend is running.";

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = e => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (mode === "register") {
        await api.post("/auth/register", form);
        setMode("login"); setError("Account created. Please log in.");
      } else {
        const { data } = await api.post("/auth/login", form);
        localStorage.setItem("inventoryToken", data.token);
        localStorage.setItem("inventoryUser", JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (err) { setError(messageOf(err)); }
    finally { setBusy(false); }
  }
  return <div className="auth-wrap"><form className="auth-card" onSubmit={submit}>
    <div className="brand-mark">📦</div><h1>Smart Inventory</h1><p className="muted">Inventory and sales management</p>
    <div className="tabs"><button type="button" className={mode==="login"?"active":""} onClick={()=>{setMode("login");setError("");}}>Login</button><button type="button" className={mode==="register"?"active":""} onClick={()=>{setMode("register");setError("");}}>Create account</button></div>
    {mode==="register" && <label>Your name<input name="name" value={form.name} onChange={change} required placeholder="Enter your name"/></label>}
    <label>Email address<input name="email" type="email" value={form.email} onChange={change} required placeholder="you@example.com"/></label>
    <label>Password<input name="password" type="password" value={form.password} onChange={change} required minLength="6" placeholder="At least 6 characters"/></label>
    {error && <div className="notice">{error}</div>}
    <button className="primary full" disabled={busy}>{busy?"Please wait...":mode==="login"?"Log in":"Create account"}</button>
    <p className="hint">First time? Create an account, then log in.</p>
  </form></div>;
}

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("inventoryUser")); } catch { return null; }
  });
  const [page, setPage] = useState("Dashboard");
  const [toast, setToast] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productForm, setProductForm] = useState({ name:"", category:"", price:"", supplier:"", stockQuantity:"0", minimumStock:"5" });
  const [customerForm, setCustomerForm] = useState({ name:"", phone:"", email:"" });
  const [saleForm, setSaleForm] = useState({ customerId:"", productId:"", quantity:"1" });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [search, setSearch] = useState("");

  function notify(text) { setToast(text); window.setTimeout(() => setToast(""), 3000); }
  function logout() { localStorage.removeItem("inventoryToken"); localStorage.removeItem("inventoryUser"); setUser(null); }
  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    Promise.all([api.get("/dashboard"), api.get("/products"), api.get("/customers"), api.get("/sales")])
      .then(([d,p,c,s]) => { if(active) { setDashboard(d.data); setProducts(p.data); setCustomers(c.data); setSales(s.data); } })
      .catch(e => { if(active) { notify(messageOf(e)); if(e.response?.status===401) logout(); } })
      .finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [user, refresh]);

  const filteredProducts = useMemo(() => products.filter(p => `${p.name} ${p.category} ${p.supplier}`.toLowerCase().includes(search.toLowerCase())), [products, search]);
  if (!user) return <Auth onLogin={setUser}/>;

  async function saveProduct(e) {
    e.preventDefault();
    try {
      if (editingProduct) await api.put(`/products/${editingProduct}`, productForm);
      else await api.post("/products", productForm);
      setProductForm({ name:"", category:"", price:"", supplier:"", stockQuantity:"0", minimumStock:"5" });
      setEditingProduct(null); setRefresh(x=>x+1); notify("Product saved successfully.");
    } catch(e) { notify(messageOf(e)); }
  }
  function editProduct(p) {
    setEditingProduct(p._id);
    setProductForm({ name:p.name, category:p.category||"", price:p.price, supplier:p.supplier||"", stockQuantity:p.stock, minimumStock:p.minimumStock });
    setPage("Products");
    window.scrollTo(0,0);
  }
  async function deleteProduct(id) {
    if(!confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); setRefresh(x=>x+1); notify("Product deleted."); } catch(e) { notify(messageOf(e)); }
  }
  async function saveCustomer(e) {
    e.preventDefault();
    try {
      if(editingCustomer) await api.put(`/customers/${editingCustomer}`, customerForm);
      else await api.post("/customers", customerForm);
      setCustomerForm({name:"",phone:"",email:""}); setEditingCustomer(null); setRefresh(x=>x+1); notify("Customer saved.");
    } catch(e) { notify(messageOf(e)); }
  }
  async function deleteCustomer(id) {
    if(!confirm("Delete this customer?")) return;
    try { await api.delete(`/customers/${id}`); setRefresh(x=>x+1); notify("Customer deleted."); } catch(e) { notify(messageOf(e)); }
  }
  async function makeSale(e) {
    e.preventDefault();
    try {
      await api.post("/sales", { customerId:saleForm.customerId || undefined, items:[{productId:saleForm.productId, quantity:Number(saleForm.quantity)}] });
      setSaleForm({customerId:"",productId:"",quantity:"1"}); setRefresh(x=>x+1); notify("Sale recorded. Stock has been reduced.");
    } catch(e) { notify(messageOf(e)); }
  }
  const nav = ["Dashboard","Products","Inventory","Sales","Customers","Reports"];
  return <div className="layout">
    <aside className="sidebar"><div className="side-brand"><span>📦</span><div><b>Smart Inventory</b><small>Management System</small></div></div>
      <div className="nav-label">MENU</div>{nav.map(n=><button key={n} className={`nav-item ${page===n?"selected":""}`} onClick={()=>setPage(n)}><span>{({Dashboard:"▦",Products:"▣",Inventory:"▤",Sales:"↗",Customers:"♙",Reports:"▥"})[n]}</span>{n}</button>)}
      <div className="side-bottom"><div className="user-mini"><div className="avatar">{user.name?.[0]?.toUpperCase()||"A"}</div><div><b>{user.name}</b><small>Administrator</small></div></div><button className="logout" onClick={logout}>↪ Log out</button></div>
    </aside>
    <main className="main"><header className="topbar"><div><span className="muted">Pages / </span><b>{page}</b></div><div className="top-user">Welcome, {user.name} <span className="avatar small">{user.name?.[0]?.toUpperCase()||"A"}</span></div></header>
      <div className="content"><div className="page-heading"><div><h1>{page}</h1><p className="muted">{page==="Dashboard"?"Here is an overview of your shop.":`Manage your ${page.toLowerCase()} information.`}</p></div><button className="outline" onClick={()=>setRefresh(x=>x+1)}>↻ Refresh</button></div>
      {loading && <p className="muted">Loading your information...</p>}
      {page==="Dashboard" && <Dashboard data={dashboard} products={products} sales={sales}/>}
      {page==="Products" && <section className="panel"><h2>{editingProduct?"Edit product":"Add a product"}</h2><form className="form-grid" onSubmit={saveProduct}>
        <label>Product name<input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} placeholder="Example: Notebook"/></label>
        <label>Category<input value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})} placeholder="Stationery"/></label>
        <label>Price (₹)<input required type="number" min="0" step="0.01" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/></label>
        <label>Supplier<input value={productForm.supplier} onChange={e=>setProductForm({...productForm,supplier:e.target.value})}/></label>
        {!editingProduct && <label>Opening stock<input type="number" min="0" value={productForm.stockQuantity} onChange={e=>setProductForm({...productForm,stockQuantity:e.target.value})}/></label>}
        <label>Minimum stock alert<input type="number" min="0" value={productForm.minimumStock} onChange={e=>setProductForm({...productForm,minimumStock:e.target.value})}/></label>
        <div className="form-actions"><button className="primary">{editingProduct?"Update product":"Add product"}</button>{editingProduct&&<button type="button" className="outline" onClick={()=>{setEditingProduct(null);setProductForm({name:"",category:"",price:"",supplier:"",stockQuantity:"0",minimumStock:"5"});}}>Cancel</button>}</div>
      </form><div className="table-head"><h2>Product list</h2><input className="search" placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <ProductTable products={filteredProducts} onEdit={editProduct} onDelete={deleteProduct}/></section>}
      {page==="Inventory" && <section className="panel"><h2>Current stock</h2><p className="muted">Stock is automatically reduced whenever a sale is recorded.</p><ProductTable products={products} inventoryOnly/></section>}
      {page==="Customers" && <section className="panel"><h2>{editingCustomer?"Edit customer":"Add a customer"}</h2><form className="form-grid" onSubmit={saveCustomer}>
        <label>Customer name<input required value={customerForm.name} onChange={e=>setCustomerForm({...customerForm,name:e.target.value})}/></label>
        <label>Phone number<input value={customerForm.phone} onChange={e=>setCustomerForm({...customerForm,phone:e.target.value})}/></label>
        <label>Email<input type="email" value={customerForm.email} onChange={e=>setCustomerForm({...customerForm,email:e.target.value})}/></label>
        <div className="form-actions"><button className="primary">{editingCustomer?"Update customer":"Add customer"}</button>{editingCustomer&&<button type="button" className="outline" onClick={()=>{setEditingCustomer(null);setCustomerForm({name:"",phone:"",email:""});}}>Cancel</button>}</div>
      </form><h2 className="section-title">Customer list</h2><div className="table-wrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Actions</th></tr></thead><tbody>{customers.map(c=><tr key={c._id}><td>{c.name}</td><td>{c.phone||"-"}</td><td>{c.email||"-"}</td><td><button className="text-btn" onClick={()=>{setEditingCustomer(c._id);setCustomerForm({name:c.name,phone:c.phone||"",email:c.email||""});window.scrollTo(0,0);}}>Edit</button><button className="text-btn danger" onClick={()=>deleteCustomer(c._id)}>Delete</button></td></tr>)}{!customers.length&&<Empty cols={4}/>}</tbody></table></div></section>}
      {page==="Sales" && <section className="panel"><h2>Record a sale</h2><form className="form-grid" onSubmit={makeSale}>
        <label>Customer (optional)<select value={saleForm.customerId} onChange={e=>setSaleForm({...saleForm,customerId:e.target.value})}><option value="">Walk-in customer</option>{customers.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
        <label>Product<select required value={saleForm.productId} onChange={e=>setSaleForm({...saleForm,productId:e.target.value})}><option value="">Select product</option>{products.filter(p=>p.stock>0).map(p=><option key={p._id} value={p._id}>{p.name} — {money(p.price)} (stock: {p.stock})</option>)}</select></label>
        <label>Quantity<input required type="number" min="1" value={saleForm.quantity} onChange={e=>setSaleForm({...saleForm,quantity:e.target.value})}/></label>
        <div className="form-actions"><button className="primary">Record sale</button></div>
      </form><h2 className="section-title">Sales history</h2><SalesTable sales={sales}/></section>}
      {page==="Reports" && <><Dashboard data={dashboard} products={products} sales={sales}/><section className="panel"><h2>Sales report</h2><SalesTable sales={sales}/></section></>}
      </div>
    </main>{toast&&<div className="toast">{toast}</div>}
  </div>;
}

function Dashboard({data,products,sales}) {
  const stats = [
    ["Total products",data?.totalProducts??products.length,"▣"],
    ["Available stock",data?.totalStock??products.reduce((a,p)=>a+p.stock,0),"▤"],
    ["Total customers",data?.totalCustomers??0,"♙"],
    ["Total revenue",money(data?.totalRevenue??0),"₹"]
  ];
  return <><div className="stats-grid">{stats.map(([label,value,icon])=><div className="stat-card" key={label}><div className="stat-icon">{icon}</div><p>{label}</p><h2>{value}</h2></div>)}</div>
    <div className="two-col"><section className="panel"><h2>Low stock alerts</h2>{(data?.lowStock||[]).length?<div className="simple-list">{data.lowStock.map(x=><div key={x._id}><span>{x.product?.name||"Product"}</span><b className="warning">{x.stockQuantity} left</b></div>)}</div>:<p className="muted">No low-stock products. Great work!</p>}</section>
    <section className="panel"><h2>Recent sales</h2><p className="muted">Latest recorded transactions</p>{(data?.recentSales||sales).slice(0,5).map(s=><div className="recent-row" key={s._id}><span>{s.customer?.name||"Walk-in customer"}</span><b>{money(s.totalAmount)}</b></div>)}{!(data?.recentSales||sales).length&&<p className="muted">No sales recorded yet.</p>}</section></div>
  </>;
}
function ProductTable({products,onEdit,onDelete,inventoryOnly=false}) {
  return <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th>{!inventoryOnly&&<th>Actions</th>}</tr></thead><tbody>{products.map(p=><tr key={p._id}><td><b>{p.name}</b><small className="cell-sub">{p.supplier||"No supplier"}</small></td><td>{p.category||"General"}</td><td>{money(p.price)}</td><td>{p.stock}</td><td><span className={`pill ${p.stock<=p.minimumStock?"low":"good"}`}>{p.stock<=p.minimumStock?"Low stock":"In stock"}</span></td>{!inventoryOnly&&<td><button className="text-btn" onClick={()=>onEdit(p)}>Edit</button><button className="text-btn danger" onClick={()=>onDelete(p._id)}>Delete</button></td>}</tr>)}{!products.length&&<Empty cols={inventoryOnly?5:6}/>}</tbody></table></div>;
}
function SalesTable({sales}) {
  return <div className="table-wrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Total</th></tr></thead><tbody>{sales.map(s=><tr key={s._id}><td>{new Date(s.saleDate).toLocaleString()}</td><td>{s.customer?.name||"Walk-in customer"}</td><td>{s.items?.map(i=>`${i.productName} × ${i.quantity}`).join(", ")}</td><td><b>{money(s.totalAmount)}</b></td></tr>)}{!sales.length&&<Empty cols={4}/>}</tbody></table></div>;
}
function Empty({cols}) { return <tr><td colSpan={cols} className="empty">No records found. Add your first record above.</td></tr>; }
export default App;
