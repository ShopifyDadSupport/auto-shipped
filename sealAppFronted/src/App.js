import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { DynamicItem, Sidebar, dummyData } from "./components";
import Dashboard from "./components/MainDash/MainDash";
import "./App.css";
import OrderDetailsData from "./components/Pagination/OrderDetailsData";
function App() {
  return (
    <div id="main">
      <Sidebar>
        <Routes>
        {/* <Route path="/orderdetails/:id" element={<OrderDetailsData/>} /> */}
          <Route  path="/" element={<Dashboard />}/>
          {dummyData &&
            dummyData.map((item, index) => (
              <Route
                key={index}
                path={item.path}
                element={<DynamicItem page={item.name} />}
              />
            ))}
        </Routes>
      </Sidebar>
    </div>
  );
}

export default App;
