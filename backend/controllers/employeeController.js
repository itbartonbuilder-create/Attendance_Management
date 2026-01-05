import Employee from "../models/employeeModel.js";

// Add Employee
export const addEmployee = async (req, res) => {
  try {
    const { name, role, site, contactNo, salary } = req.body;

    const employee = new Employee({
      name,
      role,
      site,
      contactNo,
      salary,
      aadhaarDoc: req.files?.aadhaar?.[0]?.path,
      panDoc: req.files?.pan?.[0]?.path,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Employees
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Employee
export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    employee.name = req.body.name;
    employee.role = req.body.role;
    employee.site = req.body.site;
    employee.contactNo = req.body.contactNo;
    employee.salary = req.body.salary;

    if (req.files?.aadhaar?.[0]?.path) employee.aadhaarDoc = req.files.aadhaar[0].path;
    if (req.files?.pan?.[0]?.path) employee.panDoc = req.files.pan[0].path;

    await employee.save();
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Employee
export const deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "Employee Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
