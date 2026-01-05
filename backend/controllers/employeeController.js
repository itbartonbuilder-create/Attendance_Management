import Employee from "../models/employeeModel.js";

export const addEmployee = async (req, res) => {
  try {
    const {
      name,
      role,
      site,
      contactNo,
      aadhaarNumber,
      panNumber,
      salary,
    } = req.body;

    const employee = new Employee({
      name,
      role,
      site,
      contactNo,
      aadhaarNumber,
      panNumber,
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

export const getEmployees = async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
};

export const deleteEmployee = async (req, res) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.json({ message: "Employee Deleted" });
};
