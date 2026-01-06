import Employee from "../models/employeeModel.js";
import cloudinary from "../utils/cloudinary.js";

/* ================= ADD EMPLOYEE ================= */
export const addEmployee = async (req, res) => {
  try {
    const { name, role, site, contactNo, salary } = req.body;

    const aadhaarFile = req.files?.aadhaar?.[0];
    const panFile = req.files?.pan?.[0];

    const employee = new Employee({
      name,
      role,
      site,
      contactNo,
      salary,
      aadhaarDoc: aadhaarFile
        ? { url: aadhaarFile.path, public_id: aadhaarFile.filename }
        : null,
      panDoc: panFile
        ? { url: panFile.path, public_id: panFile.filename }
        : null,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET EMPLOYEES ================= */
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE EMPLOYEE ================= */
export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const { name, role, site, contactNo, salary } = req.body;

    employee.name = name;
    employee.role = role;
    employee.site = site;
    employee.contactNo = contactNo;
    employee.salary = salary;

    const aadhaarFile = req.files?.aadhaar?.[0];
    const panFile = req.files?.pan?.[0];

    // 🔥 Delete old Aadhaar if new uploaded
    if (aadhaarFile && employee.aadhaarDoc?.public_id) {
      await cloudinary.uploader.destroy(employee.aadhaarDoc.public_id);
      employee.aadhaarDoc = {
        url: aadhaarFile.path,
        public_id: aadhaarFile.filename,
      };
    }

    // 🔥 Delete old PAN if new uploaded
    if (panFile && employee.panDoc?.public_id) {
      await cloudinary.uploader.destroy(employee.panDoc.public_id);
      employee.panDoc = {
        url: panFile.path,
        public_id: panFile.filename,
      };
    }

    await employee.save();
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE EMPLOYEE ================= */
export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    if (employee.aadhaarDoc?.public_id) {
      await cloudinary.uploader.destroy(employee.aadhaarDoc.public_id);
    }

    if (employee.panDoc?.public_id) {
      await cloudinary.uploader.destroy(employee.panDoc.public_id);
    }

    await employee.deleteOne();
    res.json({ message: "Employee Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
