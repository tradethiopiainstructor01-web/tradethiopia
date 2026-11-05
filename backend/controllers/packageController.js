const Package = require("../models/Package");
const Buyer = require("../models/Buyer");
const Seller = require("../models/Seller");

const DEFAULT_ENISRA_PACKAGES = [
  {
    packageNumber: 1,
    name: 'Enisra Package 1',
    market: 'Enisra',
    price: 2700,
    services: [
      "1 job match-making per year",
      "3 months product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media"
    ],
    description: "1 job match-making per year. 3 months product/service listing on enisra's front page. 1-year advertisement on enisra's all social media."
  },
  {
    packageNumber: 2,
    name: 'Enisra Package 2',
    market: 'Enisra',
    price: 7500,
    services: [
      "5 jobs match-making per year",
      "3 months of product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting"
    ],
    description: "5 jobs match-making per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting."
  },
  {
    packageNumber: 3,
    name: 'Enisra Package 3',
    market: 'Enisra',
    price: 12000,
    services: [
      "10 jobs matchmaking per year",
      "3 months of product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting",
      "Candidates screening (interview and examination)",
      "Promoting the company at events"
    ],
    description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening (interview and examination). Promoting the company at events."
  },
  {
    packageNumber: 4,
    name: 'Enisra Package 4',
    market: 'Enisra',
    price: 17000,
    services: [
      "10 jobs matchmaking per year",
      "3 months of product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting",
      "Candidates screening (interview and examination)",
      "Promoting the company at events",
      "Facilitating quarter or annual meeting",
      "1 professional advertisement brochure",
      "Business profile development",
      "Email marketing consultation"
    ],
    description: "10 jobs matchmaking per year. 3 months of product/service listing on enisra's front page. 1-year advertisement on enisra's all social media. Candidate shortlisting. Candidates screening. Promoting the company at events. Facilitating quarter or annual meeting. 1 brochure. Business profile development. Email marketing consultation."
  },
  {
    packageNumber: 5,
    name: 'Enisra Package 5',
    market: 'Enisra',
    price: 21000,
    services: [
      "10 jobs matchmaking per year",
      "3 months of product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting & screening",
      "Promoting the company at events",
      "Facilitating quarter or annual meeting",
      "1 professional advertisement brochure",
      "Business profile development & Email marketing consultation",
      "Annual or quarter revenue consultation",
      "Developing Pro-forma & End-to-End documentation support"
    ],
    description: "10 jobs matchmaking per year. 3 months product/service listing. 1-year advertisement. Screening, events, meetings, brochure, profile, email marketing, revenue consultation, pro-forma, end-to-end documentation."
  },
  {
    packageNumber: 6,
    name: 'Enisra Package 6',
    market: 'Enisra',
    price: 27500,
    services: [
      "10 jobs matchmaking per year",
      "3 months product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting & screening",
      "Promoting company at events",
      "Facilitating quarter or annual meeting",
      "2 professional advertisement brochures",
      "Business profile development & Email marketing consultation",
      "Annual or quarter revenue consultation",
      "Developing Pro-forma & End-to-End documentation support",
      "3 Professional video/motion graphics creation",
      "Monthly newsletter/SMS marketing to Enisra database"
    ],
    description: "10 jobs matchmaking. Product listing. 1-year ad. Screening, events, quarterly meeting, 2 brochures, profile, email marketing, revenue consultation, documentation, 3 videos, monthly marketing."
  },
  {
    packageNumber: 7,
    name: 'Enisra Package 7',
    market: 'Enisra',
    price: 34000,
    services: [
      "10 jobs matchmaking per year",
      "3 months product/service listing on enisra's front page",
      "1-year advertisement on enisra's all social media",
      "Candidate shortlisting & screening",
      "Promoting company at events",
      "Facilitating quarter or annual meeting",
      "3 professional advertisement brochures",
      "Business profile development & Email marketing consultation",
      "Annual or quarter revenue consultation",
      "Developing Pro-forma & End-to-End documentation support",
      "5 Professional video/motion graphics creation",
      "Monthly newsletter/SMS marketing to Enisra database",
      "Dedicated HR & Marketing account manager"
    ],
    description: "Complete Enterprise Enisra Package with dedicated HR & Marketing account manager, 5 videos, 3 brochures, all listings, meetings and matchmaking."
  },
  {
    packageNumber: 8,
    name: 'Enisra Package 8',
    market: 'Enisra',
    price: 42000,
    services: [
      "Unlimited job match-making per year",
      "12 months featured banner on Enisra",
      "Full suite omni-channel advertisement",
      "Executive candidate headhunting",
      "Custom corporate event sponsor showcase",
      "Full branding & marketing package",
      "24/7 Priority support & strategy consultations"
    ],
    description: "Unlimited job matchmaking, 12 months featured banner, full omnichannel ad, executive headhunting, custom corporate showcase, full branding, 24/7 priority support."
  }
];

