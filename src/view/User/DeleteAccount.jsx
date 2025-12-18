import React, { useState, useEffect } from "react";
import { useUserViewModel } from "../../viewmodel/UserViewModel";
import { useNavigate } from "react-router-dom";

export const DeleteAccount = () => {
  const navigate = useNavigate();
  const {
    handleDeleteAccount,
  } = useUserViewModel(navigate);

  const [confirmError, setConfirmError] = useState("");

  const onDeleteAccount = async () => {
    try {
      await handleDeleteAccount();
    } catch (err) {
      setConfirmError((err && err.message) || "Error al eliminar la cuenta");
    }
  };

  return (
      <div style={{ maxWidth: "1000px", margin: "1rem auto", padding: "1rem", boxSizing: "border-box" }}>
        <div className="settings-row">
          <div className="settings-title">
            <h2>Delete Account</h2>
          </div>
            
          <div className="settings-form">
            <div className=" settings-container " style={{ padding: "1rem" }}>
            <button
              className="btn"
              type="button"
              onClick={onDeleteAccount}
              style={{
                background: "rgba(234, 3, 3, 0.70)",
                border: "2px solid #583533",
                color: "white",
                padding: "5px 10px",
                width: "230px",
                fontSize: "16px",
                cursor: "pointer",
                height: "45px",
              }}
            >
              Delete Account
            </button>
            </div>
          </div>
        </div>
      </div>  
  );
};

export default DeleteAccount;