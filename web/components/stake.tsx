import React, { useEffect, useContext, useState } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { StakeSectionDiko } from './stake-section-diko';
import { StakeSectionUsda } from './stake-section-usda';
import { StakeSectionLp } from './stake-section-lp';
import { StakeSectionMigrate } from './stake-section-migrate';
import axios from 'axios';
import { StakeSectionVest } from './stake-section-vest';

const apiUrl = 'https://arkadiko-api.herokuapp.com';

export const Stake = () => {
  const [state] = useContext(AppContext);
  const [loadingData, setLoadingData] = useState(true);
  const [apiData, setApiData] = useState({});

  async function fetchApiData() {
    const response = await axios.get(`${apiUrl}/api/v1/pages/stake`);
    const data = response.data;
    return data;
  }

  async function fetchData() {
    const newApiData = await fetchApiData();
    setApiData(newApiData);

    setLoadingData(false);
  }

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
    fetchData();
  }, [state.currentTxStatus]);

  return (
    <>
      <Helmet>
        <title>Stake</title>
      </Helmet>

      {state.userData ? (
        <Container>
          <main className="relative flex-1 py-12">
            
            {/* MIGRATE */}
            <StakeSectionMigrate/>
            
            {/* DIKO */}
            <StakeSectionDiko showLoadingState={loadingData} apiData={apiData}/>

            {/* USDA */}
            <StakeSectionUsda showLoadingState={loadingData} apiData={apiData}/>

            {/* LP */}
            <StakeSectionLp showLoadingState={loadingData} apiData={apiData}/>

            {/* VESTING */}
            <StakeSectionVest showLoadingState={loadingData}/>
            
          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </>
  );
};
