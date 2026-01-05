import React, { useEffect, useState } from "react";
import axios from "axios";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    name: "",
    role: "",
    site: "",
    contactNo: "",
    aadhaarNumber: "",
    panNumber: "",
    salary: "",
  });

  const [aadhaar, setAadhaar] = useState(null);
  const [pan, setPan] = useState(null);

  const fetchEmployees = async () => {
    const res = await axios.get("https://attendance-management-backend-vh2w.onrender.com/api/employees");
    setEmployees(res.data.employees); 
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const submitHandler = async () => {
    const data = new FormData();
    Object.keys(form).forEach((key) => data.append(key, form[key]));
    data.append("aadhaar", aadhaar);
    data.append("pan", pan);

    await axios.post("https://attendance-management-backend-vh2w.onrender.com/api/employees", data);
    fetchEmployees();
  };

  return (
    <div className="page" style={{ paddingTop: "120px" }}>
      <h2>Employees</h2>

      <input placeholder="Name" onChange={(e)=>setForm({...form,name:e.target.value})}/>
      <input placeholder="Role" onChange={(e)=>setForm({...form,role:e.target.value})}/>
      <input placeholder="Site" onChange={(e)=>setForm({...form,site:e.target.value})}/>
      <input placeholder="Contact" onChange={(e)=>setForm({...form,contactNo:e.target.value})}/>
      <input placeholder="Aadhaar No" onChange={(e)=>setForm({...form,aadhaarNumber:e.target.value})}/>
      <input placeholder="PAN No" onChange={(e)=>setForm({...form,panNumber:e.target.value})}/>
      <input placeholder="Salary" onChange={(e)=>setForm({...form,salary:e.target.value})}/>

      <input type="file" onChange={(e)=>setAadhaar(e.target.files[0])}/>
      <input type="file" onChange={(e)=>setPan(e.target.files[0])}/>

      <button onClick={submitHandler}>Add Employee</button>

      <hr />

      {Array.isArray(employees) &&
        employees.map((emp) => (
          <div key={emp._id}>
            {emp.name} – {emp.role} – {emp.site}
            <button onClick={()=>axios.delete(`https://attendance-management-backend-vh2w.onrender.com/api/employees/${emp._id}`).then(fetchEmployees)}>
              Delete
            </button>
          </div>
        ))}
    </div>
  );
}

export default Employees;
