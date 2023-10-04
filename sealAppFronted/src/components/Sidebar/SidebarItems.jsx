import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  ItemsList,
  ItemContainer,
  ItemWrapper,
  ItemName,
} from "./SidebarStyles";
import LogoutIcon from '@mui/icons-material/Logout';
import { dummyData } from "..";
import Logout from "@mui/icons-material/Logout";

const SidebarItems = ({ displaySidebar }) => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState(0);

  const  LogoutFun = () =>{
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("lastActivity");
    navigate("/");
  }
  return (
    <>
    <ItemsList className="sidebar_content">
      {dummyData.map((itemData, index) => (
        <ItemContainer
          key={index}
          onClick={() => setActiveItem(itemData.id)}
          className={itemData.id === activeItem ? "active" : ""}
        >
          <Link to={itemData.path}>
            <ItemWrapper>
              {itemData.icon}
              <ItemName displaySidebar={displaySidebar}>
                {itemData.name}
              </ItemName>
            </ItemWrapper>
          </Link>
        </ItemContainer>
      ))}
  { (window.location.href === "https://auto-shipped.onrender.com/" || window.location.href === "https://auto-shipped.onrender.com/dashboards" || window.location.href === "https://auto-shipped.onrender.com/Subscriptions" || window.location.href === "https://auto-shipped.onrender.com/AddInterval"|| window.location.href === "https://auto-shipped.onrender.com/Settings"|| window.location.href === "https://auto-shipped.onrender.com/AddPage")&& (
  <li onClick={LogoutFun} class="sc-iBkjds ilfVKo">
    <a href="">
      <div class="sc-ftvSup hkXtBw">
        <LogoutIcon/><span class="sc-papXJ crzyBt">Logout</span>
      </div>
    </a>
  </li>
)}

    </ItemsList>
    {/* <h1></h1> */}
    </>
  );
};

export default SidebarItems;
