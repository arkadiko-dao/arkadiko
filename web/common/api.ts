import axios from 'axios';

export const getPair = async (
  tokenXAddress: string,
  tokenXName: string,
  tokenYAddress: string,
  tokenYName: string
) => {
  const apiUrl = 'https://arkadiko-api.herokuapp.com';
  const fetchPools = async () => {
    const response = await axios.get(`${apiUrl}/api/v1/pools`);
    const array: any = [];
    response.data.pools.forEach((pool: any) => {
      array.push(pool);
    });
    console.log(array);
    return array;
  };

  const pools = await fetchPools();
  return pools;
};

export const getStakeData = async () => {
  const apiUrl = 'https://arkadiko-api.herokuapp.com';
};
