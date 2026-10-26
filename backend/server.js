
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3091;

app.use(cors());
app.use(express.json());

// Mock employee data for the examination.
// Data is stored in memory and resets when the server restarts.
let employees = [
  { id: 2001, name: "John Smith", position: "Manager", status: "Active", salary: 55000 },
  { id: 2002, name: "Mary Johnson", position: "Accountant", status: "Active", salary: 32000 },
  { id: 2003, name: "David Brown", position: "HR Officer", status: "On Leave", salary: 28000 },
  { id: 2004, name: "Sarah Wilson", position: "Developer", status: "Active", salary: 45000 },
  { id: 2005, name: "Michael Davis", position: "Support Officer", status: "Active", salary: 22000 }
];

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HR Manager & Salary Analytics API is running"
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "password123") {
    return res.status(200).json({
      success: true,
      token: "mock-jwt-token"
    });
  }

  return res.status(401).json({
    success: false,
    message: "Invalid username or password"
  });
});

// Get all employees
app.get("/api/employees", (req, res) => {
  res.json({
    success: true,
    employees
  });
});

// Add employee

app.post("/api/employees", (req, res) => {
  const { name, position, salary } = req.body;

  // ตรวจสอบว่ามีข้อมูลครบและไม่ใช่ช่องว่าง
  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof position !== "string" ||
    position.trim() === "" ||
    salary === undefined ||
    salary === null ||
    String(salary).trim() === ""
  ) {
    return res.status(400).json({
      success: false,
      message: "Name, position, and salary are required."
    });
  }

  // ตรวจสอบว่าเงินเดือนเป็นตัวเลขที่ถูกต้อง
  const numericSalary = Number(salary);

  if (!Number.isFinite(numericSalary) || numericSalary < 0) {
    return res.status(400).json({
      success: false,
      message: "Salary must be a valid non-negative number."
    });
  }

  const newEmployee = {
    id: Math.max(2000, ...employees.map(e => Number(e.id) || 0)) + 1,
    name: name.trim(),
    position: position.trim(),
    status: "Active",
    salary: numericSalary
  };

  employees.push(newEmployee);

  return res.status(201).json({
    success: true,
    employee: newEmployee
  });
});

// Toggle employee status
app.put("/api/employees/:id/status", (req, res) => {
  const employee = employees.find(
    (item) => String(item.id) === String(req.params.id)
  );

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found"
    });
  }

  employee.status =
    employee.status === "Active" ? "On Leave" : "Active";

  res.json({
    success: true,
    employee
  });
});

// Delete employee
app.delete("/api/employees/:id", (req, res) => {
  const index = employees.findIndex(
    (item) => String(item.id) === String(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Employee not found"
    });
  }

  const deletedEmployee = employees.splice(index, 1)[0];

  res.json({
    success: true,
    employee: deletedEmployee
  });
});

// K-Means clustering for employee salaries (K = 2)
app.get("/api/employees/salary-clusters", (req, res) => {
  if (employees.length < 2) {
    return res.status(400).json({
      success: false,
      message: "At least two employees are required for K-Means clustering"
    });
  }

  const salaries = employees.map((employee) => employee.salary);

  // Initialize two centroids using the minimum and maximum salaries.
  let centroids = [
    Math.min(...salaries),
    Math.max(...salaries)
  ];

  let assignments = [];
  const maxIterations = 100;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    assignments = salaries.map((salary) => {
      const distanceToFirst = Math.abs(salary - centroids[0]);
      const distanceToSecond = Math.abs(salary - centroids[1]);

      return distanceToFirst <= distanceToSecond ? 0 : 1;
    });

    const nextCentroids = centroids.map((oldCentroid, clusterIndex) => {
      const clusterSalaries = salaries.filter(
        (_, index) => assignments[index] === clusterIndex
      );

      if (clusterSalaries.length === 0) {
        return oldCentroid;
      }

      return clusterSalaries.reduce((sum, salary) => sum + salary, 0)
        / clusterSalaries.length;
    });

    const converged = nextCentroids.every(
      (centroid, index) => Math.abs(centroid - centroids[index]) < 0.001
    );

    centroids = nextCentroids;

    if (converged) {
      break;
    }
  }

  // Sort clusters by centroid so Tier 1 is the lower-salary group.
  const clusterOrder = centroids
    .map((centroid, index) => ({ centroid, index }))
    .sort((a, b) => a.centroid - b.centroid);

  const clusters = clusterOrder.map((item, index) => {
    const members = employees.filter(
      (_, employeeIndex) => assignments[employeeIndex] === item.index
    );

    return {
      group: `Tier ${index + 1}`,
      centroid: Number(item.centroid.toFixed(2)),
      count: members.length
    };
  });

  res.json({
    success: true,
    clusters
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`HR Manager API running on port ${PORT}`);
});
