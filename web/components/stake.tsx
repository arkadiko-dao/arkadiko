import React, { useEffect, useContext } from 'react';
import { AppContext } from '@common/context';
import { Helmet } from 'react-helmet';
import { Redirect } from 'react-router-dom';
import { Container } from './home';
import { StakeSectionDiko } from './stake-section-diko';
import { StakeSectionUsda } from './stake-section-usda';
import { StakeSectionLp } from './stake-section-lp';
import { StakeSectionMigrate } from './stake-section-migrate';

export const Stake = () => {
  const [state] = useContext(AppContext);

  useEffect(() => {
    if (state.currentTxStatus === 'success') {
      window.location.reload();
    }
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
            <StakeSectionDiko/>

            {/* USDA */}
            <StakeSectionUsda/>

            {/* LP */}
            <StakeSectionLp/>

          </main>
        </Container>
      ) : (
        <Redirect to={{ pathname: '/' }} />
      )}
    </>
  );
};
