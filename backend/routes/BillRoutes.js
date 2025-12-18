router.get("/", async (req, res) => {
  try {
    const { role, site, manager } = req.query;
    let filter = {};

  
    if (role === "manager") {
      filter.site = site;
      filter.sentTo = manager;
    }

    const bills = await Bill.find(filter).sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching bills" });
  }
});
