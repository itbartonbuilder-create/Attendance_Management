import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import loginPage from "../assets/loginPage.jpeg";
import ReCAPTCHA from "react-google-recaptcha";


function Login() {
  const [step, setStep] = useState("select");
  const [role, setRole] = useState("admin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [vendorType, setVendorType] = useState("");
  const [category, setCategory] = useState("");

  const [aadhar, setAadhar] = useState("");
  const [pan, setPan] = useState("");
  const [gst, setGst] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);



  const [vendorMode, setVendorMode] = useState("login");

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const resetVendorForm = () => {
    setName("");
    setCompanyName("");
    setContactNo("");
    setAadhar("");
    setPan("");
    setGst("");
    setVendorType("");
    setCategory("");
    setEmail("");
    setPassword("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!captchaToken) {
    alert("Please verify captcha");
    setIsLoading(false);
    return;
  }

    try {
      let res;
      let userData;

      /* ================= OFFICE ================= */
      if (step === "office") {
        if (role === "admin") {
          res = await axios.post(
            "https://attendance-management-backend-vh2w.onrender.com/api/auth/login",
            { email, password, captchaToken }
          );
        } else if (role === "manager") {
          res = await axios.post(
            "https://attendance-management-backend-vh2w.onrender.com/api/auth/login",
            { site: name, contactNo, captchaToken }
          );
        } else {
          res = await axios.post(
            "https://attendance-management-backend-vh2w.onrender.com/api/auth/login",
            { name, contactNo, captchaToken }
          );
        }

        userData = {
          ...res.data.user,
          displayName:
            res.data.user.name ||
            res.data.user.site ||
            "User",
        };

        localStorage.setItem("user", JSON.stringify(userData));
        alert(`✅ Login Successful — Welcome ${userData.displayName}`);
        navigate("/dashboard");
        return;
      }
      
      if (step === "vendor") {
       
        if (vendorMode === "login") {
          res = await axios.post(
            "https://attendance-management-backend-vh2w.onrender.com/api/vendor/login",
            {
              contactNo,
              password,
              captchaToken
            }
          );

          const vendor = res.data.vendor || res.data.user;

          userData = {
            ...vendor,
              role: "vendor", 
            displayName: vendor.name,
          };

          localStorage.setItem("user", JSON.stringify(userData));
          alert(`✅ Login Successful — Welcome ${vendor.name}`);
          navigate("/vendor-dashboard");
          return;
        }

        // 🧾 REGISTER
        await axios.post(
          "https://attendance-management-backend-vh2w.onrender.com/api/vendor/register",
          {
            name,
            companyName,
            contactNo,
            aadharNumber: aadhar,
            panNumber: pan,
            vendorType,
            category,
            gstNumber: gst,
            email,
            password,
          }
        );
        resetVendorForm();


        alert("⏳ Vendor registered successfully. Admin approval pending.");
        return;
      }
    } catch (err) {
      alert(err.response?.data?.message || "❌ Action failed.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div
      style={{
        backgroundImage: `url(${loginPage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      {isLoading && (
        <div style={overlayStyle}>
          <div style={spinnerStyle}></div>
          <p style={{ color: "white", marginTop: "10px", fontSize: "18px" }}>
            Processing...
          </p>
        </div>
      )}

      <div
        style={{
          backdropFilter: "blur(30px)",
          borderRadius: "16px",
          padding: "30px",
          width: "360px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "23px",
            gap: "12px",
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ width: 44, height: 55, objectFit: "contain" }}
          />
          <h1
            style={{
              fontWeight: "bold",
              color: "white",
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              margin: 0,
              fontSize: "22px",
            }}
          >
            Bartons Builders Limited
          </h1>
        </div>


        {step === "select" && (
          <div style={{ textAlign: "center", color: "white" }}>
            <h2
              style={{
                marginTop: "10px",
                marginBottom: "12px",
                color: "#633131",
                fontSize: "32px",
                fontFamily: "Times Roman",
              }}
            >
              Select Login Type
            </h2>

            <button style={selectBtn} onClick={() => setStep("office")}>
              Office
            </button>

            <button style={selectBtn} onClick={() => setStep("vendor")}>
              Vendor
            </button>
          </div>
        )}



        {step === "office" && (
          <>
            <div style={{ marginBottom: "20px", textAlign: "center", color: "white" }}>
              <label style={{ marginRight: "15px", fontSize: "19px" }}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === "admin"}
                  onChange={(e) => setRole(e.target.value)}
                />{" "}
                Admin
              </label>

              <label style={{ marginRight: "15px", fontSize: "19px" }}>
                <input
                  type="radio"
                  name="role"
                  value="manager"
                  checked={role === "manager"}
                  onChange={(e) => setRole(e.target.value)}
                />{" "}
                Manager
              </label>

              <label style={{ fontSize: "19px" }}>
                <input
                  type="radio"
                  name="role"
                  value="worker"
                  checked={role === "worker"}
                  onChange={(e) => setRole(e.target.value)}
                />{" "}
                Worker
              </label>
            </div>

            <form onSubmit={handleLogin}>
              {role === "admin" && (
                <>
                  <input
                    type="email"
                    placeholder="Enter Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />

                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={inputStyle}
                    />
                    <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>
                      {showPassword ? "🙈" : "👁️"}
                    </span>
                  </div>
                </>
              )}

              {role === "manager" && (
                <>
                  <select
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                      ...inputStyle,
                      width: "100%",
                      color: name ? "white" : "gray",
                    }}
                  >
                    <option value="">Select Site</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Japuriya">Japuriya</option>
                    <option value="Vaishali">Vaishali</option>
                    <option value="Faridabad">Faridabad</option>
                     {/* <option value="w">w</option> */}
                  </select>

                  <div style={{ position: "relative" }}>
                    <input
                      type={"text"}
                      placeholder="Enter Contact Number"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                </>
              )}

              {role === "worker" && (
                <>
                  <input
                    type="text"
                    placeholder="Enter Worker Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={inputStyle}
                  />

                  <div style={{ position: "relative" }}>
                    <input
                      type={"text"}
                      placeholder="Enter Contact Number"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>
                </>
              )}
<ReCAPTCHA
  sitekey="6Le4zmcsAAAAAIT4l3JLSicblw3j-KmCu6Lllxdz"
  onChange={(token) => setCaptchaToken(token)}
/>
              <button type="submit" style={buttonStyle}>
                Login
              </button>

              <button
                type="button"
                style={backBtn}
                onClick={() => setStep("select")}
              >
                Back
              </button>
            </form>
          </>
        )}



        {step === "vendor" && (
          <>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
              <button
                style={{
                  ...selectBtn,
                  width: "48%",
                  backgroundColor: vendorMode === "login" ? "#007bff" : "#837272",
                }}
                onClick={() => setVendorMode("login")}
              >
                Login
              </button>

              <button
                style={{
                  ...selectBtn,
                  width: "48%",
                  backgroundColor: vendorMode === "register" ? "#007bff" : "#837272",
                }}
                onClick={() => setVendorMode("register")}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleLogin}>


              {vendorMode === "login" && (
                <>
                  <input placeholder="Contact Number" value={contactNo}
                    style={inputStyle} onChange={(e) => setContactNo(e.target.value)} />
                  <input
                    type="password" placeholder="Password" style={inputStyle} value={password}
                    onChange={(e) => setPassword(e.target.value)} />

                </>
              )}



              {vendorMode === "register" && (
                <>
                  {/* Row 1 */}
                  <div style={rowStyle}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={halfInput}
                    />

                    <input
                      type="text"
                      placeholder="Company Name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      style={halfInput}
                    />

                  </div>


                  {/* Row 2 */}
                  <div style={rowStyle}>
                    <input
                      type="text"
                      placeholder="Contact Number"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      required
                      style={halfInput}
                    />

                    <input
                      type="text"
                      placeholder="Aadhar Number"
                      maxLength="12"
                      required
                      value={aadhar}
                      onChange={(e) => setAadhar(e.target.value)}
                      style={halfInput}
                    />
                  </div>

                  {/* Row 3 */}
                  <div style={rowStyle}>
                    <input
                      type="text"
                      placeholder="PAN Number"
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
                      required
                      style={halfInput}
                    />

                    <input
                      type="text"
                      placeholder="GST Number (Optional)"
                      value={gst}
                      onChange={(e) => setGst(e.target.value)}
                      style={halfInput}
                    />
                  </div>

                  {/* Row 4 */}
                  <div style={rowStyle}>
                    <select
                      required
                      value={vendorType}
                      onChange={(e) => setVendorType(e.target.value)}
                      style={{
                        marginTop: "2px",
                        background: "black",
                        fontSize: "17px",
                        color: "white",
                        marginRight: "0px",
                        width: "100%",
                      }}
                    >
                      <option value="">Vendor Type</option>
                      <option value="supply">Supply</option>
                      <option value="work">Work</option>
                    </select>

                    <select
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        marginTop: "2px",
                        background: "black",
                        fontSize: "17px",
                        color: "white",
                        marginRight: "0px",
                        width: "100%",
                      }}
                    >
                      <option value="">Category</option>

                      {vendorType === "supply" && (
                        <>
                          <option>Aggregate</option>
                          <option>Sand</option>
                          <option>Cement</option>
                          <option>Hardware</option>
                          <option>Tiles</option>
                          <option>Steel</option>
                          <option>Paints</option>
                          <option>Wood</option>
                          <option>Glass</option>
                          <option>Other</option>
                        </>
                      )}

                      {vendorType === "work" && (
                        <>
                          <option>Electrical</option>
                          <option>Civil</option>
                          <option>Plumbing</option>
                          <option>Carpentry</option>
                          <option>Interior Work</option>
                          <option>Painting</option>
                          <option>Fabrication</option>
                          <option>Other</option>
                        </>
                      )}
                    </select>
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                  {/* Row 5 */}
                  <input
                    type="password"
                    placeholder="Create Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </>
              )}
{vendorMode === "login" && (
           <ReCAPTCHA
  sitekey="6Le4zmcsAAAAAIT4l3JLSicblw3j-KmCu6Lllxdz"
  onChange={(token) => setCaptchaToken(token)}
/>
  )}
              <div style={{ display: "flex", gap: "10px" }}>
     
                <button type="submit" style={{ ...buttonStyle, flex: 1 }}>
                  {vendorMode === "login" ? "Login" : "Register"}
                </button>

                <button
                  type="button"
                  style={{ ...backBtn, flex: 1 }}
                  onClick={() => setStep("select")}
                >
                  Back
                </button>
              </div>

            </form>
          </>
        )}
      </div>

      <style>
        {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
      </style>
    </div>
  );
}



const selectBtn = {
  width: "100%",
  padding: "12px",
  marginTop: "12px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#837272",
  color: "white",
  fontSize: "18px",
  cursor: "pointer",
};

const backBtn = {
  width: "100%",
  padding: "10px",
  marginTop: "12px",
  borderRadius: "8px",
  border: "none",
  background: "rgb(0, 123, 255)",
  color: "white",
  fontSize: "16px",
  cursor: "pointer",
};

const inputStyle = {
  width: "93%",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.3)",
  backgroundColor: "black",
  color: "white",
  outline: "none",
  fontSize: "17px",
};

const eyeStyle = {
  position: "absolute",
  right: "12px",
  top: "10px",
  cursor: "pointer",
  fontSize: "18px",
  color: "#fff",
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "15px",
  border: "none",
  borderRadius: "8px",
  backgroundColor: "#007bff",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const overlayStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0,0,0,0.6)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};

const spinnerStyle = {
  border: "6px solid #f3f3f3",
  borderTop: "6px solid #007bff",
  borderRadius: "50%",
  width: "50px",
  height: "50px",
  animation: "spin 1s linear infinite",
};
const rowStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "2px",
};

const halfInput = {
  ...inputStyle,
  width: "100%",
  marginBottom: "5px",

};

export default Login;