const normalizeMarket = (market = '') => {
  const norm = (market || 'Local').toString().trim().toLowerCase();
  if (norm === 'international') return 'International';
  if (norm === 'enisra' || norm === 'ensra') return 'Enisra';
  return 'Local';
};

// Create
const createPackage = async (req, res) => {
  try {
    let { packageNumber, name, services, price, description, market } = req.body;
    const marketValue = normalizeMarket(market);

    let servicesArray = [];
    if (Array.isArray(services)) {
      servicesArray = services.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof services === 'string') {
      servicesArray = services.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }

    if (servicesArray.length === 0) {
      servicesArray = [description || `Package ${packageNumber || 1}`];
    }

    let parsedNum = parseInt(packageNumber, 10);
    if (!parsedNum || Number.isNaN(parsedNum)) {
      const highest = await Package.findOne({ market: marketValue }).sort({ packageNumber: -1 });
      parsedNum = highest ? (highest.packageNumber + 1) : 1;
    }

    const pkg = new Package({
      packageNumber: parsedNum,
      name: name || (marketValue === 'Enisra' ? `Enisra Package ${parsedNum}` : `Package ${parsedNum}`),
      services: servicesArray,
      price: Number(price) || 0,
      description: description || servicesArray.join(', '),
      market: marketValue
    });

    const saved = await pkg.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// List
const listPackages = async (req, res) => {
  try {
    const filter = {};
    if (req.query.market) {
      filter.market = normalizeMarket(req.query.market);
    }

    // Auto-seed Enisra default packages if queried and none exist yet
    if (filter.market === 'Enisra') {
      const enisraCount = await Package.countDocuments({ market: 'Enisra' });
      if (enisraCount === 0) {
        try {
          await Package.insertMany(DEFAULT_ENISRA_PACKAGES);
        } catch (seedErr) {
          console.warn('Auto-seed Enisra packages note:', seedErr.message);
        }
      }
    }

    const pkgs = await Package.find(filter).sort({ market: 1, packageNumber: 1 });
    const normalizedPkgs = pkgs.map(p => {
      const obj = p.toObject ? p.toObject() : { ...p };
      if (!obj.name) {
        obj.name = obj.market === 'Enisra' ? `Enisra Package ${obj.packageNumber}` : `Package ${obj.packageNumber}`;
      }
      return obj;
    });
    res.json(normalizedPkgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get package by package number
const getPackageByNumber = async (req, res) => {
  try {
    const { packageNumber } = req.params;
    const marketValue = normalizeMarket(req.query.market || "Local");
    const parsedNumber = parseInt(packageNumber, 10);
    if (Number.isNaN(parsedNumber)) {
      return res.status(400).json({ message: "Invalid package number" });
    }
    const pkg = await Package.findOne({ packageNumber: parsedNumber, market: marketValue });
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get package analytics for dashboard
const getPackageAnalytics = async (_req, res) => {
  try {
    const packages = await Package.find().sort({ packageNumber: 1 });
    
    const buyers = await Buyer.find({}, 'packageType');
    const sellers = await Seller.find({}, 'packageType');
    
    const allCustomers = [...buyers, ...sellers];
    
    const packageCounts = {};
    allCustomers.forEach(customer => {
      if (customer.packageType) {
        packageCounts[customer.packageType] = (packageCounts[customer.packageType] || 0) + 1;
      }
    });
    
    const packageDistribution = packages.map(pkg => ({
      package: pkg.packageNumber.toString(),
      count: packageCounts[pkg.packageNumber] || 0,
      price: pkg.price
    }));
    
    const totalRevenue = packageDistribution.reduce((total, pkg) => {
      return total + (pkg.count * pkg.price);
    }, 0);
    
    const popularPackages = [...packageDistribution]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    res.json({
      packageDistribution,
      totalRevenue,
      popularPackages,
      totalCustomers: allCustomers.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { packageNumber, name, services, price, description, market } = req.body;
    
    const updateData = {};
    if (packageNumber !== undefined) updateData.packageNumber = Number(packageNumber);
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) updateData.price = Number(price);
    if (description !== undefined) updateData.description = description;
    if (market !== undefined) updateData.market = normalizeMarket(market);

    if (services !== undefined) {
      if (Array.isArray(services)) {
        updateData.services = services.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof services === 'string') {
        updateData.services = services.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
      }
    }

    const updated = await Package.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Package not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete
const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Package.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Package not found" });
    res.json({ message: "Package deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createPackage,
  listPackages,
  getPackageByNumber,
  getPackageAnalytics,
  updatePackage,
  deletePackage,
  DEFAULT_ENISRA_PACKAGES
};
