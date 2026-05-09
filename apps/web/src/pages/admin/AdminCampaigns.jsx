import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api.js";
import { DG, G, GreenCard, WhiteCard, StatusBadge, TH, TD, ActionBtns, EmptyRow, TableWrap, ExportBtn, Pagination } from "./_adminShared";

const PAGE_SIZE = 10;

function FInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all"
        style={{ borderColor: "#dde3ec" }}
        onFocus={(e) => {
          e.target.style.borderColor = G;
          e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#dde3ec";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function FTextArea({ label, value, onChange, rows = 3, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border rounded-md bg-white outline-none transition-all resize-none"
        style={{ borderColor: "#dde3ec" }}
        onFocus={(e) => {
          e.target.style.borderColor = G;
          e.target.style.boxShadow = `0 0 0 2px rgba(46,139,52,0.10)`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#dde3ec";
          e.target.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="bg-white rounded-xl w-full overflow-hidden"
        style={{ maxWidth: "760px", maxHeight: "90vh", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", border: "1px solid #e8edf2" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg, #f0fdf4, #fafff8)" }}
        >
          <div>
            <p className="text-base font-bold text-gray-900">{title}</p>
            <p className="text-xs text-gray-400 mt-0.5">Manage campaign details</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: "calc(90vh - 110px)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function toDatetimeLocalValue(d) {
  // d: Date or string
  const dt = typeof d === "string" ? new Date(d) : d;
  if (!dt || Number.isNaN(dt.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const mm = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const min = pad(dt.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function AdminCampaignsModal({ mode, campaign, onClose, onSaved, allProducts }) {
  const [form, setForm] = useState(() => {
    const now = new Date();
    const start = campaign?.start_at ? toDatetimeLocalValue(campaign.start_at) : toDatetimeLocalValue(now);
    const end = campaign?.end_at ? toDatetimeLocalValue(campaign.end_at) : toDatetimeLocalValue(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));

    return {
      name: campaign?.name || "",
      campaign_key: campaign?.campaign_key || "",
      start_at: start,
      end_at: end,
      is_active: campaign?.is_active ?? true,
    };
  });

  const [selectedProductIds, setSelectedProductIds] = useState(() => {
    // campaign model in backend returns campaign fields only; products are updated via /{id}/products
    // so if campaign contains products in the future, we can use it; otherwise keep empty.
    return Array.isArray(campaign?.product_ids) ? campaign.product_ids : campaign?.products?.map((p) => p.id) || [];
  });

  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const title = mode === "create" ? "Add Campaign" : "Edit Campaign";

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Campaign name is required";
    if (!form.campaign_key.trim()) errs.campaign_key = "Campaign key is required";
    if (!form.start_at) errs.start_at = "Start date/time is required";
    if (!form.end_at) errs.end_at = "End date/time is required";
    if (!form.end_at || !form.start_at) return errs;
    const s = new Date(form.start_at);
    const e = new Date(form.end_at);
    if (s.toString() !== "Invalid Date" && e.toString() !== "Invalid Date" && e < s) errs.end_at = "End must be after start";
    return errs;
  };

  const [errors, setErrors] = useState({});

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      name: form.name.trim(),
      campaign_key: form.campaign_key.trim(),
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      is_active: !!form.is_active,
    };

    try {
      if (mode === "create") {
        const created = await api.createCampaign(payload);
        if (selectedProductIds.length) {
          await api.setCampaignProducts(created.id, selectedProductIds);
        }
        onSaved?.();
        onClose?.();
        return;
      }

      const updated = await api.updateCampaign(campaign.id, payload);
      if (selectedProductIds.length) {
        await api.setCampaignProducts(updated.id, selectedProductIds);
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      alert(e.message || "Failed to save campaign");
    }
  };

  const productOptions = useMemo(() => {
    return allProducts || [];
  }, [allProducts]);

  const toggleProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <ModalShell title={title} onClose={onClose}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FInput label="Campaign Name" value={form.name} onChange={set("name")} placeholder="e.g. Summer Sale" />
        <FInput
          label="Campaign Key" value={form.campaign_key}
          onChange={set("campaign_key")}
          placeholder="unique_key"
          disabled={mode === "edit"}
        />

        <FInput
          label="Start At" type="datetime-local"
          value={form.start_at}
          onChange={set("start_at")}
        />
        <FInput
          label="End At" type="datetime-local"
          value={form.end_at}
          onChange={set("end_at")}
        />

        <div className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={!!form.is_active}
              onChange={(e) => set("is_active")((e.target.checked))}
            />
            Active
          </label>
        </div>

        {(errors.name || errors.campaign_key || errors.start_at || errors.end_at) && (
          <div className="md:col-span-2">
            <div className="rounded-lg border border-red-100 bg-red-50 p-3">
              {Object.values(errors).map((msg, idx) => (
                <p key={idx} className="text-xs font-medium text-red-600">{msg}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-2">Products (assign to campaign)</p>
        <div className="border border-gray-100 rounded-lg p-3" style={{ backgroundColor: "#fafbfc" }}>
          {productOptions.length === 0 ? (
            <p className="text-xs text-gray-400">No products available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {productOptions.slice(0, 30).map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                  />
                  <span className="truncate" title={p.name}>{p.name}</span>
                </label>
              ))}
              {productOptions.length > 30 && (
                <p className="text-[11px] text-gray-400">Showing first 30 products to keep UI fast. Refine later if needed.</p>
              )}
            </div>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-2">Selecting products is optional. If none selected, campaign will have no product mapping.</p>
      </div>

      <div className="flex items-center justify-end gap-2 px-0 pt-2">
        <button onClick={onClose} className="px-4 py-2 text-sm font-semibold border rounded-md hover:bg-gray-50 transition-all text-gray-600" style={{ borderColor: "#dde3ec" }}>
          Cancel
        </button>
        <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95" style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Save Campaign
        </button>
      </div>
    </ModalShell>
  );
}

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [activeCampaign, setActiveCampaign] = useState(null);

  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.getCampaigns();
      const data = res.data || res;
      // api.getCampaigns returns list of CampaignOut objects
      const list = data?.campaigns ? data.campaigns : data || [];
      setCampaigns(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Use same products endpoint as admin products; we only need id + name.
      const res = await api.getAdminProducts();
      const list = (res.data || res) || [];
      setProducts(
        list.map((p) => ({
          id: p.id,
          name: p.name,
        }))
      );
    } catch (e) {
      console.error("Failed to fetch products for campaigns", e);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campaigns.filter((c) => {
      const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.campaign_key?.toLowerCase().includes(q);
      const matchStatus = !statusFilter || (statusFilter === "active" ? c.is_active : !c.is_active);
      return matchSearch && matchStatus;
    });
  }, [campaigns, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const startIdx = (pageSafe - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-5">
      {showModal && (
        <AdminCampaignsModal
          mode={modalMode}
          campaign={activeCampaign}
          onClose={() => setShowModal(false)}
          onSaved={() => fetchCampaigns()}
          allProducts={products}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
        <button
          onClick={() => {
            setModalMode("create");
            setActiveCampaign(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <WhiteCard label="Total Campaigns" value={campaigns.length} accentColor="#3b82f6" />
        <WhiteCard label="Active" value={campaigns.filter((c) => c.is_active).length} accentColor="#22c55e" />
        <WhiteCard label="Inactive" value={campaigns.filter((c) => !c.is_active).length} accentColor="#ef4444" />
        <WhiteCard label="Assigned products" value={"—"} subGray />
      </div>

      <TableWrap loading={loading}>
        <div className="p-4" style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1" style={{ minWidth: "180px" }}>
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607Z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or campaign key"
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-white outline-none transition-all"
                style={{ borderColor: "#dde3ec" }}
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border rounded-md bg-white text-gray-700 cursor-pointer outline-none transition-all"
                style={{ borderColor: "#dde3ec", minWidth: "160px" }}
              >
                <option value="">Status: All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <svg className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            <button
              className="px-4 py-2 text-sm font-semibold text-white rounded-md transition-all hover:opacity-90 active:scale-95"
              style={{ background: `linear-gradient(135deg, ${DG}, ${G})` }}
              onClick={() => fetchCampaigns()}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: "740px" }}>
            <thead style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
              <tr>
                <TH>Campaign</TH>
                <TH>Key</TH>
                <TH>Status</TH>
                <TH>Start</TH>
                <TH>End</TH>
                <TH right>Action</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {loading ? (
                <EmptyRow cols={6} message="Loading campaigns..." />
              ) : paginated.length > 0 ? (
                paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <TD>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{c.name}</span>
                      </div>
                    </TD>
                    <TD>
                      <span className="text-gray-600">{c.campaign_key}</span>
                    </TD>
                    <TD>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </TD>
                    <TD>
                      <span className="text-gray-600">{new Date(c.start_at).toLocaleString()}</span>
                    </TD>
                    <TD>
                      <span className="text-gray-600">{new Date(c.end_at).toLocaleString()}</span>
                    </TD>
                    <TD right>
                      <ActionBtns
                        onEdit={() => {
                          setModalMode("edit");
                          setActiveCampaign(c);
                          setShowModal(true);
                        }}
                        onView={() => {
                          // no dedicated view page yet; open edit modal
                          setModalMode("edit");
                          setActiveCampaign(c);
                          setShowModal(true);
                        }}
                        onDelete={async () => {
                          if (!window.confirm("Delete this campaign?")) return;
                          try {
                            await api.deleteCampaign(c.id);
                            await fetchCampaigns();
                          } catch (e) {
                            alert(e.message || "Failed to delete campaign");
                          }
                        }}
                      />
                    </TD>
                  </tr>
                ))
              ) : (
                <EmptyRow cols={6} message="No campaigns found. Create your first campaign." />
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">Showing {paginated.length} of {filtered.length} entries</p>
          <div className="flex items-center gap-1">
            <button
              className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
              style={pageSafe > 1 ? { borderColor: "#dde3ec", color: "#374151", cursor: "pointer" } : { borderColor: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed" }}
              disabled={pageSafe <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <span className="text-xs font-semibold text-gray-600">Page {pageSafe} / {totalPages}</span>
            <button
              className="px-3 py-1.5 text-xs font-semibold border rounded-md transition-all"
              style={pageSafe < totalPages ? { borderColor: "#dde3ec", color: "#374151", cursor: "pointer" } : { borderColor: "#e5e7eb", color: "#9ca3af", cursor: "not-allowed" }}
              disabled={pageSafe >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      </TableWrap>
    </div>
  );
}

