import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { ToastBanner } from "../components/staff/shared/Feedback";
import "./Locked.css"

export default function Locked() {
    const { user, token, logout, useApi} = useAuth();
    //const [amount,setAmount] = useState(0);
    //const [isEditing,setIsEditing] = useState(true);

    //card detail variables
    const [cardNum,setCardNum] = useState("");
    const[cvv,setCvv] = useState("");
    const[expiry,setExpiry] = useState("");
    const[holder,setHolder] = useState("");

    const isDisabled = !cardNum || !cvv || !expiry || !holder;
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

    async function handlePay(){
        if(!cardNum || !cvv || !expiry || !holder){
            setToast({ type: "error", message: "Please fill all payment fields" });
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
                                    pattern="[0-9\s]{13,19}" 
                                    maxLength="19" 
                                    placeholder="---- ---- ---- ----" 
                                    onChange={e=>setCardNum(e.target.value)}
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
                                    onChange={e=>setCvv(e.target.value)}
                                    required
                                    >
                                    </input>
                                </div>
                                <div className = "cardDate-field">
                                    <label htmlFor = "expiry-date">Expiry Date:</label>
                                    <input id ="expiry-date"
                                    type="text"
                                    pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                                    onChange={e=>setExpiry(e.target.value)}
                                    placeholder="MM/YY"
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
