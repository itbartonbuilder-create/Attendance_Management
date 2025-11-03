import React from "react";
import { useLocation } from "react-router-dom";

function Footer() {
    const location = useLocation();

  if (location.pathname === "/" || location.pathname === "/login") return null;
  return (
    <footer>
      <p>© 2025 Bartons Builders Limited. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
