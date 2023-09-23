import React, { useState, useEffect, useMemo } from 'react';
import Pagination from './Pagination';
import './usePagination';
import './PaginationApp.css';

let PageSize = 10;
export default function SubscriptionUppcoming() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState([]); // State to hold the fetched data

  useEffect(() => {
    // Fetch data from the API
    fetch('https://sealapp-kn3m.onrender.com/subscription/order')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  // const formatDate = (dateString) => {
  //   const date = new Date(dateString);
  //   return `${date.toLocaleDateString('en-US')} ${date.toLocaleTimeString('en-US')}`;
  // };

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.subscription_customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subscription_customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subscription_order_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            <th>NextShipment Date</th>
            <th>Total Price</th>
          </tr> 
        </thead>
        <tbody>
          {currentTableData.length > 0 ? (
            currentTableData.map((item) => (
              <tr key={item.id}>
                <td>{item.subscription_order_name}</td>
                <td>{item.subscription_customer_name}</td>
                <td>{item.subscription_customer_email}</td>
                {/* <td>{formatDate(item.Next_Shipment_Date)}</td> */}
                <td>{item.Next_Shipment_Date}</td>
                <td>{item.subscription_total_price}</td>
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
      <Pagination
        className="pagination-bar"
        currentPage={currentPage}
        totalCount={filteredData.length}
        pageSize={PageSize}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </>
  );
}
