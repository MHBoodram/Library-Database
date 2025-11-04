import { useEffect,useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { formatDate } from "../utils";

export default function manageUsers(){
    const apiWithAuth = useMemo(()=>useApi(),[useApi]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    return(
        <div>
            <NavBar />
            <h1>Manage Users</h1>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: 12, background: "#f8fafc", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>Loans: {rows.length}</span>
                    {loading && <span>Loading…</span>}
                    {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead style={{ background: "#f1f5f9" }}>
                            <tr>
                                <Th>User ID</Th>
                                <Th>Name</Th>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Join Date</Th>
                                <Th>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: 12 }}>{loading ? "" : "No loans found."}</td></tr>
                            ) : (
                            rows.map((r) => (
                                <tr key={r.loan_id} style={{ borderTop: "1px solid #e5e7eb" }}>
                                    <Td title={r.item_title}>{r.item_title}</Td>
                                    <Td>{formatDate(r.due_date)}</Td>
                                    <Td>{formatDate(r.return_date)}</Td>
                                    <Td style={{ textTransform: "capitalize" }}>{r.status}</Td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}