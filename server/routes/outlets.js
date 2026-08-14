import { Router } from "express";

const router = Router();

// TODO(db): replace with a real Outlets table (spec §5.2 schema).
export const OUTLETS = [
  {
    id: "grace-nerul",
    name: "Grace Nerul",
    address: "Shop No. 13, Type Building, F-2, Opp. Bank of Maharashtra, Nerul East, Sector 3, Nerul, Navi Mumbai, Maharashtra 400706",
    lat: 19.0330,
    lng: 73.0190,
    city: "Navi Mumbai",
  },
  {
    id: "achayans-nerul",
    name: "Achayans Nerul",
    address: "15, Jagadguru Chandrasekhara Saraswathi Marg, NL-6, Sector 15, Nerul, Navi Mumbai, Maharashtra 400706",
    lat: 19.0350,
    lng: 73.0155,
    city: "Navi Mumbai",
  },
  {
    id: "grace-kharghar",
    name: "Grace Kharghar",
    address: "Shop No. 15, Goodwill Paradise, Plot 24, Near D-Mart, Gharkul, Sector 15, Kharghar, Panvel, Maharashtra 410210",
    lat: 19.0474,
    lng: 73.0669,
    city: "Navi Mumbai",
  },
];

// GET /api/outlets
router.get("/", (_req, res) => {
  res.json(OUTLETS);
});

export default router;
