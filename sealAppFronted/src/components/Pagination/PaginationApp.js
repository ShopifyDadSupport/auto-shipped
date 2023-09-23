import React, { useState, useEffect, useMemo } from "react";
import Pagination from "./Pagination";
import "./usePagination";
import "./PaginationApp.css";
import axios from "axios";
import OrderDetails from "./OrderDetails";

let PageSize = 8;
export default function PaginationApp() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState([]); // State to hold the fetched data
  const [showCancelMessage, setShowCancelMessage] = useState();
  const [showOrderDetails, setShowOrderDetails] = useState(null);
  useEffect(() => {
    // Fetch data from the API
    fetch("https://chamonixsealapp.onrender.com/subscription/order")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  const handleCancel = (orderId) => {
    // Get the current date and time
    const dateObject = new Date();
    const numberOfDaysToAdd = 0; // Adjust this if you want to add a specific number of days
    dateObject.setDate(dateObject.getDate() + numberOfDaysToAdd);
    const updatedDate = dateObject.toISOString().slice(0, 10);

    // Extract hours and minutes from the date
    const hours = String(dateObject.getHours()).padStart(2, "0");
    const minutes = String(dateObject.getMinutes()).padStart(2, "0");

    // Form the formatted time string
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert to 12-hour format

    const formattedTime = `${hours12}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;

    const date_with_time = `${updatedDate} ${formattedTime}`;

    // Send a DELETE request to your backend API using Axios
    axios.post(`https://chamonixsealapp.onrender.com/subscription/order/${orderId}`, {
        cancellationDateTime: date_with_time,
      })
      .then(response => {
        // Remove the item from the data in state
        const updatedData = data.filter(item => item.subscription_order_id !== orderId);
        setData(updatedData);
        setShowCancelMessage(response.data.message);
        console.log(response.data.message);
      })
      .then((response) => {
        const updatedData = data.filter(
          (item) => item.subscription_order_id !== orderId
        );
        setData(updatedData);
        setShowCancelMessage(response.data.message);
        console.log(response.data.message);
      })
      .catch((error) => console.error("Error deleting data:", error));
  };

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.subscription_customer_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.subscription_customer_email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.subscription_order_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.subscription_order_id.includes(searchTerm)
    );
  }, [searchTerm, data]);

  const currentTableData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PageSize;
    const lastPageIndex = firstPageIndex + PageSize;
    return filteredData.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData]);

  return (
    <>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      <table>
        <thead>
          <tr>
            <th>Order name</th>
            <th>Customer Name</th>
            <th>Customer Email</th>
            <th>Order Date</th>
            <th>Order ID</th>
            <th>NextShipment Date</th>
            <th>Total Price</th>
            <th colSpan={3}>Status</th>
          </tr>
        </thead>
        <tbody>
          {currentTableData.length > 0 ? (
            currentTableData.map((item) => (
              <tr key={item.id}>
                <td>{item.subscription_order_name}</td>
                <td>{item.subscription_customer_name}</td>
                <td>{item.subscription_customer_email}</td>
                {/* <td>{formatDate(item.create_order_date)}</td> */}
                <td>{item.create_order_date}</td>
                <td>{item.subscription_order_id}</td>
                {/* <td>{formatDate(item.Next_Shipment_Date)}</td> */}
                <td>{item.Next_Shipment_Date}</td>
                <td>{item.subscription_total_price}</td>
                <td>{item.Status}</td>
                <td>
                  {item.Status === "Active" ? (
                    <button
                      className="delete__order"
                      onClick={() => handleCancel(item.subscription_order_id)}
                    >
                      Cancel
                    </button>
                  ) : (
                    <span>{item.Status}</span>
                  )}
                </td>
                <td>
                  <button
                    className="view__order"
                    onClick={() => {
                      console.log("View button clicked"); // Add this line
                      setShowOrderDetails(item);
                    }}
                  >
                    <svg
                      viewBox="0 0 20 20"
                      class="Polaris-Icon__Svg"
                      focusable="false"
                      aria-hidden="true"
                    >
                      <path d="M17.928 9.628C17.836 9.399 15.611 4 9.999 4S2.162 9.399 2.07 9.628a1.017 1.017 0 0 0 0 .744C2.162 10.601 4.387 16 9.999 16s7.837-5.399 7.929-5.628a1.017 1.017 0 0 0 0-.744zM9.999 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-6A2 2 0 1 0 10 12.001 2 2 0 0 0 10 8z"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center">
                No results found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {showOrderDetails && (
        <OrderDetails
          orderData={showOrderDetails}
          onClose={() => setShowOrderDetails(null)}
        />
      )}
      {!showOrderDetails && (
        <Pagination
          className="pagination-bar"
          currentPage={currentPage}
          totalCount={filteredData.length}
          pageSize={PageSize}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </>
  );
}
