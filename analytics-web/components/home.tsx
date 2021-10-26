import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ContainerProps {}
export const Container: React.FC<ContainerProps> = ({ children, ...props }) => {
  return (
    <div className="w-full min-h-screen bg-gray-100" {...props}>
      <div className="px-6 mx-auto max-w-7xl lg:px-8">
        {children}
      </div>
    </div>
  );
};

export const Home: React.FC = () => {
  const apiUrl = 'http://localhost:3000'; // TODO: process.env.REACT_APP_OFFCHAIN_API;
  const [pools, setPools] = useState([]);

  useEffect(() => {
    const fetchPools = async () => {
      const response = await axios.get(`${apiUrl}/api/v1/pools`);
      setPools(response.data.pools);
    };

    fetchPools();
  }, []);

  return (
    <Container>
      <span>Pools</span>
      {pools.length > 0 ? (
        <span>
          <p>{pools[0]['token_x_name']}-{pools[0]['token_y_name']}: TVL Token X = {pools[0]['tvl_token_x']} - TVL Token Y = {pools[0]['tvl_token_y']}</p>
          <p>{pools[1]['token_x_name']}-{pools[1]['token_y_name']}: TVL Token X = {pools[1]['tvl_token_x']} - TVL Token Y = {pools[1]['tvl_token_y']}</p>
          <p>{pools[2]['token_x_name']}-{pools[2]['token_y_name']}: TVL Token X = {pools[2]['tvl_token_x']} - TVL Token Y = {pools[2]['tvl_token_y']}</p>
        </span>
      ): (
        <span>Loading...</span>
      )}
    </Container>
  );
};
