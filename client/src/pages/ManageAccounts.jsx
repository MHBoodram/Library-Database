import { useEffect,useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import NavBar from "../components/NavBar";
import { formatDate } from "../utils";
import "./ManageAccounts.css"

export default function ManageAccounts(){
    const { token, useApi } = useAuth();
    const apiWithAuth = useMemo(()=>useApi(),[useApi]);
    const [debounced, setDebounced] = useState("");
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [mode, setMode] = useState("all");

    const placeholders ={
        all:"Enter search term",
        fullname:"Enter user full name (format:first last)",
        firstname:"Enter user first name",
        lastname:"Enter user last name",
        email:"Enter user email",
        id:"Enter user ID",
    }

    const currPlacehold = placeholders[mode] || "Enter search term";

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 300);
        return () => clearTimeout(t);
    }, [query]);
    
    useEffect(() => {
        let active = true;
        async function run(){
            setLoading(true);
            setError("");
            try{
                const params =new URLSearchParams();
                if(debounced){
                    params.set("term",debounced);
                }
                params.set("mode",mode);
                const data = await apiWithAuth(`manage/accounts?${params.toString()}`);
                const list = Array.isArray(data) ? data : Array.isArray(data?.rows) ? data.rows : [];
                if (!active) return;
                setRows(list);
            }
            catch{
                if (!active) return;
                setError(err?.message || "Failed to list users");
            }
            finally {
                if (active) setLoading(false);
            }
        }
        run();
        return () => { active = false; };
        }, [debounced, mode, apiWithAuth]);      
    return(
        <div style={{ display:"block", maxWidth: 1000, margin: "2rem auto", padding: 24 }}>
            <NavBar />
            <h1>Manage Accounts</h1>
            <div className = "search-labls" style = {{display:"flex",paddingLeft:0}}>
                <label>Search by:</label>
            </div>
            <div className = "account-search" style = {{display:"flex"}}>
                <div id = "dropdown-container">
                <select id = "mode-dropdown" value = {mode} onChange={(e) => setMode(e.target.value)}>
                    <option value = "all" >All</option>
                    <option value = "fullname" >Full Name</option>
                    <option value = "firstname">First Name</option>
                    <option value = "lastname">Last Name</option>
                    <option value = "email">Email</option>
                    <option value = "id">ID</option>
                </select>
                </div>
                <input id="search-input" onChange={(e) => setQuery(e.target.value)} placeholder ={currPlacehold} ></input>
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: 12, background: "#f8fafc", display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>Accounts: {rows.length}</span>
                    {loading && <span>Loading…</span>}
                    {error && <span style={{ color: "#b91c1c" }}>{error}</span>}
                </div>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                        <thead style={{ background: "#f1f5f9" }}>
                            <tr>
                                <Th>ID</Th>
                                <Th>First Name</Th>
                                <Th>Last Name</Th>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Join Date</Th>
                                <Th>Actions</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: 12 }}>{loading ? "" : "No accounts found."}</td></tr>
                            ) : (
                            rows.map((r) => (
                                <tr key={r.user_id} style={{ borderTop: "1px solid #e5e7eb" }}>
                                    <Td >{r.user_id}</Td>
                                    <Td>{r.first_name}</Td>
                                    <Td>{r.last_name}</Td>
                                    <Td>{r.email}</Td>
                                    <Td>{r.role}</Td>
                                    <Td>{r.created_at}</Td>
                                    <Td>Actions</Td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
function Th({ children }) {
  return (
    <th style={{ textAlign: "left", padding: 10, borderRight: "1px solid #e5e7eb" }}>{children}</th>
  );
}
function Td({ children }) {
  return (
    <td style={{ padding: 10, borderRight: "1px solid #f1f5f9" }}>{children}</td>
  );
}