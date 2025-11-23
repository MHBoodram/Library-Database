import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "./Locked.css"

export default function Locked() {
    const { user, token, logout, useApi} = useAuth();
    //const [amount,setAmount] = useState(0);
    const [isEditing,setIsEditing] = useState(true);
    const [due, setDue] = useState(0);

    function handleLogout() {
        logout();
        navigate('/login');
    }
    // getting outstanding balance
    useEffect(() => {
        const fetchOutstanding = async() =>{
            try{
                const data = await useApi(`api/fines/total`)
                total = data.total_due;
                setDue(total);
            }catch(err){console.error(err);}
        }
    })

    return(
        <div className = "lock-page">
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
                                <label for="card-number">Card Number:</label>
                                <input className = "cardNum-input"
                                    type = "tel"
                                    id = "card-number"
                                    inputMode="numeric"
                                    pattern="[0-9\s]{13,19}" 
                                    maxlength="19" 
                                    placeholder="---- ---- ---- ----" 
                                    required
                                >
                                </input>
                            </div>
                            <div className="cardInfo-short">
                                <div className = "cardCVV-field">
                                    <label for = "card-CVV">CVV:</label>
                                    <input id="card-CVV"></input>
                                </div>
                                <div className = "cardDate-field">
                                    <label for = "expiry-date">Expiry Date:</label>
                                    <input id ="expiry-date"></input>
                                </div>
                            </div>
                            <div className="cardHolder-field">
                                <label for="card-holder">Card Holder:</label>
                                <input className = "cardHolder-input"></input>
                            </div>
                        </div>
                    <div className = "lock-footer">
                        <p>For further assistance or questions, contact a library administrator.</p>
                    </div>
                </div>
                <div className = "lock-actions">
                    <button className = "logout-btn" type='button' onClick={handleLogout}>Logout</button>
                    <button className = "pay-btn" type = 'button'>Pay $X.00</button>
                </div>
            </div>
        </div>
    )
}