import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { ToastBanner } from "../components/staff/shared/Feedback";
import "./Locked.css"

export default function Locked() {
    const { user, token, logout, useApi} = useAuth();
    //const [amount,setAmount] = useState(0);
    //const [isEditing,setIsEditing] = useState(true);

    // card detail variables
    const [cardNum,setCardNum] = useState("");
    const[cvv,setCvv] = useState("");
    const[expiry,setExpiry] = useState("");
    const[holder,setHolder] = useState("");

    const sanitizedCardNum = cardNum.replace(/\D/g, "");
    const isCardValid = sanitizedCardNum.length === 16;
    const isCvvValid = /^[0-9]{3,4}$/.test(cvv.trim());
    const isExpiryValid = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/.test(expiry.trim());
    const isDisabled = !cardNum || !cvv || !expiry || !holder || !isCardValid || !isCvvValid || !isExpiryValid;
    const [due, setDue] = useState(0);
    const [toast, setToast] = useState(null);
    const showToast = useCallback((payload) => {
        if (!payload) return;
        setToast({ id: Date.now(), ...payload });
      }, []);

    const navigate = useNavigate();
    function handleLogout() {
        logout();
        navigate('/login');
    }

    const formatCardNumber = (value = "") => {
        const digitsOnly = value.replace(/\D/g, "").slice(0, 16);
        const groups = digitsOnly.match(/.{1,4}/g) || [];
        return groups.join(" ");
    };

    const formatCvv = (value = "") => value.replace(/\D/g, "").slice(0, 4);

    const formatExpiry = (value = "") => {
        const digits = value.replace(/\D/g, "").slice(0, 4);
        if (digits.length <= 2) return digits;
        return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    };

    async function handlePay(){
        if(!cardNum || !cvv || !expiry || !holder){
            showToast({ type: "error", text: "Please fill all payment fields" });
            return;
        }
        if(!isCardValid){
            showToast({ type: "error", text: "Card number must be 13-19 digits" });
            return;
        }
        if(!isCvvValid){
            showToast({ type: "error", text: "CVV must be 3 or 4 digits" });
            return;
        }
        if(!isExpiryValid){
            showToast({ type: "error", text: "Use MM/DD format for expiry date" });
            return;
        }
        try{
            const res = await useApi("/fines/pay-total",{
                method: "POST",
                body: {amount: due}
            });
            if(res.error){
                showToast({ type: "error", text: `Payment failed: ${res.error}`});
                return;
            }
            showToast({
              type:"success",
              text:"Payment successful! Please log out and log back in to restore access."
            });
        }catch(err){
            showToast({ type: "error", text: `Payment request failed`})
            console.error(err);
        }
    }
    // getting outstanding balance
    useEffect(() => {
        const fetchOutstanding = async() =>{
            try{
                const data = await useApi(`/fines/total`)
                const total = data.total_due;
                setDue(total);
            }catch(err){console.error(err);}
        };

        fetchOutstanding();
    },[])

    return(
        <div className = "lock-page">
            <ToastBanner style={{position:"sticky"}}toast={toast} onDismiss={() => setToast(null)} />
            <div className = "lock-container">
                <div className = "lock-core">
                    <div className="lock-header">
                        <div className = "lock-img-container">🔒</div>
                        <div className="lock-header-text">
                            Unfortunately, Your Account is Locked
                        </div>
                    </div>
                    <div className="lock-body"></div>
                        <div className = "lock-text-reason">
                            <p>Your account has been locked because one or more items have been overdue for more than 28 days and as such have been marked as lost</p>
                            <p>To restore access, please pay the full outstanding fine amount of:{" "}<strong>${due.toFixed(2)}</strong> </p>
                        </div>
                        <div className="lock-payment">
                            {/*<div className = "amount-field">
                                <label>Amount:</label>
                                <input id = "amount" type = "number"></input>
                            </div>*/}
                            <div className="cardNum-field">
                                <label htmlFor="card-number">Card Number:</label>
                                    <input className = "cardNum-input"
                                    type = "tel"
                                    id = "card-number"
                                    inputMode="numeric"
                                    pattern="[0-9\s]{16,19}" 
                                    maxLength="19" 
                                    placeholder="---- ---- ---- ----" 
                                    value={cardNum}
                                    onChange={e=>setCardNum(formatCardNumber(e.target.value))}
                                    autoComplete="off"
                                    required
                                >
                                </input>
                            </div>
                            <div className="cardInfo-short">
                                <div className = "cardCVV-field">
                                    <label htmlFor = "card-CVV">CVV:</label>
                                    <input 
                                    type = "tel"
                                    inputMode= "numeric"
                                    pattern="[0-9]{3,4}"
                                    maxLength="4"
                                    id="card-CVV"
                                    placeholder="CVV"
                                    value={cvv}
                                    onChange={e=>setCvv(formatCvv(e.target.value))}
                                    autoComplete="off"
                                    required
                                    >
                                    </input>
                                </div>
                                <div className = "cardDate-field">
                                    <label htmlFor = "expiry-date">Expiry Date:</label>
                                    <input id ="expiry-date"
                                    type="text"
                                    pattern="(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])"
                                    value={expiry}
                                    maxLength="5"
                                    onChange={e=>setExpiry(formatExpiry(e.target.value))}
                                    placeholder="MM/DD"
                                    autoComplete="off"
                                    required
                                    >
                                    </input>
                                </div>
                            </div>
                            <div className="cardHolder-field">
                                <label htmlFor="card-holder">Card Holder:</label>
                                <input 
                                className = "cardHolder-input"
                                placeholder="Full Name"
                                onChange={e=>setHolder(e.target.value)}
                                autoComplete="off"
                                required
                                >
                                </input>
                            </div>
                        </div>
                    <div className = "lock-footer">
                        <p>For further assistance or questions, contact a library administrator.</p>
                    </div>
                </div>
                <div className = "lock-actions">
                    <button className = "logout-btn" type='button' onClick={handleLogout}>Logout</button>
                    <button className = "pay-btn" type = 'button' disabled = {isDisabled} onClick={handlePay}>Pay ${due.toFixed(2)}</button>
                </div>
            </div>
        </div>
    )
}
