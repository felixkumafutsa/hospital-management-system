
import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/axios';

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      const response = await api.get('/pharmacy/inventory');
      setInventory(response.data.data);
    };
    fetchInventory();
  }, []);

  return (
    <div>
      <h1>Pharmacy Inventory</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Inventory;