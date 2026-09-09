import { ErrorRecord, Employee } from "../types";

export const DEMO_SANDBOX_DEALERSHIP_NAME = "Mercedes-Benz Dealer Operations";
export const DEMO_SANDBOX_KEY = "ASP-MB-LIVE";

export const DEMO_SANDBOX_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Alex Cajas", email: "Alex@mbrvc.com", role: "Technician" },
  { id: "e2", name: "Anthony Serrao", email: "Anthony@mbrvc.com", role: "Technician" },
  { id: "e3", name: "Andy Velasco", email: "Andy@mbrvc.com", role: "Technician" },
  { id: "e4", name: "Arnol Montoya", email: "Arnol@mbrvc.com", role: "Technician" },
  { id: "e5", name: "Tysheen Cox-Cadet", email: "Tysheen@mbrvc.com", role: "Technician" },
  { id: "e6", name: "Blake Ramjohn", email: "Blake@mbrvc.com", role: "Technician" },
  { id: "e7", name: "Brandon LaFroscia", email: "Brandon@mbrvc.com", role: "Technician" },
  { id: "e8", name: "Darren Cowie", email: "Darren@mbrvc.com", role: "Technician" },
  { id: "e9", name: "Dylan Campbell", email: "Dylan@mbrvc.com", role: "Technician" },
  { id: "e10", name: "Edwin Torres", email: "Edwin@mbrvc.com", role: "Technician" },
  { id: "e11", name: "Erick Herrera", email: "Erick@mbrvc.com", role: "Technician" },
  { id: "e12", name: "Hayden Delack", email: "Hayden@mbrvc.com", role: "Technician" },
  { id: "e13", name: "Jesse Singh", email: "Jesse@mbrvc.com", role: "Technician" },
  { id: "e14", name: "Johnier Fernandez", email: "Johnier@mbrvc.com", role: "Technician" },
  { id: "e15", name: "Justin Boodhoo", email: "Justin@mbrvc.com", role: "Technician" },
  { id: "e16", name: "Kevin Saab", email: "Kevin@mbrvc.com", role: "Technician" },
  { id: "e17", name: "Kevin Saravia", email: "Kevin@mbrvc.com", role: "Technician" },
  { id: "e18", name: "Louie Malpeli", email: "Louie@mbrvc.com", role: "Technician" },
  { id: "e19", name: "Luis Espinoza", email: "Luis@mbrvc.com", role: "Technician" },
  { id: "e20", name: "Luis Lazo", email: "Luis@mbrvc.com", role: "Technician" },
  { id: "e21", name: "Marcos Benicio", email: "Marcos@mbrvc.com", role: "Technician" },
  { id: "e22", name: "Mario Tapia-Ramos", email: "Mario@mbrvc.com", role: "Technician" },
  { id: "e23", name: "Mathurin Jean-Baptiste", email: "Mathurin@mbrvc.com", role: "Technician" },
  { id: "e24", name: "Matthew Valardo", email: "Matthew@mbrvc.com", role: "Technician" },
  { id: "e25", name: "Nick Samaroo", email: "Nick@mbrvc.com", role: "Technician" },
  { id: "e26", name: "Rakesh Campbell", email: "Rakesh@mbrvc.com", role: "Technician" },
  { id: "e27", name: "Ricardy Gaudin", email: "Ricardy@mbrvc.com", role: "Technician" },
  { id: "e28", name: "Rick Grimes", email: "Rick@mbrvc.com", role: "Technician" },
  { id: "e29", name: "Roosevelt Francois", email: "Roosevelt@mbrvc.com", role: "Technician" },
  { id: "e30", name: "Ryan Murad", email: "Ryan@mbrvc.com", role: "Technician" },
  { id: "e31", name: "Ryan Schlegel", email: "Ryan@mbrvc.com", role: "Technician" },
  { id: "e32", "name": "Safraz Deokinanan", email: "Safraz@mbrvc.com", role: "Technician" },
  { id: "e33", name: "Samuel Bautista", email: "Samuel@mbrvc.com", role: "Technician" },
  { id: "e34", name: "Sanjay Ramnarine", email: "Sanjay@mbrvc.com", role: "Technician" },
  { id: "e35", name: "Santos Nunez", email: "Santos@mbrvc.com", role: "Technician" },
  { id: "e36", name: "Sean Achang-Joseph", email: "Sean@mbrvc.com", role: "Technician" },
  { id: "e37", name: "Steven Centeno", email: "Steven@mbrvc.com", role: "Technician" },
  { id: "e38", name: "William Ali", email: "William@mbrvc.com", role: "Technician" },
  { id: "e39", name: "Duane Bloise", email: "Duane@mbrvc.com", role: "Technician" },
  { id: "e39_a", name: "Robert Yahn", email: "Robert.Yahn@mbrvc.com", role: "Technician" },
  { id: "e39_b", name: "Brandon Valenti", email: "Brandon.Valenti@mbrvc.com", role: "Technician" },
  { id: "e40", name: "Billy Bambino", email: "Billy@mbrvc.com", role: "ShopForeman" },
  { id: "e41", name: "Dominic Bruno", email: "Dominic@mbrvc.com", role: "ShopForeman" },
  { id: "e42", name: "Ruth Weinreb", email: "Ruth@mbrvc.com", role: "ServiceAdvisor" },
  { id: "e43", name: "Andrew Jean", email: "Andrew@mbrvc.com", role: "ServiceAdvisor" },
  { id: "e44", name: "George Jimenez", email: "George@mbrvc.com", role: "ServiceAdvisor" },
  { id: "e45", name: "Anthony Angelo", email: "Anthony@mbrvc.com", role: "ServiceAdvisor" },
  { id: "e46", name: "Kevin Cunningham", email: "Kevin@mbrvc.com", role: "ServiceAdvisor" },
  { id: "e47", name: "Justin Ferguson", email: "Justin@mbrvc.com", role: "ServiceAdvisor" },
  { id: "e48", name: "Bryan Aguilera", email: "Bryan@mbrvc.com", role: "ServiceAdvisor" },
  { id: "e49", name: "Lesley Chesney", email: "Lesley@mbrvc.com", role: "ServiceAdvisor" },
  { id: "e50", name: "Amanda Plywacz", email: "Amanda@mbrvc.com", role: "Manager" },
  { id: "e51", name: "Antoinette Gordon-Hessing", email: "Antoinette@mbrvc.com", role: "Manager" },
  { id: "e52", name: "Vinny Ruggieri", email: "Vinny@mbrvc.com", role: "Manager" },
  { id: "e53", name: "Rich Clendenning", email: "Rich@mbrvc.com", role: "Manager" },
  { id: "e54", name: "Laith Miller", email: "Laith@mbrvc.com", role: "Manager" },
  { id: "e55", name: "Shaun Weissman", email: "Shaun@mbrvc.com", role: "Manager" },
  { id: "e56", name: "Jonathan Strahl", email: "Jonathan@mbrvc.com", role: "Manager" },
  { id: "e57", name: "Cary Weinstein", email: "Cary@mbrvc.com", role: "Manager" },
  { id: "e58", name: "David Meyer", email: "David@mbrvc.com", role: "Manager" },
  { id: "e59", name: "Luanne Saracco", email: "Luanne@mbrvc.com", role: "Manager" }
];

export const DEMO_DIAGNOSTIC_ALERTS: any[] = [];

export const DEMO_SANDBOX_KPIS = {
  totalExposure: "$0.00",
  verifiedRecoveries: "$0.00",
  complianceScore: "100.0%",
  activeHighRiskFlags: 0,
  auditPassRate: "100.0%",
  activePendingClaims: 0,
  resolvedClaims: 0
};

// Clean empty state - No fake records
export const DEMO_SANDBOX_RECORDS: ErrorRecord[] = [];
