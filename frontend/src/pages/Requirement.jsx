import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import API from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import companyLogo from "../assets/logo.png";


const MATERIALS = {
  Civil: [
    { name: "Cement", unit: "Bag" },
    { name: "OPC Cement", unit: "Bag" },
    { name: "PPC Cement", unit: "Bag" },
    { name: "White Cement", unit: "Bag" },

    { name: "River Sand", unit: "CFT" },
    { name: "Sand", unit: "CFT" },
    { name: "M-Sand", unit: "CFT" },
    { name: "Plaster Sand", unit: "CFT" },
    { name: "Filling Sand", unit: "CFT" },

    { name: "Bricks", unit: "Nos" },
    { name: "Red Brick", unit: "Nos" },
    { name: "Fly Ash Bricks", unit: "Nos" },
    { name: "AAC Block", unit: "Nos" },
    { name: "Concrete Block", unit: "Nos" },
    { name: "Solid Block", unit: "Nos" },

    { name: "Aggregate", unit: "CFT" },
    { name: "Aggregate 6mm", unit: "CFT" },
    { name: "Aggregate 10mm", unit: "CFT" },
    { name: "Aggregate 20mm", unit: "CFT" },
    { name: "Aggregate 40mm", unit: "CFT" },
    { name: "Stone Dust", unit: "CFT" },
    { name: "Grit", unit: "CFT" },

    { name: "PCC Material", unit: "CFT" },
    { name: "RMC", unit: "m³" },
    { name: "Concrete Admixture", unit: "Litre" },
    { name: "Admixture", unit: "Litre" },
    { name: "Plasticizer", unit: "Litre" },
    { name: "Super Plasticizer", unit: "Litre" },

    { name: "Construction Chemical", unit: "Litre" },
    { name: "Curing Compound", unit: "Litre" },
    { name: "Concrete Repair Chemical", unit: "Kg" },

    { name: "Bitumen", unit: "Kg" },
    { name: "Damp Proof Course Material", unit: "m²" },

    { name: "PVC Water Stopper", unit: "m" },
    { name: "GI Wire", unit: "Kg" },
    { name: "Binding Wire", unit: "Kg" },

    { name: "Kerb Stone", unit: "Nos" },
    { name: "Paver Block", unit: "m²" },
    { name: "Interlocking Block", unit: "m²" },

    { name: "Other", unit: "" },
  ],

  Structural: [
    { name: "TMT Bar 6mm", unit: "Kg" },
    { name: "Reinforcement 8mm", unit: "Kg" },
    { name: "Reinforcement 10mm", unit: "Kg" },
    { name: "Reinforcement 12mm", unit: "Kg" },
    { name: "Reinforcement 16mm", unit: "Kg" },
    { name: "Reinforcement 20mm", unit: "Kg" },
    { name: "Reinforcement 25mm", unit: "Kg" },
    { name: "Reinforcement 32mm", unit: "Kg" },

    { name: "Binding Wire", unit: "Kg" },
    { name: "Spacer", unit: "Nos" },
    { name: "Cover Block", unit: "Nos" },

    { name: "Structural Steel", unit: "Kg" },
    { name: "MS Plate", unit: "Kg" },
    { name: "MS Angle", unit: "Kg" },
    { name: "MS Channel", unit: "Kg" },
    { name: "MS Flat", unit: "Kg" },
    { name: "MS Pipe", unit: "Kg" },
    { name: "GI Pipe", unit: "Kg" },

    { name: "I Beam / ISMB", unit: "Kg" },
    { name: "H Beam", unit: "Kg" },
    { name: "RHS Section", unit: "Kg" },
    { name: "SHS Section", unit: "Kg" },

    { name: "Nut Bolt", unit: "Set" },
    { name: "Anchor Bolt", unit: "Nos" },
    { name: "Chemical Anchor", unit: "Nos" },

    { name: "Welding Rod", unit: "Kg" },
    { name: "Welding Wire", unit: "Kg" },
    { name: "Cutting Disc", unit: "Nos" },
    { name: "Grinding Disc", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  Shuttering: [
    { name: "Shuttering Plate", unit: "Nos" },
    { name: "MS Shuttering Plate", unit: "Nos" },
    { name: "Film Faced Plywood", unit: "Sheet" },
    { name: "Commercial Plywood", unit: "Sheet" },

    { name: "Adjustable Prop", unit: "Nos" },
    { name: "MS Pipe", unit: "Nos" },
    { name: "Tie Rod", unit: "Nos" },
    { name: "Tie Rod Nut", unit: "Nos" },
    { name: "Wing Nut", unit: "Nos" },

    { name: "Waler", unit: "Nos" },
    { name: "Soldier", unit: "Nos" },
    { name: "U Head Jack", unit: "Nos" },
    { name: "Base Jack", unit: "Nos" },
    { name: "Jack Nut", unit: "Nos" },

    { name: "PVC Cone", unit: "Nos" },
    { name: "PVC Tape", unit: "Roll" },
    { name: "Shuttering Oil", unit: "Litre" },

    { name: "Timber", unit: "CFT" },
    { name: "Wooden Batten", unit: "CFT" },
    { name: "Wooden Plank", unit: "CFT" },

    { name: "Foam Tape", unit: "Roll" },
    { name: "Plastic Sheet", unit: "Roll" },

    { name: "Scaffolding Material", unit: "Set" },
    { name: "Cuplock Material", unit: "Set" },

    { name: "Other", unit: "" },
  ],

  Masonry: [
    { name: "Red Brick", unit: "Nos" },
    { name: "Fly Ash Brick", unit: "Nos" },
    { name: "AAC Block", unit: "Nos" },
    { name: "Concrete Block", unit: "Nos" },
    { name: "Solid Block", unit: "Nos" },

    { name: "Block Jointing Mortar", unit: "Bag" },
    { name: "Cement Mortar", unit: "Bag" },
    { name: "Ready Mix Mortar", unit: "Bag" },

    { name: "Lintel Material", unit: "Set" },
    { name: "DPC Material", unit: "m" },

    { name: "GI Chicken Mesh", unit: "m" },
    { name: "Fiber Mesh", unit: "m" },
    { name: "Corner Bead", unit: "m" },

    { name: "Other", unit: "" },
  ],

  Plaster: [
    { name: "Cement", unit: "Bag" },
    { name: "Plaster Sand", unit: "CFT" },
    { name: "M-Sand", unit: "CFT" },
    { name: "Ready Mix Plaster", unit: "Bag" },
    { name: "Plaster Chemical", unit: "Litre" },
    { name: "Fiber Mesh", unit: "m" },
    { name: "GI Mesh", unit: "m" },
    { name: "Corner Bead", unit: "m" },


    { name: "Other", unit: "" },
  ],

  Flooring: [
    { name: "Vitrified Tile", unit: "m²" },
    { name: "Ceramic Tile", unit: "m²" },
    { name: "Wall Tile", unit: "m²" },
    { name: "Floor Tile", unit: "m²" },
    { name: "Anti Skid Tile", unit: "m²" },
    { name: "Parking Tile", unit: "m²" },
    { name: "Paver Block", unit: "m²" },

    { name: "Marble", unit: "m²" },
    { name: "Granite", unit: "m²" },
    { name: "Kota Stone", unit: "m²" },
    { name: "Sand Stone", unit: "m²" },

    { name: "Kitchen Platform Stone", unit: "m²" },
    { name: "Kitchen Top Stone", unit: "m²" },
    { name: "Floor Stone", unit: "m²" },

    { name: "Tile Adhesive", unit: "Bag" },
    { name: "Adhesive", unit: "Bag" },
    { name: "Araldite", unit: "Kg" },
    { name: "Tile Grout", unit: "Kg" },
    { name: "Epoxy Grout", unit: "Kg" },
    { name: "Tile Spacer", unit: "Packet" },
    { name: "Tile Leveling Clip", unit: "Packet" },

    { name: "Skirting Tile", unit: "m" },
    { name: "Stone Adhesive", unit: "Bag" },
    { name: "Silicone", unit: "Tube" },

    { name: "Other", unit: "" },
  ],

  Finishing: [
    { name: "Wall Putty", unit: "Kg" },
    { name: "Acrylic Putty", unit: "Kg" },
    { name: "Chalk Mitti", unit: "Kg" },

    { name: "Interior Primer", unit: "Litre" },
    { name: "Exterior Primer", unit: "Litre" },
    { name: "Primer", unit: "Litre" },

    { name: "Interior Emulsion Paint", unit: "Litre" },
    { name: "Exterior Emulsion Paint", unit: "Litre" },
    { name: "Enamel Paint", unit: "Litre" },
    { name: "Metal Paint", unit: "Litre" },
    { name: "Wood Paint", unit: "Litre" },

    { name: "Texture Paint", unit: "Litre" },
    { name: "Weather Coat", unit: "Litre" },

    { name: "Polish", unit: "Litre" },
    { name: "Paint Chemical", unit: "Litre" },

    { name: "Thinner", unit: "Litre" },
    { name: "Turpentine", unit: "Litre" },

    { name: "Paint Roller", unit: "Nos" },
    { name: "Paint Brush", unit: "Nos" },
    { name: "Sand Paper", unit: "Sheet" },
    { name: "Masking Tape", unit: "Roll" },

    { name: "Gypsum Board", unit: "Sheet" },
    { name: "POP", unit: "Kg" },
    { name: "PVC Panel", unit: "m²" },

    { name: "False Ceiling Material", unit: "m²" },
    { name: "Ceiling Grid", unit: "m" },

    { name: "Other", unit: "" },
  ],

  Waterproofing: [
    { name: "Waterproofing Chemical", unit: "Litre" },
    { name: "Integral Waterproofing Compound", unit: "Kg" },
    { name: "APP Membrane", unit: "Roll" },
    { name: "PVC Membrane", unit: "m²" },
    { name: "Bitumen", unit: "Kg" },
    { name: "Bitumen Primer", unit: "Litre" },
    { name: "Bituminous Coating", unit: "Kg" },

    { name: "Waterproofing Sealant", unit: "Tube" },
    { name: "PU Sealant", unit: "Tube" },
    { name: "PU Coating", unit: "Kg" },
    { name: "Protective Coating", unit: "Kg" },

    { name: "Injection Chemical", unit: "Kg" },
    { name: "Crack Filling Chemical", unit: "Kg" },

    { name: "Waterproofing Mesh", unit: "m" },
    { name: "PVC Water Stopper", unit: "m" },

    { name: "Other", unit: "" },
  ],

  Plumbing: [
    { name: "PVC Pipe", unit: "m" },
    { name: "PVC Pipe - Size Wise", unit: "m" },
    { name: "CPVC Pipe", unit: "m" },
    { name: "CPVC Pipe - Size Wise", unit: "m" },
    { name: "UPVC Pipe", unit: "m" },
    { name: "PPR Pipe", unit: "m" },
    { name: "HDPE Pipe", unit: "m" },
    { name: "GI Pipe", unit: "m" },

    { name: "Elbow", unit: "Nos" },
    { name: "Bend", unit: "Nos" },
    { name: "Tee", unit: "Nos" },
    { name: "Cross", unit: "Nos" },
    { name: "Reducer", unit: "Nos" },
    { name: "Coupler", unit: "Nos" },
    { name: "Union", unit: "Nos" },
    { name: "Flange", unit: "Nos" },

    { name: "Ball Valve", unit: "Nos" },
    { name: "Gate Valve", unit: "Nos" },
    { name: "NRV", unit: "Nos" },
    { name: "Butterfly Valve", unit: "Nos" },
    { name: "Angle Valve", unit: "Nos" },

    { name: "Tap", unit: "Nos" },
    { name: "Bib Cock", unit: "Nos" },
    { name: "Shower", unit: "Nos" },
    { name: "Health Faucet", unit: "Nos" },

    { name: "Floor Trap", unit: "Nos" },
    { name: "Nahani Trap", unit: "Nos" },
    { name: "Bottle Trap", unit: "Nos" },
    { name: "Gully Trap", unit: "Nos" },

    { name: "Solvent", unit: "Litre" },

    { name: "Teflon Tape", unit: "Roll" },
    { name: "Pipe Clamp", unit: "Nos" },
    { name: "Pipe Support", unit: "Nos" },

    { name: "Water Tank", unit: "Nos" },
    { name: "Sanitary Fixture", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  Sanitary: [
    { name: "WC / Western Toilet", unit: "Nos" },
    { name: "Indian WC", unit: "Nos" },
    { name: "Wash Basin", unit: "Nos" },
    { name: "Counter Top Basin", unit: "Nos" },
    { name: "Urinal", unit: "Nos" },
    { name: "Kitchen Sink", unit: "Nos" },
    { name: "Floor Mounted WC", unit: "Nos" },
    { name: "Wall Hung WC", unit: "Nos" },

    { name: "Flush Tank", unit: "Nos" },
    { name: "Flush Valve", unit: "Nos" },
    { name: "Health Faucet", unit: "Nos" },
    { name: "Mirror", unit: "Nos" },
    { name: "Soap Dish", unit: "Nos" },
    { name: "Towel Rod", unit: "Nos" },
    { name: "Toilet Paper Holder", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  Electrical: [
    { name: "Copper Wire 1.0mm", unit: "m" },
    { name: "Copper Wire 1.5mm", unit: "m" },
    { name: "Copper Wire 2.5mm", unit: "m" },
    { name: "Copper Wire 4mm", unit: "m" },
    { name: "Copper Wire 6mm", unit: "m" },
    { name: "Copper Wire 10mm", unit: "m" },
    { name: "Copper Wire 16mm", unit: "m" },

    { name: "Aluminium Wire", unit: "m" },
    { name: "Aluminium Cable", unit: "m" },
    { name: "Armoured Cable", unit: "m" },
    { name: "Flexible Cable", unit: "m" },

    { name: "MCB 6A", unit: "Nos" },
    { name: "MCB 10A", unit: "Nos" },
    { name: "MCB 16A", unit: "Nos" },
    { name: "MCB 20A", unit: "Nos" },
    { name: "MCB 32A", unit: "Nos" },
    { name: "MCB 63A", unit: "Nos" },

    { name: "RCCB", unit: "Nos" },
    { name: "RCBO", unit: "Nos" },
    { name: "Isolator", unit: "Nos" },
    { name: "DB", unit: "Nos" },
    { name: "MCCB", unit: "Nos" },

    { name: "Switch 1 Way", unit: "Nos" },
    { name: "Switch 2 Way", unit: "Nos" },
    { name: "Switch 6A", unit: "Nos" },
    { name: "Switch 10A", unit: "Nos" },
    { name: "Switch 16A", unit: "Nos" },
    { name: "Switch Blank", unit: "Nos" },

    { name: "Socket 1 Way", unit: "Nos" },
    { name: "Socket 2 Way", unit: "Nos" },
    { name: "Socket 6A", unit: "Nos" },
    { name: "Socket 10A", unit: "Nos" },
    { name: "Socket 16A", unit: "Nos" },
    { name: "Industrial Socket", unit: "Nos" },

    { name: "Junction Box", unit: "Nos" },
    { name: "Modular Box", unit: "Nos" },

   
    { name: "Electrical Box 2x3", unit: "Nos" },
    { name: "Electrical Box 3x3", unit: "Nos" },
    { name: "Electrical Box 4x3", unit: "Nos" },
    { name: "Electrical Box 6x3", unit: "Nos" },
    { name: "Electrical Box 8x3", unit: "Nos" },
    { name: "Electrical Box 3x2", unit: "Nos" },
    { name: "Electrical Box Custom Size", unit: "Nos" },

    { name: "MCB Box", unit: "Nos" },
    { name: "MCB Box - Universal", unit: "Nos" },

    { name: "PVC Conduit", unit: "m" },
    { name: "GI Conduit", unit: "m" },
    { name: "Flexible Conduit", unit: "m" },
    { name: "Conduiting Pipe", unit: "m" },
    { name: "Conduit Pipe", unit: "m" },
    { name: "PVC Bend", unit: "Nos" },
    { name: "Conduit Clamp", unit: "Nos" },
    { name: "PVC Box", unit: "Nos" },
    { name: "MS DB Box", unit: "Nos" },

    { name: "Cable Tray", unit: "m" },
    { name: "Cable Ladder", unit: "m" },

    { name: "Cable Lug", unit: "Nos" },
    { name: "Cable Gland", unit: "Nos" },
    { name: "Cable Tie", unit: "Packet" },

    { name: "Earthing Strip", unit: "Kg" },
    { name: "Earthing Electrode", unit: "Nos" },
    { name: "Earthing Compound", unit: "Bag" },
    { name: "Earth Pit Material", unit: "Set" },

    { name: "LED Light", unit: "Nos" },
    { name: "Panel Light", unit: "Nos" },
    { name: "Cab Light", unit: "Nos" },
    { name: "Strip Light", unit: "Nos" },
    { name: "Rope Light", unit: "Nos" },
    { name: "Track Light", unit: "Nos" },
    { name: "Tube Light", unit: "Nos" },
    { name: "Flood Light", unit: "Nos" },
    { name: "Down Light", unit: "Nos" },
    { name: "Ceiling Light", unit: "Nos" },

    { name: "Ceiling Fan", unit: "Nos" },
    { name: "Exhaust Fan", unit: "Nos" },

    { name: "Light Adaptor", unit: "Nos" },
    { name: "Light Joiner", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  FireFighting: [
    { name: "MS Fire Pipe", unit: "m" },
    { name: "GI Fire Pipe", unit: "m" },
    { name: "Fire Pipe Elbow", unit: "Nos" },
    { name: "Fire Pipe Tee", unit: "Nos" },
    { name: "Fire Pipe Reducer", unit: "Nos" },
    { name: "Fire Valve", unit: "Nos" },
    { name: "Butterfly Valve", unit: "Nos" },
    { name: "Check Valve", unit: "Nos" },
    { name: "Landing Valve", unit: "Nos" },
    { name: "Fire Hose", unit: "m" },
    { name: "Fire Hose Reel", unit: "Nos" },
    { name: "Fire Extinguisher", unit: "Nos" },
    { name: "Fire Alarm Cable", unit: "m" },
    { name: "Smoke Detector", unit: "Nos" },
    { name: "Heat Detector", unit: "Nos" },
    { name: "Manual Call Point", unit: "Nos" },
    { name: "Fire Alarm Panel", unit: "Nos" },
    { name: "Sprinkler", unit: "Nos" },
    { name: "Fire Pump", unit: "Nos" },
    { name: "Jockey Pump", unit: "Nos" },
    { name: "Fire Tank Material", unit: "Set" },
    { name: "Fire Signage", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  HVAC: [
    { name: "GI Duct", unit: "m²" },
    { name: "GI Sheet", unit: "Kg" },
    { name: "Duct Insulation", unit: "m²" },
    { name: "Duct Flange", unit: "m" },
    { name: "Flexible Duct", unit: "m" },

    
    { name: "Copper Refrigerant Pipe", unit: "m" },
    { name: "Copper Pipe", unit: "m" },
    { name: "Copper Pipe - Feet", unit: "ft" },
    { name: "Copper Pipe - Roll", unit: "Roll" },

    { name: "AC Pipe Insulation", unit: "m" },
    { name: "Insulation Material", unit: "m" },
    { name: "AC Pipe Clamp", unit: "Nos" },
    { name: "AC Pipe Support", unit: "Nos" },

    { name: "Drain Pipe", unit: "m" },
    { name: "AC Unit", unit: "Nos" },
    { name: "AHU", unit: "Nos" },
    { name: "FCU", unit: "Nos" },
    { name: "Diffuser", unit: "Nos" },
    { name: "Grille", unit: "Nos" },
    { name: "Damper", unit: "Nos" },
    { name: "Thermostat", unit: "Nos" },
    { name: "Ventilation Fan", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  Aluminium: [
    { name: "Aluminium Section", unit: "Kg" },
    { name: "Aluminium Frame", unit: "m" },
    { name: "Aluminium Tube", unit: "m" },
    { name: "Sliding Track", unit: "m" },
    { name: "Aluminium Window", unit: "Nos" },
    { name: "Aluminium Door", unit: "Nos" },

    { name: "Glass", unit: "m²" },
    { name: "Toughened Glass", unit: "m²" },
    { name: "Laminated Glass", unit: "m²" },

    { name: "Rubber Beading", unit: "m" },
    { name: "Silicone", unit: "Tube" },
    { name: "Aluminium Hardware", unit: "Set" },
    { name: "Handle", unit: "Nos" },
    { name: "Lock", unit: "Nos" },
    { name: "Roller", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  Glass: [
    { name: "Clear Glass", unit: "m²" },
    { name: "Toughened Glass", unit: "m²" },
    { name: "Laminated Glass", unit: "m²" },
    { name: "Frosted Glass", unit: "m²" },
    { name: "Reflective Glass", unit: "m²" },
    { name: "Mirror", unit: "m²" },

    { name: "Glass Silicone", unit: "Tube" },
    { name: "Glass Beading", unit: "m" },
    { name: "Glass Patch Fitting", unit: "Set" },
    { name: "Glass Door Handle", unit: "Nos" },
    { name: "Glass Door Lock", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  Carpentry: [
    { name: "Plywood", unit: "Sheet" },
    { name: "Commercial Plywood", unit: "Sheet" },
    { name: "Marine Plywood", unit: "Sheet" },
    { name: "MDF Board", unit: "Sheet" },
    { name: "HDF Board", unit: "Sheet" },
    { name: "Particle Board", unit: "Sheet" },

    { name: "Block Board", unit: "Sheet" },
    { name: "Veneer", unit: "m²" },
    { name: "Laminate", unit: "Sheet" },

    { name: "Timber", unit: "CFT" },
    { name: "Wooden Batten", unit: "CFT" },
    { name: "Wooden Frame", unit: "m" },

    { name: "Door Shutter", unit: "Nos" },
    { name: "Door Frame", unit: "Nos" },

    { name: "Hinge", unit: "Nos" },
    { name: "Door Handle", unit: "Nos" },
    { name: "Door Lock", unit: "Nos" },
    { name: "Tower Bolt", unit: "Nos" },
    { name: "Drawer Channel", unit: "Set" },

    { name: "Mica", unit: "Nos" },
    { name: "Fevicol", unit: "Litre" },
    { name: "Fevicol / Wood Adhesive", unit: "Litre" },
    { name: "Fixer", unit: "Litre" },
    { name: "Probond", unit: "Litre" },
    { name: "Hardware", unit: "Set" },

    { name: "Wood Adhesive", unit: "Kg" },
    { name: "Wood Polish", unit: "Litre" },

    { name: "Other", unit: "" },
  ],

  Fabrication: [
    { name: "MS Plate", unit: "Kg" },
    { name: "MS Angle", unit: "Kg" },
    { name: "MS Channel", unit: "Kg" },
    { name: "MS Flat", unit: "Kg" },
    { name: "MS Pipe", unit: "Kg" },
    { name: "GI Pipe", unit: "Kg" },
    { name: "GI Sheet", unit: "Kg" },

    { name: "MS Pipe - Length", unit: "m" },
    { name: "Gate Frame", unit: "Nos" },
    { name: "Gate Frame - Size Wise", unit: "Nos" },

    { name: "Welding Rod", unit: "Kg" },
    { name: "Welding Wire", unit: "Kg" },
    { name: "Cutting Disc", unit: "Nos" },
    { name: "Grinding Disc", unit: "Nos" },

    { name: "Nut Bolt", unit: "Set" },
    { name: "Anchor Bolt", unit: "Nos" },
    { name: "Chemical Anchor", unit: "Nos" },

    { name: "Screw", unit: "Packet" },
    { name: "Fastener", unit: "Nos" },
    { name: "Gitti", unit: "Packet" },

    { name: "Primer", unit: "Litre" },
    { name: "Red Oxide", unit: "Litre" },
    { name: "Enamel Paint", unit: "Litre" },

    { name: "Other", unit: "" },
  ],

  Safety: [
    { name: "Safety Helmet", unit: "Nos" },
    { name: "Safety Shoes", unit: "Pair" },
    { name: "Safety Belt", unit: "Nos" },
    { name: "Safety Harness", unit: "Nos" },
    { name: "Safety Jacket", unit: "Nos" },
    { name: "Reflective Vest", unit: "Nos" },

    { name: "Hand Gloves", unit: "Pair" },
    { name: "Safety Goggles", unit: "Nos" },
    { name: "Face Shield", unit: "Nos" },
    { name: "Dust Mask", unit: "Nos" },
    { name: "Ear Plug", unit: "Pair" },
    { name: "Ear Muff", unit: "Nos" },

    { name: "Safety Net", unit: "m²" },
    { name: "Barricade Tape", unit: "Roll" },
    { name: "Warning Board", unit: "Nos" },
    { name: "Safety Sign Board", unit: "Nos" },

    { name: "Fire Extinguisher", unit: "Nos" },
    { name: "First Aid Box", unit: "Set" },
    { name: "First Aid Material", unit: "Set" },

    { name: "Other", unit: "" },
  ],

  Tools: [
    { name: "Measuring Tape", unit: "Nos" },
    { name: "Laser Level", unit: "Nos" },
    { name: "Spirit Level", unit: "Nos" },
    { name: "Plumb Bob", unit: "Nos" },

    { name: "Hammer", unit: "Nos" },
    { name: "Chisel", unit: "Nos" },
    { name: "Spanner Set", unit: "Set" },
    { name: "Screwdriver Set", unit: "Set" },
    { name: "Pliers", unit: "Nos" },
    { name: "Pipe Wrench", unit: "Nos" },

    { name: "Drill Machine", unit: "Nos" },
    { name: "Angle Grinder", unit: "Nos" },
    { name: "Cutting Machine", unit: "Nos" },
    { name: "Welding Machine", unit: "Nos" },

    { name: "Core Cutting Machine", unit: "Nos" },
    { name: "Concrete Cutter", unit: "Nos" },
    { name: "Tile Cutter", unit: "Nos" },

    { name: "Ladder", unit: "Nos" },
    { name: "Wheel Barrow", unit: "Nos" },
    { name: "Shovel", unit: "Nos" },
    { name: "Pickaxe", unit: "Nos" },
    { name: "Crowbar", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  Machinery: [
    { name: "Concrete Mixer", unit: "Nos" },
    { name: "Concrete Vibrator", unit: "Nos" },
    { name: "Bar Cutting Machine", unit: "Nos" },
    { name: "Bar Bending Machine", unit: "Nos" },

    { name: "Dewatering Pump", unit: "Nos" },
    { name: "Water Pump", unit: "Nos" },
    { name: "Submersible Pump", unit: "Nos" },

    { name: "Generator", unit: "Nos" },
    { name: "Air Compressor", unit: "Nos" },

    { name: "Welding Machine", unit: "Nos" },
    { name: "Cutting Machine", unit: "Nos" },

    { name: "Tower Crane", unit: "Day" },
    { name: "Mobile Crane", unit: "Day" },
    { name: "Hydra", unit: "Day" },
    { name: "JCB", unit: "Day" },
    { name: "Excavator", unit: "Day" },
    { name: "Loader", unit: "Day" },

    { name: "Scaffolding", unit: "Set" },
    { name: "Lifting Equipment", unit: "Set" },

    { name: "Other", unit: "" },
  ],

  General: [
    { name: "Stationery", unit: "Nos" },
    { name: "Printing Paper", unit: "Packet" },
    { name: "Register", unit: "Nos" },
    { name: "Marker", unit: "Nos" },
    { name: "Pen", unit: "Box" },

    { name: "Cleaning Material", unit: "Set" },
    { name: "Broom", unit: "Nos" },
    { name: "Mop", unit: "Nos" },
    { name: "Dustbin", unit: "Nos" },
    { name: "Garbage Bag", unit: "Packet" },

    { name: "Drinking Water", unit: "Bottle" },
    { name: "Water Can", unit: "Nos" },

    { name: "Plastic Sheet", unit: "Roll" },
    { name: "Tarpaulin", unit: "Roll" },

    { name: "Other", unit: "" },
  ],

  SiteSetup: [
    { name: "Site Office Material", unit: "Set" },
    { name: "Site Cabin", unit: "Nos" },
    { name: "Site Store Material", unit: "Set" },
    { name: "Barricading", unit: "m" },
    { name: "GI Sheet Barricading", unit: "m" },
    { name: "Temporary Shed Material", unit: "Set" },
    { name: "Temporary Electrical Material", unit: "Set" },
    { name: "Temporary Water Line", unit: "m" },
    { name: "Site Sign Board", unit: "Nos" },
    { name: "Project Sign Board", unit: "Nos" },

    { name: "Other", unit: "" },
  ],

  QAQC: [
    { name: "Cube Mould", unit: "Nos" },
    { name: "Slump Cone", unit: "Nos" },
    { name: "Test Cylinder", unit: "Nos" },
    { name: "Measuring Cylinder", unit: "Nos" },
    { name: "Test Sample Bag", unit: "Nos" },
    { name: "Water Testing Material", unit: "Set" },
    { name: "Soil Testing Material", unit: "Set" },
    { name: "Concrete Testing Material", unit: "Set" },
    { name: "Lab Consumable", unit: "Set" },

    { name: "Other", unit: "" },
  ],

  Logistics: [
    { name: "Truck", unit: "Trip" },
    { name: "Tipper", unit: "Trip" },
    { name: "Tractor", unit: "Trip" },
    { name: "Crane", unit: "Day" },
    { name: "JCB", unit: "Day" },
    { name: "Loading Labour", unit: "Day" },
    { name: "Unloading Labour", unit: "Day" },
    { name: "Material Transportation", unit: "Trip" },

    { name: "Other", unit: "" },
  ],

  Labour: [
    { name: "Mason", unit: "Man-Day" },
    { name: "Helper", unit: "Man-Day" },
    { name: "Carpenter", unit: "Man-Day" },
    { name: "Bar Bender", unit: "Man-Day" },
    { name: "Electrician", unit: "Man-Day" },
    { name: "Plumber", unit: "Man-Day" },
    { name: "Welder", unit: "Man-Day" },
    { name: "Painter", unit: "Man-Day" },
    { name: "Tile Mason", unit: "Man-Day" },
    { name: "Fabricator", unit: "Man-Day" },
    { name: "Machine Operator", unit: "Man-Day" },

    { name: "Other", unit: "" },
  ],


  POPFalseCeiling: [
    { name: "POP", unit: "Bag" },

    { name: "Main Channel", unit: "Nos" },
    { name: "Cross Channel", unit: "Nos" },
    { name: "L Patti", unit: "Nos" },

    { name: "Ceiling Channel", unit: "Nos" },
    { name: "Ceiling Grid", unit: "m" },

    { name: "Screw", unit: "Packet" },
    { name: "GI Patti", unit: "Packet" },
    { name: "Fastener", unit: "Nos" },

    { name: "GI Channel", unit: "Nos" },
    { name: "GI Grid", unit: "Nos" },

    { name: "Sheet", unit: "Nos" },
    { name: "Hanging Wire", unit: "Kg" },

    { name: "Other", unit: "" },
  ],

  TileStone: [
    { name: "Floor Tile", unit: "m²" },
    { name: "Wall Tile", unit: "m²" },
    { name: "Tile Adhesive", unit: "Bag" },
    { name: "Adhesive", unit: "Bag" },
    { name: "Araldite", unit: "Kg" },
    { name: "Paver Block", unit: "m²" },

    { name: "Kitchen Platform Stone", unit: "m²" },
    { name: "Kitchen Top Stone", unit: "m²" },
    { name: "Floor Stone", unit: "m²" },
    { name: "White Cement", unit: "Bag" },

    { name: "Other", unit: "" },
  ],

  FrontElevation: [
    { name: "MS Pipe", unit: "m" },
    { name: "Aluminium Tube", unit: "m" },

    { name: "Screw", unit: "Packet" },
    { name: "GI Patti", unit: "Packet" },
    { name: "Fastener", unit: "Nos" },

    { name: "ACP Sheet", unit: "Sheet" },
    { name: "Louvers", unit: "m²" },

    { name: "Other", unit: "" },
  ],

  Other: [
    { name: "Other", unit: "" },
  ],
};
function Requirement() {
  const user = JSON.parse(localStorage.getItem("user"));
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const selectedDate =
    queryParams.get("date") ||
    new Date().toLocaleDateString("en-CA");
  const site = user?.site || "";
  const loggedInUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
})();
const managerName =
  loggedInUser?.name ||
  loggedInUser?.fullName ||
  loggedInUser?.username ||
  loggedInUser?.email ||
  "Manager";
  
const [category, setCategory] = useState("");

const [items, setItems] = useState([
  {
    id: `${Date.now()}_1`,
    material: "",
    customMaterial: "",
    unit: "",
    quantity: "",
  },
]);

  const [requiredDate, setRequiredDate] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [purpose, setPurpose] = useState("");

  const [requirements, setRequirements] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchRequirements = async () => {
    if (!site) return;
    try {
      const res = await API.get(
        `/requirements?site=${encodeURIComponent(site)}`
      );
      setRequirements(res.data?.data || []);

    } catch (error) {
      console.error("Requirement fetch error:", error);

    }
  };
  
const groupedRequirements = Object.values(
  requirements.reduce((groups, r) => {
    const key = r.batchId || r._id;

    if (!groups[key]) {
      groups[key] = {
        _id: key,
        batchId: r.batchId || key,
        site: r.site,
        date: r.date,
        category: r.category,
        priority: r.priority || "Normal",
        purpose: r.purpose || "",
        items: [],
        requirementIds: [],
      };
    }

    groups[key].items.push({
      material: r.material,
      unit: r.unit,
      quantity: r.quantity,
      priority: r.priority || groups[key].priority,
      purpose: r.purpose || groups[key].purpose,
    });

    groups[key].requirementIds.push(r._id);

    return groups;
  }, {})
);

  useEffect(() => {
    fetchRequirements();
  }, [site]);
 
const handleCategoryChange = (value) => {
  setCategory(value);

  setItems([
    {
      id: `${Date.now()}_1`,
      material: "",
      customMaterial: "",
      unit: "",
      quantity: "",
    },
  ]);
};

const handleMaterialChange = (id, value) => {
  const selected = MATERIALS[category]?.find(
    (m) => m.name === value
  );

  setItems((prev) =>
    prev.map((item) =>
      item.id === id
        ? {
            ...item,
            material: value,
            customMaterial: "",
            unit: selected?.unit || "",
          }
        : item
    )
  );
};

const handleItemChange = (id, field, value) => {
  setItems((prev) =>
    prev.map((item) =>
      item.id === id
        ? { ...item, [field]: value }
        : item
    )
  );
};

const addItem = () => {
  setItems((prev) => [
    ...prev,
    {
      id: `${Date.now()}_${Math.random()}`,
      material: "",
      customMaterial: "",
      unit: "",
      quantity: "",
    },
  ]);
};

const removeItem = (id) => {
  setItems((prev) => {
    if (prev.length === 1) {
      return [
        {
          id: `${Date.now()}_1`,
          material: "",
          customMaterial: "",
          unit: "",
          quantity: "",
        },
      ];
    }

    return prev.filter((item) => item.id !== id);
  });
};

  const requiredQty = items.reduce(
  (total, item) => total + Number(item.quantity || 0),
  0
);
 
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!site) {
    alert("Site not found");
    return;
  }

  if (!category) {
    alert("Please select department");
    return;
  }

  const preparedItems = items.map((item) => ({
    material:
      item.material === "Other"
        ? item.customMaterial.trim()
        : item.material,
    unit: item.unit,
    quantity: Number(item.quantity),
  }));

  const invalidItem = preparedItems.find(
    (item) =>
      !item.material ||
      !item.unit ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
  );

  if (invalidItem) {
    alert(
      "Har material ka naam, unit aur valid quantity enter karein."
    );
    return;
  }

  const batchId =
    `REQ-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;

  const data = {
    batchId,
    site,
    date: selectedDate,
    category,
    priority,
    purpose: purpose.trim(),
    items: preparedItems,
  };

  try {
    setLoading(true);

    await API.post("/requirements/batch", data);

    alert("Requirement saved successfully");

    await fetchRequirements();

    setCategory("");
    setItems([
      {
        id: `${Date.now()}_1`,
        material: "",
        customMaterial: "",
        unit: "",
        quantity: "",
      },
    ]);
    setPriority("Normal");
    setPurpose("");
  } catch (error) {
    console.error("Batch save error:", error);

    alert(
      error.response?.data?.message ||
      "Unable to save requirement batch"
    );
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async (id) => {

    const confirmDelete =
      window.confirm(
        "Delete this requirement?"
      );

    if (!confirmDelete) return;

    try {

      await API.delete(
        `/requirements/${id}`
      );

      fetchRequirements();

    } catch (error) {

      alert(
        "Unable to delete requirement"
      );
    }
  };


const downloadPDF = async (batch) => {
  if (!batch?.items?.length) {
    alert("No materials found in this requirement batch");
    return;
  }

  try {
    const doc = new jsPDF("landscape");

    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, 10, 277, 190, 4, 4, "S");

    if (companyLogo) {
      doc.addImage(companyLogo, "PNG", 14, 14, 15, 15);
    }

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("BARTONS BUILDERS LIMITED", 33, 23);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Site Name: ${batch.site || site || "N/A"}`, 283, 20, {
      align: "right",
    });

    doc.text(
      `Requirement Date: ${
        batch.date
          ? new Date(batch.date).toLocaleDateString("en-GB")
          : "N/A"
      }`,
      283,
      27,
      { align: "right" }
    );

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 44, 283, 44);

    const rows = batch.items.map((item, index) => [
      index + 1,
      item.material || "-",
      item.quantity ?? 0,
      item.unit || "-",
      item.priority || batch.priority || "Normal",
      item.purpose || batch.purpose || "-",
    ]);

    autoTable(doc, {
      startY: 49,
      head: [[
        "S. No.",
        "Material",
        "Required Quantity",
        "Unit",
        "Priority",
        "Purpose / Work",
      ]],
      body: rows,
      theme: "grid",
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        valign: "middle",
        overflow: "linebreak",
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 20, halign: "center" },
        1: { cellWidth: 65 },
        2: { cellWidth: 55, halign: "center" },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 30, halign: "center" },
        5: { cellWidth: 70 },
      },
      margin: { left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable.finalY + 15;
if (finalY + 20 > 270) {
  doc.addPage();
}
const signatureY =
  finalY + 20 > 270 ? 30 : finalY;
doc.setFont("Helvetica", "bold");
doc.setFontSize(10);
doc.setTextColor(0, 0, 0);
doc.text(managerName || "Manager", 270, signatureY, {
  align: "right",
});
doc.setFont("Helvetica", "normal");
doc.setFontSize(9);

doc.text("Authorized Signatory", 270, signatureY + 7, {
  align: "right",
});

    const safeSite = (batch.site || site || "Site")
      .replace(/[^a-zA-Z0-9]/g, "_");

    const safeBatch = (batch.batchId || "Requirement")
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    const fileName =
      `Requirement_${safeSite}.pdf`;

    if (Capacitor.isNativePlatform()) {
      const pdfBase64 = doc
        .output("datauristring")
        .split(",")[1];

      const saved = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Cache,
      });

      await Share.share({
        title: "Material Requirement PDF",
        text:
          `Material Requirement\n` +
          `Site: ${batch.site || site}\n` +
          `Batch: ${batch.batchId}`,
        files: [saved.uri],
        dialogTitle: "Share PDF",
      });
    } else {
      doc.save(fileName);
    }
  } catch (error) {
    console.error("Requirement PDF error:", error);

    alert(
      "PDF download/share nahi ho paya.\n" +
      (error?.message || "Unknown error")
    );
  }
};

  return (

    <div style={styles.page}>
      <div style={styles.card}>
        <h2>
          📦 Material Requirement
        </h2>
        <p style={styles.subtitle}>
          Create and track site material requirements
        </p>
        <div style={styles.section}>
          <label>Site</label>
          <input
            value={site}
            disabled
            style={styles.input}
          />
        </div>
        <div style={styles.section}>
          <label>Requirement Date</label>

          <input
            type="date"
            value={selectedDate}
            disabled
            style={styles.input}
          />

        </div>
        <div style={styles.section}>
          <label>Requirement For</label>
          <select
            value={category}
            onChange={(e) =>
              handleCategoryChange(e.target.value)
            }
            style={styles.input}
            required
          >
            <option value="">
              Select Department
            </option>

            {Object.keys(MATERIALS).map(
              (item) => (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              )
            )}
          </select>
        </div>
       

{category && (
  <div style={styles.section}>
    <label>Selected Materials</label>

    {items.map((item, index) => (
      <div
        key={item.id}
        style={{
          background: "#292929",
          padding: "18px 16px",
          marginTop: "12px",
          marginBottom: "12px",
          borderRadius: "10px",
          border: "1px solid #353535",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <strong>Material {index + 1}</strong>

          <button
            type="button"
            onClick={() => removeItem(item.id)}
            style={styles.deleteBtn}
          >
            Remove
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: "2 1 240px",
              minWidth: 0,
            }}
          >
            <label style={{ whiteSpace: "nowrap" }}>
              Material
            </label>

            <select
              value={item.material}
              onChange={(e) =>
                handleMaterialChange(item.id, e.target.value)
              }
              style={{
                ...styles.input,
                flex: 1,
                minWidth: 0,
                width: "100%",
                boxSizing: "border-box",
              }}
              required
            >
              <option value="">Select Material</option>

              {(MATERIALS[category] || []).map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {item.material === "Other" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: "1 1 200px",
                minWidth: 0,
              }}
            >
              <label style={{ whiteSpace: "nowrap" }}>
                Custom Name
              </label>

              <input
                type="text"
                value={item.customMaterial}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "customMaterial",
                    e.target.value
                  )
                }
                placeholder="Enter material"
                style={{
                  ...styles.input,
                  flex: 1,
                  minWidth: 0,
                  width: "100%",
                  boxSizing: "border-box",
                }}
                required
              />
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flex: "1 1 140px",
              minWidth: 0,
            }}
          >
            <label>Unit</label>

            {item.material === "Other" ? (
              <select
                value={item.unit}
                onChange={(e) =>
                  handleItemChange(
                    item.id,
                    "unit",
                    e.target.value
                  )
                }
                style={{
                  ...styles.input,
                  flex: 1,
                  minWidth: 0,
                  width: "100%",
                  boxSizing: "border-box",
                }}
                required
              >
                <option value="">Select Unit</option>

                {[
                  "Nos", "Kg", "Bag", "Ton", "CFT",
                  "m", "m²", "m³", "Litre", "Set",
                  "Sheet", "Roll", "Packet", "Pair",
                  "Day", "Trip", "Man-Day",
                ].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={item.unit}
                readOnly
                style={{
                  ...styles.input,
                  flex: 1,
                  minWidth: 0,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>

          <div style={{
              display: "flex", alignItems: "center", gap: "8px", flex: "1 1 210px", minWidth: 0, }}>
            <label style={{ whiteSpace: "nowrap" }}> Required Qty </label>
            <input
              type="number" min="0.01" step="any" value={item.quantity} onChange={(e) =>
                handleItemChange( item.id, "quantity", e.target.value) }
              placeholder="Quantity"
              style={{ ...styles.input, flex: 1, minWidth: 0, width: "100%", boxSizing: "border-box",}}
              required />
          </div>
        </div>
      </div>
    ))}

          <button type="button" onClick={addItem} style={styles.historyBtn}>
            + Add Another Material</button>
        </div> )}
        <div style={styles.section}>
          <label> Priority </label>
          <select value={priority} onChange={(e) => setPriority( e.target.value)}
            style={styles.input}>
            <option value="Normal"> Normal</option>
            <option value="Medium"> Medium</option>
            <option value="High"> High</option>
          </select>
        </div>

        <div style={styles.section}>
          <label> Purpose / Work</label>
          <input type="text" placeholder="e.g. RCC work at foundation" value={purpose} onChange={(e) =>
              setPurpose(e.target.value) } style={styles.input}/>
        </div>
              <button type="button" onClick={() => handleSubmit({ preventDefault: () => {}, }) }
                disabled={loading} style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",}} >
                {loading ? "Saving Requirement..." : "Save Requirement"}</button>
        <button onClick={() => {
            if (!showHistory) { fetchRequirements(); }
            setShowHistory( !showHistory ); }}
          style={styles.historyBtn} >
          {showHistory ? "Hide Requirement History ▲" : "View Requirement History ▼"} </button>
        {showHistory && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Material</th>
                  <th>Required</th>
                  {/* <th>Stock</th> */}
                  {/* <th>Shortage</th> */}
                  {/* <th>Required By</th> */}
                  <th>Priority</th>
                  {/* <th>Status</th> */}
                  <th>Action</th>
                </tr>
              </thead>
             
            <tbody>
              {groupedRequirements.length === 0 ? (
                <tr><td colSpan="6" style={styles.empty}>No requirements found</td></tr>
              ) : (
                groupedRequirements.map((r) => (
                  <tr key={r._id}>
                    <td> {r.date ? new Date(r.date).toLocaleDateString() : "-"}</td>
                    <td>{r.category || "-"}</td>
                    <td> {r.items .map((item) => item.material === "Other"
                            ? item.customMaterial || "Other": item.material) .join(", ")}</td>
                    <td> {r.items .map( (item) => `${item.quantity} ${item.unit}`) .join(", ")}</td>
                    <td> <span style={{...styles.badge,background:  r.priority === "High"
                              ? "#c0392b": r.priority === "Medium" ? "#e67e22" : "#3498db", }} >
                        {r.priority || "Normal"}</span></td>
                    <td> <button onClick={() => downloadPDF(r)} style={styles.pdfBtn} > 📄 Download PDF
                      </button>
                      <button onClick={() => handleDelete(r.requirementIds[0]) }
                        style={styles.deleteBtn}> Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
}
const styles = {
  page: {
    minHeight: "100vh",
    padding: "100px 20px",
    background: "#121212",
    color: "#fff",
  },
  card: {
    maxWidth: "1200px",
    margin: "auto",
    padding: "30px",
    background: "#1f1f1f",
    borderRadius: "12px",
    boxShadow:
      "0 10px 30px rgba(0,0,0,.3)",
  },
  subtitle: {
    color: "#aaa",
    marginBottom: "25px",
  },
  section: {
    marginBottom: "16px",
    display: "flex",
    flexDirection: "column",
  },
  input: {
    padding: "12px",
    marginTop: "7px",
    borderRadius: "7px",
    border: "1px solid #444",
    background: "#2c2c2c",
    color: "#fff",
    fontSize: "14px",
  },
  textarea: {
    minHeight: "90px",
    padding: "12px",
    marginTop: "7px",
    borderRadius: "7px",
    border: "1px solid #444",
    background: "#2c2c2c",
    color: "#fff",
    resize: "vertical",
  },


  materialBox: {
   display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(200px,1fr))",
    gap: "15px",
    padding: "18px",
    marginBottom: "18px",
    background: "#292929",
    borderRadius: "10px",
  },
  saveBtn: {
   width: "100%",
    padding: "13px",
    background: "#2ecc71",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    fontSize: "16px",
    cursor: "pointer",
  },
  historyBtn: {
    marginTop: "20px",
    padding: "11px 18px",
    background: "#3498db",
    color: "#fff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
  },
  tableWrapper: {
    overflowX: "auto",
  },
 table: {
    width: "100%",
    marginTop: "20px",
    borderCollapse: "collapse",
    background: "#222",
    minWidth: "1000px",
  },
  badge: {
    padding: "5px 9px",
    borderRadius: "15px",
    fontSize: "12px",
  },

  deleteBtn: {
    background: "#e74c3c",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "5px",
    cursor: "pointer",
 },
  empty: {
    padding: "30px",
    textAlign: "center",
    color: "#aaa",
  },

};


export default Requirement;
