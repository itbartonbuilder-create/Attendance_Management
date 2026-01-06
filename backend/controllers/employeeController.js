import Employee from "../models/employeeModel.js";

// ================= ADD EMPLOYEE =================
export const addEmployee = async (req, res) => {
  try {
    const { name, role, site, contactNo, salary } = req.body;

    // 🔥 Normalize paths (Windows + Linux safe)
    const aadhaarPath = req.files?.aadhaar?.[0]?.path
      ? req.files.aadhaar[0].path.replace(/\\/g, "/")
      : null;

    const panPath = req.files?.pan?.[0]?.path
      ? req.files.pan[0].path.replace(/\\/g, "/")
      : null;

    const employee = new Employee({
      name,
      role,
      site,
      contactNo,
      salary,
      aadhaarDoc: aadhaarPath,
      panDoc: panPath,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    console.error("Add Employee Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ALL EMPLOYEES =================
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error("Get Employees Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= UPDATE EMPLOYEE =================
export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const { name, role, site, contactNo, salary } = req.body;

    employee.name = name;
    employee.role = role;
    employee.site = site;
    employee.contactNo = contactNo;
    employee.salary = salary;

    // 🔥 Normalize updated files (if provided)
    if (req.files?.aadhaar?.[0]?.path) {
      employee.aadhaarDoc = req.files.aadhaar[0].path.replace(/\\/g, "/");
    }

    if (req.files?.pan?.[0]?.path) {
      employee.panDoc = req.files.pan[0].path.replace(/\\/g, "/");
    }

    await employee.save();
    res.json(employee);
  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ================= DELETE EMPLOYEE =================
export const deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee Deleted Successfully" });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    res.status(500).json({ message: error.message });
  }
};
